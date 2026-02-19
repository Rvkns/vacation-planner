-- Migration: Replace email with first_name, last_name, date_of_birth
-- Run this against the existing database that still has the old schema

-- Step 1: Add new columns
ALTER TABLE "users" ADD COLUMN "first_name" varchar(255);
ALTER TABLE "users" ADD COLUMN "last_name" varchar(255);
ALTER TABLE "users" ADD COLUMN "date_of_birth" date;

-- Step 2: Populate new columns from existing name/email data
-- Split name into first_name and last_name (first word = first_name, rest = last_name)
UPDATE "users" SET
    "first_name" = split_part("name", ' ', 1),
    "last_name" = CASE
        WHEN position(' ' IN "name") > 0 THEN substring("name" FROM position(' ' IN "name") + 1)
        ELSE split_part("name", ' ', 1)
    END,
    "date_of_birth" = '1990-01-01';  -- placeholder date for existing users

-- Step 3: Make columns NOT NULL now that they have values
ALTER TABLE "users" ALTER COLUMN "first_name" SET NOT NULL;
ALTER TABLE "users" ALTER COLUMN "last_name" SET NOT NULL;
ALTER TABLE "users" ALTER COLUMN "date_of_birth" SET NOT NULL;

-- Step 4: Drop the email column
ALTER TABLE "users" DROP COLUMN "email";

-- Step 5: Add unique index on (first_name, last_name, date_of_birth)
CREATE UNIQUE INDEX "users_identity_unique" ON "users" ("first_name", "last_name", "date_of_birth");
