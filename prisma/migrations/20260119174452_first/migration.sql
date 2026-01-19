-- CreateTable
CREATE TABLE "Participants" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "rt" INTEGER NOT NULL,
    "rw" INTEGER NOT NULL DEFAULT 4,
    "luckyNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'registered',
    "isWinner" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Participants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Participants_luckyNumber_key" ON "Participants"("luckyNumber");
