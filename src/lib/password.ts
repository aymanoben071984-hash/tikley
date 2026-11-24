import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;
const SCRYPT_OPTIONS = { N: 1 << 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = (await scrypt(password, salt, KEY_LENGTH, SCRYPT_OPTIONS)) as Buffer;
  return `scrypt$${SCRYPT_OPTIONS.N}$${SCRYPT_OPTIONS.r}$${SCRYPT_OPTIONS.p}$${salt.toString("base64url")}$${derived.toString("base64url")}`;
}

export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  const [algorithm, n, r, p, saltText, hashText] = encoded.split("$");
  if (algorithm !== "scrypt" || !n || !r || !p || !saltText || !hashText) return false;
  const salt = Buffer.from(saltText, "base64url");
  const expected = Buffer.from(hashText, "base64url");
  if (salt.length !== 16 || expected.length !== KEY_LENGTH) return false;
  try {
    const actual = (await scrypt(password, salt, expected.length, {
      N: Number(n), r: Number(r), p: Number(p), maxmem: 64 * 1024 * 1024,
    })) as Buffer;
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
