ALTER TABLE `lost_card_reports` ADD `sync_attempts` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `monthly_subscriptions` ADD `sync_attempts` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `parking_entries` ADD `sync_attempts` integer DEFAULT 0;