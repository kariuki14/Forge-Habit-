-- Phase 2: after the PII backfill, emailIndex is populated for all rows.
ALTER TABLE "User" ALTER COLUMN "emailIndex" SET NOT NULL;
