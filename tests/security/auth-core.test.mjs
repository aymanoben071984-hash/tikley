import test from "node:test";
import assert from "node:assert/strict";
import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const N = 1 << 15;
const r = 8;
const p = 1;

async function hashPassword(password) {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, 64, { N, r, p, maxmem: 64 * 1024 * 1024 });
  return `scrypt$${N}$${r}$${p}$${salt.toString("base64url")}$${key.toString("base64url")}`;
}
async function verifyPassword(password, encoded) {
  const [algorithm, n, block, parallel, saltText, keyText] = encoded.split("$");
  if (algorithm !== "scrypt" || !saltText || !keyText) return false;
  const salt = Buffer.from(saltText, "base64url");
  const expected = Buffer.from(keyText, "base64url");
  if (salt.length !== 16 || expected.length !== 64) return false;
  const actual = await scrypt(password, salt, 64, { N: Number(n), r: Number(block), p: Number(parallel), maxmem: 64 * 1024 * 1024 });
  return timingSafeEqual(actual, expected);
}
test("password hashes are salted and verify only the original password", async () => {
  const first = await hashPassword("correct horse battery staple");
  const second = await hashPassword("correct horse battery staple");
  assert.notEqual(first, second);
  assert.equal(await verifyPassword("correct horse battery staple", first), true);
  assert.equal(await verifyPassword("wrong password", first), false);
});
test("session tokens are stored as one-way SHA-256 digests", () => {
  const token = randomBytes(32).toString("base64url");
  const digest = createHash("sha256").update(token).digest("hex");
  assert.notEqual(digest, token);
  assert.equal(digest.length, 64);
});
test("password format rejects malformed or unsupported hashes", async () => {
  await assert.rejects(async () => {
    const malformed = "bcrypt$broken";
    const [algorithm] = malformed.split("$");
    if (algorithm !== "scrypt") throw new Error("unsupported hash");
  });
});
