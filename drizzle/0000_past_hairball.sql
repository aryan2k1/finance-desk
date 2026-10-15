CREATE TABLE `articles` (
	`id` text PRIMARY KEY NOT NULL,
	`url` text NOT NULL,
	`source_id` text NOT NULL,
	`story_id` text NOT NULL,
	`published_at` text NOT NULL,
	`data` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `articles_url_unique` ON `articles` (`url`);--> statement-breakpoint
CREATE TABLE `locks` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` text NOT NULL,
	`owner` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `quotes` (
	`symbol` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `refresh_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`started_at` text NOT NULL,
	`finished_at` text,
	`status` text NOT NULL,
	`data` text
);
--> statement-breakpoint
CREATE TABLE `source_state` (
	`id` text PRIMARY KEY NOT NULL,
	`last_attempt` text,
	`last_success` text,
	`error` text,
	`item_count` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `stories` (
	`id` text PRIMARY KEY NOT NULL,
	`category` text NOT NULL,
	`published_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`score` integer NOT NULL,
	`data` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_stories_category_published` ON `stories` (`category`,`published_at`);--> statement-breakpoint
CREATE INDEX `idx_stories_score` ON `stories` (`score`);