CREATE TABLE `monthly_subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`card_uid` text NOT NULL,
	`customer_name` text NOT NULL,
	`customer_phone` text,
	`photo_profile` text,
	`vehicle_type` text NOT NULL,
	`vehicle_plate` text NOT NULL,
	`start_date` integer NOT NULL,
	`end_date` integer NOT NULL,
	`price` integer DEFAULT 0,
	`status` text DEFAULT 'active',
	`created_at` integer,
	`synced` integer DEFAULT false,
	FOREIGN KEY (`card_uid`) REFERENCES `nfc_cards`(`uid`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `system_configs` ADD `monthly_price_motorbike` integer DEFAULT 100000;--> statement-breakpoint
ALTER TABLE `system_configs` ADD `monthly_price_car` integer DEFAULT 500000;--> statement-breakpoint
ALTER TABLE `system_configs` ADD `monthly_price_ebike` integer DEFAULT 100000;