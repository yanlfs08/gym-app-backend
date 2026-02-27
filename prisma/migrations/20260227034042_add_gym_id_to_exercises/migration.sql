/*
  Warnings:

  - Added the required column `gymId` to the `exercises` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "exercises" ADD COLUMN     "gymId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "exercises_gymId_idx" ON "exercises"("gymId");

-- AddForeignKey
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "gyms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
