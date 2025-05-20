import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const key = Buffer.from(process.env.ENCRYPTION_KEY!, "hex");
const iv = randomBytes(16);

export function encrypt(text: string): { encryptedData: string; iv: string } {
  console.log("Encryption key:", process.env.ENCRYPTION_KEY);
  const cipher = createCipheriv("aes-256-cbc", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(text, "utf8"),
    cipher.final(),
  ]);
  return {
    encryptedData: encrypted.toString("hex"),
    iv: iv.toString("hex"),
  };
}

export function decrypt(encryptedData: string, ivHex: string): string {
  const iv = Buffer.from(ivHex, "hex");
  const decipher = createDecipheriv("aes-256-cbc", key, iv);
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedData, "hex")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}
