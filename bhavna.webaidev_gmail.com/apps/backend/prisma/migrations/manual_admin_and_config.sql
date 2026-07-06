-- Manual migration for the admin panel, moderation, and tunable game config.
-- Safe to run once against the Neon Postgres database used by the backend.
-- Idempotent: uses IF NOT EXISTS / IF EXISTS guards where possible.
--
-- Apply with either:
--   psql "$DATABASE_URL" -f prisma/migrations/manual_admin_and_config.sql
-- or run the equivalent `npx prisma db push` after `prisma generate`
-- (db push will diff the schema.prisma automatically).

-- 1. User: role + banned flag, plus helpful indexes for leaderboard/analytics.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'player';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "banned" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS "User_highScore_idx" ON "User" ("highScore");
CREATE INDEX IF NOT EXISTS "User_createdAt_idx" ON "User" ("createdAt");

-- 2. GameSession: indexes for weekly leaderboard + analytics queries.
CREATE INDEX IF NOT EXISTS "GameSession_userId_idx" ON "GameSession" ("userId");
CREATE INDEX IF NOT EXISTS "GameSession_createdAt_idx" ON "GameSession" ("createdAt");

-- 3. RewardClaim: moderation status.
ALTER TABLE "RewardClaim" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'approved';
CREATE INDEX IF NOT EXISTS "RewardClaim_userId_idx" ON "RewardClaim" ("userId");
CREATE INDEX IF NOT EXISTS "RewardClaim_status_idx" ON "RewardClaim" ("status");

-- 4. GameConfig: singleton row of admin-tunable settings.
CREATE TABLE IF NOT EXISTS "GameConfig" (
  "id" TEXT PRIMARY KEY DEFAULT 'singleton',
  "shieldUpgradeBaseCost" INTEGER NOT NULL DEFAULT 150,
  "fuelUpgradeBaseCost" INTEGER NOT NULL DEFAULT 125,
  "minClaimAmount" INTEGER NOT NULL DEFAULT 100,
  "coinToTokenRate" INTEGER NOT NULL DEFAULT 1,
  "difficultySpeedScale" DOUBLE PRECISION NOT NULL DEFAULT 1,
  "difficultySpawnScale" DOUBLE PRECISION NOT NULL DEFAULT 1,
  "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO "GameConfig" ("id") VALUES ('singleton') ON CONFLICT ("id") DO NOTHING;
