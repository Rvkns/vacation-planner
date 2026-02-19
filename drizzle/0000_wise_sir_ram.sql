CREATE TYPE "public"."leave_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."leave_type" AS ENUM('VACATION', 'SICK', 'PERSONAL');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('ADMIN', 'USER', 'MANAGER');--> statement-breakpoint
CREATE TABLE "leave_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"type" "leave_type" NOT NULL,
	"status" "leave_status" DEFAULT 'PENDING' NOT NULL,
	"reason" text,
	"handover_notes" text,
	"reviewed_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" varchar(255) NOT NULL,
	"last_name" varchar(255) NOT NULL,
	"date_of_birth" date NOT NULL,
	"password" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"role" "user_role" DEFAULT 'USER' NOT NULL,
	"vacation_days_total" integer DEFAULT 22 NOT NULL,
	"vacation_days_used" integer DEFAULT 0 NOT NULL,
	"avatar_url" text,
	"job_title" varchar(255),
	"department" varchar(255),
	"bio" text,
	"phone_number" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "users_identity_unique" ON "users" USING btree ("first_name","last_name","date_of_birth");