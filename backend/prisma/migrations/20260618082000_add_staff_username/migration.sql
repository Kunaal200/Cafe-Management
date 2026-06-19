-- Make email optional (staff accounts log in by username instead)
ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL;

-- Add username and active flag for staff accounts
ALTER TABLE "users" ADD COLUMN "username" TEXT;
ALTER TABLE "users" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

-- Username unique per tenant (multiple NULLs allowed by Postgres)
CREATE UNIQUE INDEX "users_tenantId_username_key" ON "users"("tenantId", "username");
