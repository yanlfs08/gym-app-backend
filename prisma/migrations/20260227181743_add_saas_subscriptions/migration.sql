-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'SUPER_ADMIN';

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_gymId_fkey";

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "gymId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "gym_subscriptions" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "planName" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gym_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "gym_subscriptions_gymId_key" ON "gym_subscriptions"("gymId");

-- AddForeignKey
ALTER TABLE "gym_subscriptions" ADD CONSTRAINT "gym_subscriptions_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "gyms"("id") ON DELETE SET NULL ON UPDATE CASCADE;
