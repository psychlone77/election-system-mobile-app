import {
  blind,
  ensureBlindRSA,
  finalize,
  hexToUint8Array,
  uint8ArrayToB64,
  verify,
} from "@/utils/blind-rsa";
import { concatUint8, pemToCryptoKey, signWithStoredPrivateKey } from "@/utils/crypto-utils";
import { Buffer } from "buffer";
import * as Crypto from "expo-crypto";
import { getItemAsync } from "expo-secure-store";
import { Platform } from "react-native";
import axiosInstance from "./api";

/**
 * Fetch ES public key (expects JWK or a base64 exported SPKI depending on server).
 */
export async function getESPublicKey() {
  const response = await axiosInstance.get("/public-key");
  return response.data;
}

/**
 * Get a token signed by the ES using blind signature protocol.
 * Steps:
 *  - Load user NIC & private key
 *  - Prepare message (hash of nic + privateKey)
 *  - Fetch ES public key
 *  - Blind message -> (blinded, inv)
 *  - Send blinded to server /blind-sign endpoint -> receive blindSig (base64)
 *  - Finalize blindSig with inv and preparedMessage -> signature
 *  - Return signature (base64) and raw prepared message for verification
 */
export async function getTokenSigned() {
  if (Platform.OS === "web") {
    throw new Error("getTokenSigned is not implemented for web platform");
  }

  const nic = await getItemAsync("userNIC");
  const privateKey = await getItemAsync(`privateKey_${nic}`);
  console.log("NIC and private key loaded:", nic, privateKey);

  if (!nic || !privateKey) {
    throw new Error("User NIC or private key not found");
  }

  // Create deterministic message to sign: SHA256(nic + privateKey) as bytes
  const dataToHash = nic + privateKey;
  // Expo Crypto returns a hex digest by default — convert hex to bytes
  const hashHex = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, dataToHash);
  const messageBytes = hexToUint8Array(hashHex);

  const RSABSSAlib = await ensureBlindRSA();
  const suite = RSABSSAlib.SHA384.PSS.Randomized();

  // Fetch ES public key; server should return JWK or base64 SPKI
  const esKeyResponse = await getESPublicKey();
  console.log("ES Public Key Response:", esKeyResponse);
  // Determine format and import the key into WebCrypto CryptoKey expected by blindrsa-ts
  const publicKeyCrypto = await pemToCryptoKey(esKeyResponse, "public");

  // Blind the message
  //   console.log("Blinded message:", publicKeyCrypto);
  const { blindedMsg, inv, preparedMessage } = await blind(suite, messageBytes, publicKeyCrypto);
  //   console.log("Blinded data:", blindedMsg, inv, preparedMessage);
  const nicBytes = new TextEncoder().encode(nic);
  const payloadToSign = concatUint8([blindedMsg, nicBytes]);

  const provenanceSig = await signWithStoredPrivateKey(privateKey, payloadToSign);
  // Sign blinded message, inv, nic with private key

  // Send blinded message + nic + provenance signature to server for blind-signing
  const resp = await axiosInstance.post("/request-token", {
    NIC: nic,
    blinded_token: uint8ArrayToB64(blindedMsg),
    signature: uint8ArrayToB64(provenanceSig),
  });

  // Server should return blindSignature (base64)
  const blindSignatureB64 = resp.data?.blindSignature;

  if (!blindSignatureB64) {
    throw new Error("No blind signature returned from server");
  }

  const blindSignature = new Uint8Array(Buffer.from(blindSignatureB64, "base64"));

  // Finalize the blinded signature into a usable signature
  const signatureUint8 = await finalize(
    suite,
    publicKeyCrypto,
    preparedMessage,
    blindSignature,
    inv
  );

  // Optionally verify locally
  try {
    const ok = await verify(suite, publicKeyCrypto, signatureUint8, preparedMessage);
    console.log("Final signature verified locally:", ok);
  } catch (err) {
    console.warn("Local verification failed:", err);
  }

  return {
    signature: uint8ArrayToB64(signatureUint8), // final signature (base64)
    preparedMessage: uint8ArrayToB64(preparedMessage),
    rawHashHex: hashHex,
  };
}
