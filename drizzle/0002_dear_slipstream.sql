CREATE TABLE `valuation_attempts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`attempted_at` text NOT NULL,
	`status` text NOT NULL,
	`reason` text
);
--> statement-breakpoint
CREATE INDEX `idx_valuation_attempts_date` ON `valuation_attempts` (`date`,`id`);--> statement-breakpoint
CREATE TABLE `valuation_lessons` (
	`date` text PRIMARY KEY NOT NULL,
	`symbol` text NOT NULL,
	`created_at` text NOT NULL,
	`data` text NOT NULL
);
