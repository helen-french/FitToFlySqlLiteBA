CREATE TABLE `data_load` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`roster_file_name` text,
	`roster_date_of_creation` text,
	`roster_time_of_creation` text,
	`roster_month_number` text,
	`roster_start_date_of_feed` text,
	`roster_end_date_of_feed` text,
	`trip_file_name` text,
	`trip_date_of_creation` text,
	`trip_time_of_creation` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ground_duties` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`crew_movement_code` text NOT NULL,
	`start_date` text NOT NULL,
	`start_time` text,
	`end_date` text NOT NULL,
	`end_time` text,
	`credit_amount` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `roster` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`data_load_id` integer NOT NULL,
	`type` text NOT NULL,
	`trip_number` text,
	`ground_duty_id` integer,
	`roster_month` text NOT NULL,
	`start_date` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`data_load_id`) REFERENCES `data_load`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`trip_number`) REFERENCES `trips`(`trip_number`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`ground_duty_id`) REFERENCES `ground_duties`(`id`) ON UPDATE no action ON DELETE no action
);
