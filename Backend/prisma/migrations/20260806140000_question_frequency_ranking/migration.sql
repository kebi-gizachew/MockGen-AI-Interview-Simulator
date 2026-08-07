-- Add company interview-frequency metadata to questions.
-- frequencyRank: 1 = most frequently reported interview question at this company.
-- interviewFrequency: derived tier ("very_high" | "high" | "medium" | "low").
ALTER TABLE "Question" ADD COLUMN "frequencyRank" INTEGER,
ADD COLUMN "interviewFrequency" TEXT;
