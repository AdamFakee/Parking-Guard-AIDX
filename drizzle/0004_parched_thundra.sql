PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_parking_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`entry_shift_id` text NOT NULL,
	`exit_shift_id` text,
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
	FOREIGN KEY (`entry_shift_id`) REFERENCES `shifts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`exit_shift_id`) REFERENCES `shifts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`card_uid`) REFERENCES `nfc_cards`(`uid`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_parking_entries`("id", "entry_shift_id", "exit_shift_id", "card_uid", "vehicle_type", "entry_time", "photo_in_1", "photo_in_2", "plate_text", "plate_confidence", "manual_input_in", "exit_time", "photo_out_1", "photo_out_2", "exit_plate", "plate_match", "mismatch_reason", "manual_input_out", "fee_amount", "payment_method", "status", "void_reason", "is_lost_card", "synced") SELECT "id", "entry_shift_id", "exit_shift_id", "card_uid", "vehicle_type", "entry_time", "photo_in_1", "photo_in_2", "plate_text", "plate_confidence", "manual_input_in", "exit_time", "photo_out_1", "photo_out_2", "exit_plate", "plate_match", "mismatch_reason", "manual_input_out", "fee_amount", "payment_method", "status", "void_reason", "is_lost_card", "synced" FROM `parking_entries`;--> statement-breakpoint
DROP TABLE `parking_entries`;--> statement-breakpoint
ALTER TABLE `__new_parking_entries` RENAME TO `parking_entries`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `idx_plate` ON `parking_entries` (`plate_text`);--> statement-breakpoint
CREATE INDEX `idx_status` ON `parking_entries` (`status`);--> statement-breakpoint
CREATE INDEX `idx_card_status` ON `parking_entries` (`card_uid`,`status`);