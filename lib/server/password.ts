/**
 * Password hashing with scrypt from `node:crypto` — no external dependency.
 * Stored format: `scrypt$<keylen>$<saltHex>$<hashHex>`.
 */
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

const KEY_LENGTH = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, KEY_LENGTH);
  return `scrypt$${KEY_LENGTH}$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, keylen, saltHex, hashHex] = stored.split("$");
  if (scheme !== "scrypt" || !keylen || !saltHex || !hashHex) return false;

  const expected = Buffer.from(hashHex, "hex");
  const actual = await scrypt(password, Buffer.from(saltHex, "hex"), Number(keylen));
  // Lengths must match before timingSafeEqual, which throws otherwise.
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
