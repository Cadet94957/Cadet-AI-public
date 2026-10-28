import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

const KEY_LENGTH = 64;

/** Hash a password with scrypt. Format: scrypt$<saltHex>$<hashHex> */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

/**
 * Verify a password against a stored hash. Returns false (never throws) for
 * legacy placeholder passwords that aren't in the scrypt format.
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const [, salt, hashHex] = parts;
  try {
    const expected = Buffer.from(hashHex, "hex");
    const derived = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
    return expected.length === derived.length && timingSafeEqual(expected, derived);
  } catch {
    return false;
  }
}
