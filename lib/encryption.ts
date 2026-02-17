// ============================================================
// TellSafe — Email Encryption for Anonymous Relay
// ============================================================
// AES-256-GCM encryption for relay email addresses.
// The encryption key lives ONLY in server environment variables.
// This module should ONLY be imported server-side.

import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // 128-bit IV for GCM
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const key = process.env.TELLSAFE_RELAY_ENCRYPTION_KEY;
  if (!key) {
    throw new Error(
      "TELLSAFE_RELAY_ENCRYPTION_KEY is not set. " +
        "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    );
  }
  return Buffer.from(key, "hex");
}

/**
 * Encrypt an email address for storage in Firestore.
 * Returns a base64 string containing: IV + AuthTag + CipherText
 */
export function encryptEmail(email: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  let encrypted = cipher.update(email, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();

  // Pack: IV (16) + AuthTag (16) + CipherText
  const packed = Buffer.concat([
    iv,
    authTag,
    Buffer.from(encrypted, "hex"),
  ]);

  return packed.toString("base64");
}

/**
 * Decrypt an email address from Firestore storage.
 * Expects the base64 format produced by encryptEmail.
 */
export function decryptEmail(encryptedData: string): string {
  const key = getEncryptionKey();
  const packed = Buffer.from(encryptedData, "base64");

  // Unpack: IV (16) + AuthTag (16) + CipherText (rest)
  const iv = packed.subarray(0, IV_LENGTH);
  const authTag = packed.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const cipherText = packed.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(cipherText.toString("hex"), "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Verify that the encryption key is properly configured.
 * Call this at startup to fail fast.
 */
export function verifyEncryptionSetup(): boolean {
  try {
    const testEmail = "test@tellsafe.app";
    const encrypted = encryptEmail(testEmail);
    const decrypted = decryptEmail(encrypted);
    return decrypted === testEmail;
  } catch {
    return false;
  }
}
