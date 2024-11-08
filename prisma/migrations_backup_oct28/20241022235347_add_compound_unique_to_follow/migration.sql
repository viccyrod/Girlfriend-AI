/*
  Warnings:

  - A unique constraint covering the columns `[userId,aiModelId]` on the table `Follow` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `aiModelId` to the `Follow` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Follow` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Follow_followerId_followingId_key";

-- AlterTable
ALTER TABLE "Follow" ADD COLUMN     "aiModelId" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Follow_userId_aiModelId_key" ON "Follow"("userId", "aiModelId");
