CREATE TABLE `airport_comments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`iata_code` text NOT NULL,
	`category` text NOT NULL,
	`content` text NOT NULL,
	`author_name` text DEFAULT 'Anonymous' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`iata_code`) REFERENCES `airports`(`iata_code`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `airports` (
	`iata_code` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`country_name` text,
	`iso_country` text,
	`latitude` integer,
	`longitude` integer
);
