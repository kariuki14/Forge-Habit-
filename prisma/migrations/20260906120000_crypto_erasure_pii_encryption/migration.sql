-- Phase 1: crypto-erasure schema. emailIndex starts nullable so existing
-- plaintext rows survive; a backfill script encrypts them, then
-- 20260906120100 makes it NOT NULL (see that migration).

-- DropIndex
DROP INDEX "User_email_key";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailIndex" TEXT,
ALTER COLUMN "email" SET DATA TYPE VARCHAR(1024),
ALTER COLUMN "fullName" SET DATA TYPE VARCHAR(512),
ALTER COLUMN "avatarUrl" SET DATA TYPE VARCHAR(2048),
ALTER COLUMN "bio" SET DATA TYPE VARCHAR(1024);

-- CreateTable
CREATE TABLE "UserKey" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "wrappedDek" VARCHAR(256) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserKey_userId_key" ON "UserKey"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_emailIndex_key" ON "User"("emailIndex");

-- AddForeignKey
ALTER TABLE "UserKey" ADD CONSTRAINT "UserKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
