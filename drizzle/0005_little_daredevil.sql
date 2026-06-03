CREATE TABLE `crew` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`staff_number` text NOT NULL,
	`surname` text NOT NULL,
	`firstname` text NOT NULL,
	`name_code` text,
	`seniority_number` integer,
	`aircraft_type` text,
	`crew_base` text,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
