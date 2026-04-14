CREATE TYPE "public"."user_level" AS ENUM('basic', 'advanced', 'professional');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin', 'super_admin');--> statement-breakpoint
CREATE TYPE "public"."subscription_plan" AS ENUM('monthly', 'quarterly', 'yearly', 'lifetime', 'custom');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'expired', 'cancelled', 'pending');--> statement-breakpoint
CREATE TYPE "public"."points_action" AS ENUM('register', 'daily_login', 'share', 'invite', 'task_complete', 'purchase', 'consume', 'admin_grant', 'expire');--> statement-breakpoint
CREATE TYPE "public"."favorite_type" AS ENUM('satellite', 'news', 'education', 'intelligence');--> statement-breakpoint
CREATE TYPE "public"."article_category" AS ENUM('basic', 'advanced', 'mission', 'people');--> statement-breakpoint
CREATE TYPE "public"."article_type" AS ENUM('article', 'video');--> statement-breakpoint
CREATE TYPE "public"."intelligence_category" AS ENUM('launch', 'satellite', 'industry', 'research', 'environment');--> statement-breakpoint
CREATE TYPE "public"."intelligence_level" AS ENUM('free', 'advanced', 'professional');--> statement-breakpoint
CREATE TYPE "public"."feedback_status" AS ENUM('pending', 'processing', 'resolved', 'closed');--> statement-breakpoint
CREATE TYPE "public"."feedback_type" AS ENUM('bug', 'feature', 'suggestion', 'other');--> statement-breakpoint
CREATE TYPE "public"."milestone_category" AS ENUM('launch', 'recovery', 'orbit', 'mission', 'other');--> statement-breakpoint
CREATE TYPE "public"."quiz_category" AS ENUM('basic', 'advanced', 'mission', 'people');--> statement-breakpoint
CREATE TYPE "public"."push_record_status" AS ENUM('sent', 'failed');--> statement-breakpoint
CREATE TYPE "public"."push_subscription_status" AS ENUM('active', 'paused', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."push_trigger_type" AS ENUM('scheduled', 'manual');--> statement-breakpoint
CREATE TYPE "public"."subscription_type" AS ENUM('space_weather', 'intelligence');--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar(255) NOT NULL,
	"email" varchar(255),
	"phone" varchar(20),
	"password" varchar(255) NOT NULL,
	"avatar" varchar(500),
	"nickname" varchar(100),
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"level" "user_level" DEFAULT 'basic' NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"total_points" integer DEFAULT 0 NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp,
	"last_login_ip" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"plan" "subscription_plan" NOT NULL,
	"status" "subscription_status" DEFAULT 'pending' NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"currency" varchar(10) DEFAULT 'CNY' NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"payment_id" varchar(100),
	"payment_method" varchar(50),
	"auto_renew" boolean DEFAULT false NOT NULL,
	"cancelled_at" timestamp,
	"cancel_reason" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "points_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"action" "points_action" NOT NULL,
	"points" integer NOT NULL,
	"balance" numeric(10, 2) DEFAULT '0' NOT NULL,
	"description" varchar(255),
	"related_id" varchar(100),
	"related_type" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_favorites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"target_id" varchar(100) NOT NULL,
	"type" "favorite_type" NOT NULL,
	"note" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "education_articles" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(200) NOT NULL,
	"content" text NOT NULL,
	"summary" text,
	"cover" varchar(500),
	"category" "article_category" DEFAULT 'basic' NOT NULL,
	"type" "article_type" DEFAULT 'article' NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"likes" integer DEFAULT 0 NOT NULL,
	"duration" integer,
	"tags" text,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "intelligences" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"summary" text NOT NULL,
	"content" text NOT NULL,
	"cover" varchar(500),
	"category" "intelligence_category" DEFAULT 'launch' NOT NULL,
	"level" "intelligence_level" DEFAULT 'free' NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"likes" integer DEFAULT 0 NOT NULL,
	"collects" integer DEFAULT 0 NOT NULL,
	"source" varchar(100) NOT NULL,
	"source_url" varchar(500),
	"tags" text,
	"analysis" text,
	"trend" text,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"type" "feedback_type" DEFAULT 'other' NOT NULL,
	"title" varchar(200) NOT NULL,
	"content" text NOT NULL,
	"status" "feedback_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "milestones" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text NOT NULL,
	"content" text,
	"event_date" date NOT NULL,
	"category" "milestone_category" DEFAULT 'other' NOT NULL,
	"cover" varchar(500),
	"media" jsonb,
	"related_satellite_norad_id" varchar(20),
	"importance" integer DEFAULT 1 NOT NULL,
	"location" varchar(100),
	"organizer" varchar(100),
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"country" varchar(50),
	"founded_year" integer,
	"website" varchar(255),
	"description" text,
	"logo_url" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "company_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "education_quizzes" (
	"id" serial PRIMARY KEY NOT NULL,
	"question" text NOT NULL,
	"options" json NOT NULL,
	"correct_index" integer NOT NULL,
	"explanation" text,
	"category" "quiz_category" DEFAULT 'basic' NOT NULL,
	"points" integer DEFAULT 10 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"trigger_type" "push_trigger_type" DEFAULT 'manual' NOT NULL,
	"subject" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"sent_at" timestamp NOT NULL,
	"status" "push_record_status" NOT NULL,
	"error_message" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"subscription_types" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"status" "push_subscription_status" DEFAULT 'active' NOT NULL,
	"last_push_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "satellite_tle" (
	"norad_id" varchar(10) PRIMARY KEY NOT NULL,
	"source" varchar(20) DEFAULT 'celestrak' NOT NULL,
	"name" varchar(100) NOT NULL,
	"line1" text NOT NULL,
	"line2" text NOT NULL,
	"epoch" timestamp,
	"inclination" double precision,
	"raan" double precision,
	"eccentricity" double precision,
	"arg_of_perigee" double precision,
	"mean_motion" double precision,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "satellite_metadata" (
	"norad_id" varchar(10) PRIMARY KEY NOT NULL,
	"name" varchar(200),
	"object_id" varchar(20),
	"alt_name" varchar(100),
	"alt_names" text,
	"object_type" varchar(50),
	"status" varchar(10),
	"country_code" varchar(50),
	"launch_date" date,
	"stable_date" date,
	"launch_site" varchar(100),
	"launch_pad" varchar(50),
	"launch_vehicle" varchar(100),
	"flight_no" varchar(50),
	"cospar_launch_no" varchar(20),
	"launch_failure" boolean,
	"launch_site_name" varchar(100),
	"decay_date" date,
	"period" double precision,
	"inclination" double precision,
	"apogee" double precision,
	"perigee" double precision,
	"eccentricity" double precision,
	"raan" double precision,
	"arg_of_perigee" double precision,
	"rcs" varchar(20),
	"std_mag" double precision,
	"tle_epoch" timestamp,
	"tle_age" integer,
	"cospar_id" varchar(20),
	"object_class" varchar(50),
	"launch_mass" double precision,
	"shape" varchar(100),
	"dimensions" varchar(50),
	"span" double precision,
	"mission" varchar(100),
	"first_epoch" date,
	"operator" varchar(100),
	"manufacturer" varchar(100),
	"contractor" varchar(100),
	"bus" varchar(100),
	"configuration" varchar(100),
	"purpose" text,
	"power" text,
	"motor" text,
	"length" double precision,
	"diameter" double precision,
	"dry_mass" double precision,
	"equipment" text,
	"adcs" text,
	"payload" text,
	"constellation_name" varchar(100),
	"lifetime" varchar(100),
	"platform" varchar(100),
	"color" varchar(100),
	"material_composition" text,
	"major_events" text,
	"related_satellites" text,
	"transmitter_frequencies" text,
	"sources" text,
	"reference_urls" text,
	"summary" text,
	"anomaly_flags" varchar(50),
	"last_reviewed" timestamp,
	"pred_decay_date" date,
	"has_discos_data" boolean DEFAULT false NOT NULL,
	"has_keeptrack_data" boolean DEFAULT false NOT NULL,
	"has_spacetrack_data" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "satellite_sync_tasks" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"type" varchar(20) NOT NULL,
	"status" varchar(20) NOT NULL,
	"total" integer DEFAULT 0 NOT NULL,
	"processed" integer DEFAULT 0 NOT NULL,
	"success" integer DEFAULT 0 NOT NULL,
	"failed" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "satellite_sync_error_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" varchar(50) NOT NULL,
	"norad_id" varchar(10) NOT NULL,
	"name" varchar(200),
	"source" varchar(20) NOT NULL,
	"error_type" varchar(30) NOT NULL,
	"error_message" text NOT NULL,
	"raw_tle" text,
	"timestamp" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "points_records" ADD CONSTRAINT "points_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_favorites" ADD CONSTRAINT "user_favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_records" ADD CONSTRAINT "push_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_favorites_user_target_type_idx" ON "user_favorites" USING btree ("user_id","target_id","type");--> statement-breakpoint
CREATE INDEX "milestones_event_date_idx" ON "milestones" USING btree ("event_date");--> statement-breakpoint
CREATE INDEX "company_name_idx" ON "company" USING btree ("name");--> statement-breakpoint
CREATE INDEX "company_country_idx" ON "company" USING btree ("country");--> statement-breakpoint
CREATE INDEX "push_records_user_id_idx" ON "push_records" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "push_subscriptions_user_id_idx" ON "push_subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "satellite_tle_updated_at_idx" ON "satellite_tle" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "satellite_tle_source_idx" ON "satellite_tle" USING btree ("source");--> statement-breakpoint
CREATE INDEX "satellite_metadata_country_code_idx" ON "satellite_metadata" USING btree ("country_code");--> statement-breakpoint
CREATE INDEX "satellite_metadata_object_type_idx" ON "satellite_metadata" USING btree ("object_type");--> statement-breakpoint
CREATE INDEX "satellite_metadata_launch_date_idx" ON "satellite_metadata" USING btree ("launch_date");--> statement-breakpoint
CREATE INDEX "satellite_sync_tasks_status_idx" ON "satellite_sync_tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "satellite_sync_tasks_type_idx" ON "satellite_sync_tasks" USING btree ("type");--> statement-breakpoint
CREATE INDEX "satellite_sync_tasks_started_at_idx" ON "satellite_sync_tasks" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "satellite_sync_error_logs_task_id_idx" ON "satellite_sync_error_logs" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "satellite_sync_error_logs_norad_id_idx" ON "satellite_sync_error_logs" USING btree ("norad_id");--> statement-breakpoint
CREATE INDEX "satellite_sync_error_logs_error_type_idx" ON "satellite_sync_error_logs" USING btree ("error_type");--> statement-breakpoint
CREATE INDEX "satellite_sync_error_logs_timestamp_idx" ON "satellite_sync_error_logs" USING btree ("timestamp");