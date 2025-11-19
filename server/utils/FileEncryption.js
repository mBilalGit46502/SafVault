import CryptoJS from "crypto-js";

const MASTER_KEY = process.env.FILE_ENCRYPTION_SECRET || "fallback_master_key";

console.log(MASTER_KEY);

export const encryptData = (data, userKey) => {
  try {
    const key = userKey || MASTER_KEY;
    const text = typeof data === "string" ? data : JSON.stringify(data);
    const ciphertext = CryptoJS.AES.encrypt(text, key).toString();
    return ciphertext;
  } catch (err) {
    console.error(" Encryption failed:", err);
    return null;
  }
};

export const decryptData = (ciphertext, userKey) => {
  try {
    const key = userKey || MASTER_KEY;
    const bytes = CryptoJS.AES.decrypt(ciphertext, key);
    const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
    try {
      return JSON.parse(decryptedText);
    } catch {
      return decryptedText;
    }
  } catch (err) {
    console.error(" Decryption failed:", err);
    return null;
  }
};
