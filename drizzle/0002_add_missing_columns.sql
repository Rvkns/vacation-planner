-- Migration: Add missing columns
-- Adds start_time/end_time to leave_requests (needed for partial-day requests)
-- Adds personal_hours_total/personal_hours_used to users

-- Step 1: Add time columns to leave_requests
ALTER TABLE "leave_requests" ADD COLUMN IF NOT EXISTS "start_time" varchar(5);
ALTER TABLE "leave_requests" ADD COLUMN IF NOT EXISTS "end_time" varchar(5);

-- Step 2: Add personal hours columns to users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "personal_hours_total" integer DEFAULT 32 NOT NULL;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "personal_hours_used" integer DEFAULT 0 NOT NULL;
