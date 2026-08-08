-- Many-to-many questions <-> companies, with per-company interview frequency.
-- Also adds per-question interview role relevance metadata.

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (unique constraints for name/slug — required for ON CONFLICT below and match the Prisma schema's @unique fields)
CREATE UNIQUE INDEX "Company_name_key" ON "Company"("name");
CREATE UNIQUE INDEX "Company_slug_key" ON "Company"("slug");

-- CreateTable
CREATE TABLE "QuestionCompany" (
    "questionId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "frequencyRank" INTEGER,
    "interviewFrequency" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestionCompany_pkey" PRIMARY KEY ("questionId","companyId")
);

-- CreateIndex
CREATE INDEX "QuestionCompany_companyId_idx" ON "QuestionCompany"("companyId");

-- CreateIndex
CREATE INDEX "QuestionCompany_questionId_idx" ON "QuestionCompany"("questionId");

-- AlterTable: interview role relevance metadata
ALTER TABLE "Question" ADD COLUMN     "roles" JSONB;

-- AddForeignKey
ALTER TABLE "QuestionCompany" ADD CONSTRAINT "QuestionCompany_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionCompany" ADD CONSTRAINT "QuestionCompany_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed the target companies (idempotent: only insert missing rows).
INSERT INTO "Company" ("id", "name", "slug", "createdAt", "updatedAt") VALUES
  ('company_google', 'Google', 'google', now(), now()),
  ('company_amazon', 'Amazon', 'amazon', now(), now()),
  ('company_meta', 'Meta', 'meta', now(), now()),
  ('company_microsoft', 'Microsoft', 'microsoft', now(), now()),
  ('company_apple', 'Apple', 'apple', now(), now()),
  ('company_netflix', 'Netflix', 'netflix', now(), now()),
  ('company_uber', 'Uber', 'uber', now(), now()),
  ('company_airbnb', 'Airbnb', 'airbnb', now(), now()),
  ('company_stripe', 'Stripe', 'stripe', now(), now()),
  ('company_openai', 'OpenAI', 'openai', now(), now())
ON CONFLICT ("name") DO NOTHING;

-- Backfill: link every existing question to its primary company so existing
-- deployments keep working immediately after the migration. The seeder later
-- adds the full multi-company associations + per-company frequency metadata.
INSERT INTO "QuestionCompany" ("questionId", "companyId", "frequencyRank", "interviewFrequency", "createdAt", "updatedAt")
SELECT q."id", c."id", q."frequencyRank", q."interviewFrequency", now(), now()
FROM "Question" q
JOIN "Company" c ON c."name" = q."company"
WHERE q."company" IS NOT NULL
ON CONFLICT ("questionId", "companyId") DO NOTHING;
