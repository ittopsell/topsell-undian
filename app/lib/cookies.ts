import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY = process.env.COOKIE_SECRET || "change_this_to_env_secret_32bytes!";
const IV_LENGTH = 12; // AES GCM standard

export function encryptCookie(data: string) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(KEY, "utf-8"), iv);

  let encrypted = cipher.update(data, "utf8", "base64");
  encrypted += cipher.final("base64");
  const tag = cipher.getAuthTag();

  // Return iv + tag + encrypted as base64
  return `${iv.toString("base64")}:${tag.toString("base64")}:${encrypted}`;
}

export function decryptCookie(encryptedString: string) {
  const [ivB64, tagB64, data] = encryptedString.split(":");
  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");

  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(KEY, "utf-8"), iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(data, "base64", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
