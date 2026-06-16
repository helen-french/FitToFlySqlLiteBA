PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_roster` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`data_load_id` integer NOT NULL,
	`type` text NOT NULL,
	`trip_number` text,
	`ground_duty_id` integer,
	`roster_month` text NOT NULL,
	`start_date` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`data_load_id`) REFERENCES `data_load`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_roster`("id", "data_load_id", "type", "trip_number", "ground_duty_id", "roster_month", "start_date", "created_at", "updated_at") SELECT "id", "data_load_id", "type", "trip_number", "ground_duty_id", "roster_month", "start_date", "created_at", "updated_at" FROM `roster`;--> statement-breakpoint
DROP TABLE `roster`;--> statement-breakpoint
ALTER TABLE `__new_roster` RENAME TO `roster`;--> statement-breakpoint
PRAGMA foreign_keys=ON;