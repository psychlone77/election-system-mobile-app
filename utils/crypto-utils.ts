import { Buffer } from "buffer";
import nacl from "tweetnacl";

export function toPem(header: string, buf: ArrayBuffer) {
  const b64 = Buffer.from(buf).toString("base64");
  const lines = b64.match(/.{1,64}/g) || [];
  return `-----BEGIN ${header}-----\n${lines.join("\n")}\n-----END ${header}-----\n`;
}

export function pemToDer(pem: string) {
  const b64 = pem.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  return Buffer.from(b64, "base64");
}

export async function pemToCryptoKey(pem: string, type: "public" | "private"): Promise<CryptoKey> {
  const der = pemToDer(pem);
  return await crypto.subtle.importKey(
    type === "public" ? "spki" : "pkcs8",
    der,
    { name: "RSA-PSS", hash: "SHA-384" },
    true,
    [type === "public" ? "verify" : "sign"]
  );
}

export async function pemToCryptoKeyOAEP(
  pem: string,
  type: "public" | "private"
): Promise<CryptoKey> {
  const der = pemToDer(pem);
  const usages: KeyUsage[] = type === "public" ? ["encrypt", "wrapKey"] : ["decrypt", "unwrapKey"];
  return await crypto.subtle.importKey(
    type === "public" ? "spki" : "pkcs8",
    der,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    usages
  );
}

/**
 * concat multiple Uint8Array into one
 */
export function concatUint8(arrs: Uint8Array[]) {
  const total = arrs.reduce((s, a) => s + a.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const a of arrs) {
    out.set(a, offset);
    offset += a.length;
  }
  return out;
}

/**
 * Sign given data (Uint8Array) using stored private key string.
 * Supports:
 *  - PEM PKCS8/RSA private key (uses crypto.subtle.sign with RSA-PSS SHA-384)
 *  - base64 NaCl secretKey (64 bytes) OR seed (32 bytes) -> uses tweetnacl
 */
export async function signWithStoredPrivateKey(
  privateKeyStr: string,
  data: Uint8Array
): Promise<Uint8Array> {
  // PEM / PKCS8 path
  if (privateKeyStr.trim().startsWith("-----BEGIN")) {
    // import as CryptoKey via pemToCryptoKey
    const cryptoKey = await pemToCryptoKey(privateKeyStr, "private");
    const subtle = (global as any).crypto?.subtle;
    if (!subtle || typeof subtle.sign !== "function") {
      throw new Error(
        "crypto.subtle.sign is not available. Ensure a WebCrypto polyfill is loaded."
      );
    }
    // RSA-PSS with SHA-384 -> saltLength = 48 (hash output bytes)
    const sigBuf = await subtle.sign({ name: "RSA-PSS", saltLength: 48 }, cryptoKey, data.buffer);
    return new Uint8Array(sigBuf);
  }

  // Otherwise assume base64 NaCl secretKey or seed
  const raw = Buffer.from(privateKeyStr, "base64");
  let secretKey: Uint8Array;
  if (raw.length === 64) {
    secretKey = new Uint8Array(raw);
  } else if (raw.length === 32) {
    // it's a seed — derive keypair
    const keyPair = nacl.sign.keyPair.fromSeed(new Uint8Array(raw));
    secretKey = keyPair.secretKey;
  } else {
    throw new Error("Unsupported private key format. Expect PEM or base64 NaCl seed/secretKey.");
  }

  const sig = nacl.sign.detached(data, secretKey);
  return sig;
}

/**
 * Encrypt ballot content using AES-256-GCM.
 * Returns { ciphertext, iv, authTag } all as base64 strings.
 */
export async function encryptBallot(ballotContent: { [x: string]: number }) {
  // If key not provided, generate random 256-bit key
  const key = await global.crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true, // extractable
    ["encrypt", "decrypt"] // key usages
  );
  // Generate random 12-byte IV (96 bits for GCM)
  const iv = new Uint8Array(global.crypto.getRandomValues(new Uint8Array(12)));
  // Prepare plaintext: JSON of ballot content
  const plaintext = JSON.stringify(ballotContent);
  const plaintextBytes = new TextEncoder().encode(plaintext);

  // Encrypt
  const encrypted = await global.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    plaintextBytes
  );

  return {
    ciphertext: Buffer.from(encrypted).toString("base64"),
    iv: Buffer.from(iv).toString("base64"),
    aesKey: key,
  };
}

/**
 * Decrypt ballot content using AES-256-GCM.
 */
export async function decryptBallot(
  ciphertextB64: string,
  ivB64: string,
  authTagB64: string,
  aesKeyB64: string
): Promise<{ candidateId: string; vote: boolean }> {
  const ciphertext = Buffer.from(ciphertextB64, "base64");
  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(authTagB64, "base64");
  const aesKey = Buffer.from(aesKeyB64, "base64");

  // Reconstruct encrypted data (ciphertext + authTag)
  const encrypted = concatUint8([new Uint8Array(ciphertext), new Uint8Array(authTag)]);

  // Import key
  const cryptoKey = await (global as any).crypto.subtle.importKey(
    "raw",
    new Uint8Array(aesKey),
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );

  // Decrypt
  const decrypted = await (global as any).crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(iv) },
    cryptoKey,
    encrypted.buffer
  );

  const plaintext = new TextDecoder().decode(decrypted);
  return JSON.parse(plaintext);
}

/**
 * Encrypt AES key using tallying server's RSA public key (RSA-OAEP with SHA-256).
 * Accepts PEM or JWK format, or raw hex string.
 */
export async function encryptKeyWithPublicKey(
  aesKey: CryptoKey,
  tallyingServerPublicKey: string | any
): Promise<string> {
  // Import tallying server public key
  let serverPublicKey: CryptoKey;

  if (typeof tallyingServerPublicKey === "string") {
    // Check if it's PEM or hex
    if (tallyingServerPublicKey.includes("-----BEGIN")) {
      // PEM format
      serverPublicKey = await pemToCryptoKeyOAEP(tallyingServerPublicKey, "public");
    } else {
      // Assume hex format (raw RSA modulus)
      // For 4096-bit key: 4096 / 8 = 512 bytes = 1024 hex chars
      const keyBytes = new Uint8Array(Buffer.from(tallyingServerPublicKey, "hex"));

      // Build JWK from hex modulus (assuming standard RSA exponent 65537)
      const jwk: JsonWebKey = {
        kty: "RSA",
        n: Buffer.from(keyBytes).toString("base64url"), // modulus
        e: "AQAB", // exponent 65537 in base64url
        alg: "RSA-OAEP",
        ext: true,
      };

      serverPublicKey = await global.crypto.subtle.importKey(
        "jwk",
        jwk,
        { name: "RSA-OAEP", hash: { name: "SHA-256" } },
        true,
        ["encrypt"]
      );
    }
  } else {
    throw new Error(
      "Unsupported public key format. Expected PEM string, hex string, or JWK object."
    );
  }
  console.log("Imported server public key:", serverPublicKey);

  console.info("Encrypting AES key with RSA-OAEP...", aesKey);
  // Encrypt AES key directly using RSA-OAEP (simpler than wrapKey, avoids algorithm mismatch)
  const encryptedKey = await crypto.subtle.wrapKey("raw", aesKey, serverPublicKey, "RSA-OAEP");
  console.log("Encrypted AES key buffer:", encryptedKey.byteLength);
  return Buffer.from(encryptedKey).toString("base64");
}
