-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('easy', 'medium', 'hard');

-- AlterTable
ALTER TABLE "CodeSubmission" ADD COLUMN     "passedTests" INTEGER,
ADD COLUMN     "result" JSONB,
ADD COLUMN     "totalTests" INTEGER;

-- AlterTable
ALTER TABLE "InterviewSession" ADD COLUMN     "company" TEXT,
ADD COLUMN     "difficulty" "Difficulty",
ADD COLUMN     "durationMinutes" INTEGER,
ADD COLUMN     "language" TEXT,
ADD COLUMN     "questionId" TEXT,
ADD COLUMN     "role" TEXT,
ADD COLUMN     "score" INTEGER;

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "topic" TEXT NOT NULL,
    "company" TEXT,
    "functionName" TEXT NOT NULL,
    "examples" JSONB,
    "constraints" JSONB,
    "testCases" JSONB NOT NULL,
    "starterCode" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "interviewSessionId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "problemSolving" INTEGER,
    "codeQuality" INTEGER,
    "communication" INTEGER,
    "optimization" INTEGER,
    "strengths" JSONB NOT NULL,
    "weaknesses" JSONB NOT NULL,
    "recommendations" JSONB NOT NULL,
    "summary" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Feedback_interviewSessionId_key" ON "Feedback"("interviewSessionId");

-- AddForeignKey
ALTER TABLE "InterviewSession" ADD CONSTRAINT "InterviewSession_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_interviewSessionId_fkey" FOREIGN KEY ("interviewSessionId") REFERENCES "InterviewSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
