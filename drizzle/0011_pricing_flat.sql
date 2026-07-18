DROP TABLE IF EXISTS `pricing_rules`;
--> statement-breakpoint
CREATE TABLE `pricing_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`vehicle_type` text NOT NULL,
	`day_price` integer NOT NULL,
	`night_price` integer NOT NULL,
	`cross_day_price` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pricing_rules_vehicle_type_unique` ON `pricing_rules` (`vehicle_type`);
