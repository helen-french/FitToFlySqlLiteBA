CREATE TABLE `credit_rates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`staff_number` text NOT NULL,
	`flying_rate` real NOT NULL,
	`overseas_rate` real NOT NULL,
	`time_away_rate` real NOT NULL,
	`effective_from` text NOT NULL,
	`effective_to` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
DROP TABLE `airport_data`;