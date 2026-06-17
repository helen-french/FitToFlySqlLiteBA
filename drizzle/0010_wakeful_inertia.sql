CREATE TABLE `roster_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`data_load_id` integer NOT NULL,
	`type` text NOT NULL,
	`trip_number` text,
	`ground_duty_id` integer,
	`roster_month` text NOT NULL,
	`start_date` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`data_load_id`) REFERENCES `data_load`(`id`) ON UPDATE no action ON DELETE no action
);
