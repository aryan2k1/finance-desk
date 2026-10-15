CREATE TABLE `brief_versions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`story_id` text NOT NULL,
	`created_at` text NOT NULL,
	`expires_at` text NOT NULL,
	`fingerprint` text NOT NULL,
	`data` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_brief_versions_story_id` ON `brief_versions` (`story_id`,`id`);--> statement-breakpoint
CREATE INDEX `idx_brief_versions_expires` ON `brief_versions` (`expires_at`);