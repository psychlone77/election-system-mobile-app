import { encryptBallot, encryptKeyWithPublicKey, pemToDer } from "@/utils/crypto-utils";
import { Buffer } from "buffer";
import { ballotServerInstance, tallyingServerInstance } from "./api";

interface BallotSubmissionPayload {
  candidateId: string;
  signature: string; // base64 from getTokenSigned
  preparedMessage: string; // base64 from getTokenSigned
}

async function getTallyingServerPublicKey(): Promise<string> {
  const response = await tallyingServerInstance.get("/public-key");
  return response.data;
}

async function getBallotBoxServerPublicKey(): Promise<string> {
  const response = await ballotServerInstance.get("/public-key");
  return response.data;
}

/**
 * Submit ballot to ballot box server.
 * Steps:
 *  1. Create ballot JSON: { candidateId, vote: true }
 *  2. Encrypt ballot with AES-256-GCM
 *  3. Fetch tallying server public key
 *  4. Encrypt AES key with tallying server's RSA public key
 *  5. POST to /submit-ballot with encrypted ballot, encrypted key, token (signature), and prepared message
 */
export async function submitBallot(payload: BallotSubmissionPayload) {
  const { candidateId, signature, preparedMessage } = payload;

  // Step 1: Create ballot content
  const ballotContent = {
    [candidateId]: 1,
  };

  // Step 2: Encrypt ballot with AES-256-GCM
  const { ciphertext, iv, aesKey } = await encryptBallot(ballotContent);
  // Step 3: Fetch tallying server public key
  const tallyPublicKey = await getTallyingServerPublicKey();

  // Step 4: Encrypt AES key with tallying server's RSA public key
  const encryptedKey = await encryptKeyWithPublicKey(aesKey, tallyPublicKey);
  // Step 5: Submit to ballot box server (using ballotServerInstance for BS_URL)
  const response = await ballotServerInstance.post("/submit-ballot", {
    encryptedBallot: ciphertext,
    iv,
    encryptedKey, // AES key encrypted with tallying server's RSA public key
    token_signature: signature, // blind signature token
    token: preparedMessage, // for verification on server
  });

  //verify response with hash, ballotID and signature received
  const ballotId = response.data.ballotId;
  const responseSignature = response.data.signature;
  console.log("Response Data:", response.data);
  const ballotBoxPublicPem = await getBallotBoxServerPublicKey();
  const ballotBoxPublicKey = pemToDer(ballotBoxPublicPem);

  if (!ballotId || !responseSignature) {
    throw new Error("Missing ballotId or signature in response");
  }

  const dataToHash = Buffer.concat([
    Buffer.from(ballotId, "utf8"),
    Buffer.from(String(ciphertext), "utf8"),
  ]);
  const hash = await crypto.subtle.digest("SHA-256", dataToHash);
  console.log("Hash for verification:", Buffer.from(hash).toString("hex"));
  const signatureBuffer = Buffer.from(responseSignature, "base64");
  const publicKeyObject = await crypto.subtle.importKey(
    "spki",
    ballotBoxPublicKey,
    { name: "RSA-PSS", hash: "SHA-384" },
    false,
    ["verify"]
  );
  console.log("Public Key Object:", publicKeyObject);

  const isValid = await crypto.subtle.verify(
    {
      name: "RSA-PSS",
      saltLength: 64,
    },
    publicKeyObject,
    signatureBuffer,
    hash
  );

  if (!isValid) {
    throw new Error("Response signature verification failed");
  }
  return {
    success: response.data.success ?? true,
    message: response.data.message ?? "Ballot submitted successfully",
    ballotId: response.data.ballotId,
    ciphertext,
    hash: Buffer.from(hash).toString("hex"),
  };
}
