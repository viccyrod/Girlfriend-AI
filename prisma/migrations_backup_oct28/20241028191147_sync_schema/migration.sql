-- AlterTable
ALTER TABLE "AIModel" ADD COLUMN     "isAnime" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "metadata" JSONB;

-- CreateTable
CREATE TABLE "ModelTraining" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "replicateTrainingId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModelTraining_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ModelTraining" ADD CONSTRAINT "ModelTraining_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
