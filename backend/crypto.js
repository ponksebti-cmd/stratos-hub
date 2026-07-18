// crypto.js — AES-256-GCM for BYOK key storage (MVP spec requirement)
// Keys are NEVER stored in plaintext.

const MASTER_SECRET = process.env.MASTER_SECRET;
if (!MASTER_SECRET) {
  console.error("[crypto] WARNING: MASTER_SECRET is not set. API key encryption will fail.");
}

async function getMasterKey() {
  if (!MASTER_SECRET) {
    throw new Error("MASTER_SECRET is not configured. Please set it in your environment variables.");
  }
  const raw = new TextEncoder().encode(MASTER_SECRET.padEnd(32).slice(0, 32));
  return crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

export async function encryptKey(plaintext) {
  const key = await getMasterKey();
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM
  const encoded = new TextEncoder().encode(plaintext);
  const cipherBuf = await crypto.subtle.encrypt({ name: "AES-GCM", iv, tagLength: 128 }, key, encoded);
  // ciphertext = actual cipher | last 16 bytes is auth tag
  const cipher = new Uint8Array(cipherBuf);
  const tag = cipher.slice(-16);
  const ciphertext = cipher.slice(0, -16);
  return {
    enc: Buffer.from(ciphertext).toString("base64"),
    iv: Buffer.from(iv).toString("base64"),
    tag: Buffer.from(tag).toString("base64"),
  };
}

export async function decryptKey({ enc, iv, tag }) {
  const key = await getMasterKey();
  const ciphertext = Buffer.from(enc, "base64");
  const ivBuf = Buffer.from(iv, "base64");
  const tagBuf = Buffer.from(tag, "base64");
  // Reconstruct with tag appended
  const withTag = new Uint8Array(ciphertext.length + tagBuf.length);
  withTag.set(ciphertext);
  withTag.set(tagBuf, ciphertext.length);
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivBuf, tagLength: 128 },
    key,
    withTag
  );
  return new TextDecoder().decode(plain);
}
