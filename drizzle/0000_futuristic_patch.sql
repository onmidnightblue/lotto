CREATE TABLE "analysis_result" (
	"id" serial PRIMARY KEY NOT NULL,
	"analysis_type" text NOT NULL,
	"result" json,
	"meta" json DEFAULT '{}'::json,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "lotto_win_result" (
	"id" serial PRIMARY KEY NOT NULL,
	"draw_date" timestamp NOT NULL,
	"numbers" json,
	"bonus" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_activity_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"action" text NOT NULL,
	"payload" json DEFAULT '{}'::json,
	"created_at" timestamp DEFAULT now()
);
