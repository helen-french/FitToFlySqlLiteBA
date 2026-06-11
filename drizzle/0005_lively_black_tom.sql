CREATE TABLE `crew_members` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`staff_number` text NOT NULL,
	`surname` text NOT NULL,
	`initials` text NOT NULL,
	`name_code` text NOT NULL,
	`crew_function` integer,
	`aircraft_type` text,
	`crew_base` text,
	`roster_month` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `crew_members_staff_number_unique` ON `crew_members` (`staff_number`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_trip_crew` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`trip_number` text NOT NULL,
	`staff_number` text NOT NULL,
	`crew_function` integer,
	`roster_month` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`trip_number`) REFERENCES `trips`(`trip_number`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`staff_number`) REFERENCES `crew_members`(`staff_number`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_trip_crew`("id", "trip_number", "staff_number", "crew_function", "roster_month", "created_at", "updated_at") SELECT "id", "trip_number", "staff_number", "crew_function", "roster_month", "created_at", "updated_at" FROM `trip_crew`;--> statement-breakpoint
DROP TABLE `trip_crew`;--> statement-breakpoint
ALTER TABLE `__new_trip_crew` RENAME TO `trip_crew`;--> statement-breakpoint
PRAGMA foreign_keys=ON;