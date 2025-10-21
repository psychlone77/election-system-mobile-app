import { Buffer } from "buffer";

let RSABSSA: any = null;
export async function ensureBlindRSA() {
  if (RSABSSA) return RSABSSA;
  try {
    // Try a runtime require first (avoids static module resolution during typecheck/build)
    const maybeRequire =
      (globalThis as any).require || (globalThis as any).__non_webpack_require__ || null;
    let mod: any = null;
    if (maybeRequire) {
      try {
        mod = maybeRequire("@" + "cloudflare/blindrsa-ts");
      } catch {
        // fall through to dynamic import
      }
    }

    if (!mod) {
      // final fallback — dynamic import. Using concatenation avoids static module resolution by analyzers
      // @ts-ignore
      mod = await import("@" + "cloudflare/blindrsa-ts");
    }

    RSABSSA = mod.RSABSSA;
    return RSABSSA;
  } catch (err) {
    console.warn("blindrsa-ts import failed:", err);
    throw new Error(
      "@cloudflare/blindrsa-ts is required for blind-sign operations. Please install it as a dependency."
    );
  }
}

/* Utility: base64 helpers */
export function b64ToUint8Array(b64: string) {
  if (typeof Buffer !== "undefined") {
    return Uint8Array.from(Buffer.from(b64, "base64"));
  }
  // browser fallback
  const binary = atob(b64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function uint8ArrayToB64(u8: Uint8Array) {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(u8).toString("base64");
  }
  let binary = "";
  for (let i = 0; i < u8.length; i++) binary += String.fromCharCode(u8[i]);
  return btoa(binary);
}

export function hexToUint8Array(hex: string) {
  if (!hex) return new Uint8Array();
  const clean = hex.replace(/^0x/, "");
  const len = clean.length / 2;
  const out = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    out[i] = parseInt(clean.substr(i * 2, 2), 16);
  }
  return out;
}

/**
 * Create a suite instance. Default to SHA384.PSS.Randomized per server.
 */
export async function createSuite() {
  const lib = await ensureBlindRSA();
  return lib.SHA384.PSS.Randomized();
}

/**
 * Blind a message using the suite and a public key (CryptoKey from JWK or WebCrypto)
 */
export async function blind(
  suite: any,
  message: Uint8Array | Buffer,
  publicKey: CryptoKey
): Promise<{
  blindedMsg: Uint8Array;
  inv: Uint8Array;
  preparedMessage: Uint8Array;
}> {
  const preparedMessage = suite.prepare(
    message instanceof Uint8Array ? message : new Uint8Array(message)
  );
  const BlindOutput = await suite.blind(publicKey, preparedMessage);
  return {
    ...BlindOutput,
    preparedMessage,
  };
}

/**
 * Finalize a blinded signature into a usable signature.
 */
export async function finalize(
  suite: any,
  publicKey: CryptoKey,
  preparedMessage: Uint8Array | ArrayBuffer,
  blindSignature: Uint8Array,
  inv: Uint8Array
) {
  return suite.finalize(publicKey, preparedMessage as Uint8Array, blindSignature, inv);
}

/**
 * Server: blind-sign a blinded message using the private key
 */
export async function signBlinded(
  suite: any,
  privateKey: CryptoKey,
  blinded: Uint8Array | Buffer | string
) {
  if (typeof blinded === "string") {
    blinded = b64ToUint8Array(blinded);
  }
  return suite.blindSign(privateKey, blinded as Uint8Array);
}

/**
 * Verify a signature.
 */
export async function verify(
  suite: any,
  publicKey: CryptoKey,
  signature: Uint8Array | Buffer,
  preparedMessage: Uint8Array | Buffer
) {
  return suite.verify(publicKey, signature as Uint8Array, preparedMessage as Uint8Array);
}
