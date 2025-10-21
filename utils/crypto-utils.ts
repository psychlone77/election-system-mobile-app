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
