/**
 * One-off backfill: encrypt PII for users created before crypto-erasure.
 * Idempotent — skips users that already have a UserKey. Uses raw SQL because
 * legacy rows violate the generated client's non-null "emailIndex" typing.
 *
 * Run with: npx tsx prisma/backfill-pii-encryption.ts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { randomBytes } from "crypto";
import { emailIndex, generateDek, wrapDek, encryptField, isCiphertext } from "../src/lib/crypto";

const prisma = new PrismaClient();

type LegacyUser = {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  bio: string | null;
  emailIndex: string | null;
  keyId: string | null;
};

async function main() {
  const users = await prisma.$queryRaw<LegacyUser[]>`
    SELECT u."id", u."email", u."fullName", u."avatarUrl", u."bio",
           u."emailIndex", k."id" AS "keyId"
    FROM "User" u
    LEFT JOIN "UserKey" k ON k."userId" = u."id"
  `;

  let migrated = 0;
  for (const user of users) {
    if (user.keyId) continue;

    const dek = generateDek();
    const keyRowId = randomBytes(16).toString("hex");

    const email = isCiphertext(user.email) ? user.email : encryptField(dek, user.email)!;
    const fullName = isCiphertext(user.fullName) ? user.fullName : encryptField(dek, user.fullName)!;
    const avatarUrl = isCiphertext(user.avatarUrl) ? user.avatarUrl : encryptField(dek, user.avatarUrl);
    const bio = isCiphertext(user.bio) ? user.bio : encryptField(dek, user.bio);

    await prisma.$transaction([
      prisma.$executeRaw`
        INSERT INTO "UserKey" ("id", "userId", "wrappedDek", "createdAt")
        VALUES (${keyRowId}, ${user.id}, ${wrapDek(dek)}, NOW())
      `,
      prisma.$executeRaw`
        UPDATE "User"
        SET "email" = ${email},
            "emailIndex" = ${emailIndex(user.email)},
            "fullName" = ${fullName},
            "avatarUrl" = ${avatarUrl},
            "bio" = ${bio},
            "updatedAt" = NOW()
        WHERE "id" = ${user.id}
      `,
    ]);
    migrated++;
    console.log(`encrypted user ${user.id}`);
  }

  console.log(`done — ${migrated} user(s) encrypted, ${users.length - migrated} already had keys`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
