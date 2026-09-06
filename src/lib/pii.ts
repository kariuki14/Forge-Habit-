import type { User, UserKey } from "@prisma/client";
import {
  decryptField,
  emailIndex,
  encryptField,
  unwrapDek,
} from "@/lib/crypto";

/**
 * PII helpers. User rows store email/fullName/avatarUrl/bio as AES-256-GCM
 * ciphertext under a per-user DEK (UserKey.wrappedDek, wrapped by the KEK).
 * Query users by `emailIndex(email)` — never by the email column directly.
 * Legacy plaintext rows (pre-encryption, no UserKey) pass through unchanged.
 */

export type UserWithKey = User & { key: UserKey | null };

/** Encrypt PII fields for storage on create/update. */
export function encryptUserFields(
  dek: Buffer,
  fields: { email: string; fullName: string; avatarUrl?: string | null; bio?: string | null }
) {
  return {
    email: encryptField(dek, fields.email)!,
    emailIndex: emailIndex(fields.email),
    fullName: encryptField(dek, fields.fullName)!,
    avatarUrl: encryptField(dek, fields.avatarUrl ?? null),
    bio: encryptField(dek, fields.bio ?? null),
  };
}

/** Decrypt the PII fields of a user row given its DEK (null = legacy plaintext row). */
export function decryptUserFields<T extends Pick<User, "email" | "fullName" | "avatarUrl" | "bio">>(
  dek: Buffer | null,
  user: T
): T {
  if (!dek) return user;
  return {
    ...user,
    email: decryptField(dek, user.email)!,
    fullName: decryptField(dek, user.fullName)!,
    avatarUrl: decryptField(dek, user.avatarUrl),
    bio: decryptField(dek, user.bio),
  };
}

/** Full decrypt for a user row fetched `include: { key: true }`. Returns row without the key. */
export function decryptUser(user: UserWithKey): User {
  const { key, ...rest } = user;
  const dek = key ? unwrapDek(key.wrappedDek) : null;
  return decryptUserFields(dek, rest);
}
