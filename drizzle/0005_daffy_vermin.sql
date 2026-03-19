ALTER TABLE `monthly_subscriptions` ADD `payment_method` text DEFAULT 'cash';--> statement-breakpoint
ALTER TABLE `monthly_subscriptions` ADD `shift_id` text NOT NULL REFERENCES shifts(id);