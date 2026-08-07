-- Add the hiring-committee verdict (Strong Hire / Hire / Leaning Hire /
-- Needs Improvement / Not Ready Yet) to the structured interview feedback.
ALTER TABLE "Feedback" ADD COLUMN "recommendation" TEXT;
