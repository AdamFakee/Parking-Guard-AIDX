CREATE TABLE `staff` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`pin_hash` text NOT NULL,
	`role` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `pricing_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`vehicle_type` text NOT NULL,
	`time_type` text NOT NULL,
	`first_hours` integer NOT NULL,
	`first_price` integer NOT NULL,
	`extra_per_hour` integer NOT NULL,
	`max_per_day` integer,
	`overnight_price` integer,
	`overnight_start_time` text,
	`overnight_end_time` text
);
--> statement-breakpoint
CREATE TABLE `system_configs` (
	`id` integer PRIMARY KEY NOT NULL,
	`lot_name` text NOT NULL,
	`free_minutes` integer DEFAULT 15,
	`lost_card_fee` integer DEFAULT 50000,
	`bank_name` text,
	`account_number` text,
	`account_name` text,
	`qr_image_url` text,
	`monthly_price_motorbike` integer DEFAULT 100000,
	`monthly_price_car` integer DEFAULT 500000,
	`monthly_price_ebike` integer DEFAULT 100000,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `lost_card_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`entry_id` text NOT NULL,
	`reported_plate` text NOT NULL,
	`compensation_fee` integer NOT NULL,
	`photo_vehicle` text NOT NULL,
	`photo_person` text NOT NULL,
	`created_at` integer,
	`synced` integer DEFAULT false,
	FOREIGN KEY (`entry_id`) REFERENCES `parking_entries`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `lost_card_reports_entry_id_unique` ON `lost_card_reports` (`entry_id`);--> statement-breakpoint
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
CREATE TABLE `nfc_cards` (
	`uid` text PRIMARY KEY NOT NULL,
	`card_type` text NOT NULL,
	`status` text NOT NULL,
	`registered_plate` text,
	`expiration_date` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `parking_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`shift_id` text NOT NULL,
	`card_uid` text,
	`vehicle_type` text NOT NULL,
	`entry_time` integer NOT NULL,
	`photo_in_1` text NOT NULL,
	`photo_in_2` text NOT NULL,
	`plate_text` text NOT NULL,
	`plate_confidence` real,
	`manual_input_in` integer DEFAULT false,
	`exit_time` integer,
	`photo_out_1` text,
	`photo_out_2` text,
	`exit_plate` text,
	`plate_match` integer,
	`mismatch_reason` text,
	`manual_input_out` integer DEFAULT false,
	`fee_amount` integer DEFAULT 0,
	`payment_method` text,
	`status` text NOT NULL,
	`void_reason` text,
	`is_lost_card` integer DEFAULT false,
	`synced` integer DEFAULT false,
	FOREIGN KEY (`shift_id`) REFERENCES `shifts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`card_uid`) REFERENCES `nfc_cards`(`uid`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_plate` ON `parking_entries` (`plate_text`);--> statement-breakpoint
CREATE INDEX `idx_status` ON `parking_entries` (`status`);--> statement-breakpoint
CREATE INDEX `idx_card_status` ON `parking_entries` (`card_uid`,`status`);--> statement-breakpoint
CREATE TABLE `shifts` (
	`id` text PRIMARY KEY NOT NULL,
	`staff_id` text NOT NULL,
	`start_time` integer NOT NULL,
	`end_time` integer,
	`opening_cash` integer NOT NULL,
	`cash_revenue` integer DEFAULT 0,
	`qr_revenue` integer DEFAULT 0,
	`expected_cash` integer,
	`actual_cash` integer,
	`discrepancy_reason` text,
	`status` text DEFAULT 'open',
	`synced` integer DEFAULT false,
	FOREIGN KEY (`staff_id`) REFERENCES `staff`(`id`) ON UPDATE no action ON DELETE no action
);
