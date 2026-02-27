-- CreateEnum
CREATE TYPE "ChallengeType" AS ENUM ('TOTAL_WEIGHT', 'CHECK_INS');

-- AlterEnum
ALTER TYPE "CheckInMethod" ADD VALUE 'MANUAL';

-- AlterTable
ALTER TABLE "challenges" ADD COLUMN     "type" "ChallengeType" NOT NULL DEFAULT 'CHECK_INS';
