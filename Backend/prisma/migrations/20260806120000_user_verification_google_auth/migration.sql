-- AlterTable: user verification + Google OAuth support
ALTER TABLE "User" ADD COLUMN     "avatar" TEXT,
ADD COLUMN     "googleId" TEXT,
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "provider" TEXT NOT NULL DEFAULT 'email',
ADD COLUMN     "verificationToken" TEXT,
ADD COLUMN     "verificationTokenExpires" TIMESTAMP(3);

-- Existing accounts were created before verification existed; treat them as
-- verified so nobody gets locked out by the new flow.
UPDATE "User" SET "isVerified" = true;

-- Password becomes nullable for Google-only accounts.
ALTER TABLE "User" ALTER COLUMN "password" DROP NOT NULL;

-- Unique index for account linking by Google subject id.
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");
