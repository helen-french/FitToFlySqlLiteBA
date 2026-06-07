CREATE TABLE `person_details` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`staff_number` text NOT NULL,
	`surname` text NOT NULL,
	`initials` text NOT NULL,
	`name_code` text NOT NULL,
	`seniority_number` integer,
	`individual_cap` text
);
--> statement-breakpoint
CREATE TABLE `trip_crew` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`staff_number` text NOT NULL,
	`surname` text NOT NULL,
	`initials` text NOT NULL,
	`name_code` text NOT NULL,
	`crew_function` integer,
	`aircraft_type` text,
	`crew_base` text,
	`roster_month` text,
	`individual_cap` text
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`avatar` text,
	`carrier` text DEFAULT 'British Airways' NOT NULL,
	`fleet` text,
	`position` text,
	`contract` text,
	`staff_number` text,
	`avatar_uri` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);