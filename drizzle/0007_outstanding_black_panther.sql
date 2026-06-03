CREATE TABLE `person_details` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`staff_number` text NOT NULL,
	`surname` text NOT NULL,
	`initials` text NOT NULL,
	`name_code` text NOT NULL,
	`seniority_number` integer,
	`individual_cap` text,
	`created_at` integer,
	`updated_at` integer
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
	`individual_cap` text,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
DROP TABLE `crew`;