import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";
const FIXED_IV = Buffer.alloc(16, 0);

export function encryptData(plaintext, secret) {
  if (!plaintext || !secret) throw new Error("plaintext and secret required");

  const key = crypto.createHash("sha256").update(secret).digest();

  const cipher = crypto.createCipheriv(ALGORITHM, key, FIXED_IV);
  let encrypted = cipher.update(plaintext, "utf8", "base64");
  encrypted += cipher.final("base64");

  return encrypted;
}

export function decryptData(encryptedText, secret) {
  try {
    if (!encryptedText || !secret)
      throw new Error("encryptedText and secret required");

    const key = crypto.createHash("sha256").update(secret).digest();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, FIXED_IV);

    let decrypted = decipher.update(encryptedText, "base64", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error(" Decryption failed:", error.message);
    return null;
  }
}
