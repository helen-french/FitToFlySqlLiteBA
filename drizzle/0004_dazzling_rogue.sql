PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_duties` (
	`trip_number` text NOT NULL,
	`duty_number` integer NOT NULL,
	`duty_hours` text,
	`flying_hours` text,
	`number_of_sectors` integer,
	`actual_report_time` text,
	`industrial_brief_time` text,
	`industrial_debrief_time` text,
	`scheme_brief_time` text,
	`scheme_debrief_time` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`trip_number`, `duty_number`),
	FOREIGN KEY (`trip_number`) REFERENCES `trips`(`trip_number`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_duties`("trip_number", "duty_number", "duty_hours", "flying_hours", "number_of_sectors", "actual_report_time", "industrial_brief_time", "industrial_debrief_time", "scheme_brief_time", "scheme_debrief_time", "created_at", "updated_at") SELECT "trip_number", "duty_number", "duty_hours", "flying_hours", "number_of_sectors", "actual_report_time", "industrial_brief_time", "industrial_debrief_time", "scheme_brief_time", "scheme_debrief_time", "created_at", "updated_at" FROM `duties`;--> statement-breakpoint
DROP TABLE `duties`;--> statement-breakpoint
ALTER TABLE `__new_duties` RENAME TO `duties`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_sectors` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`trip_number` text NOT NULL,
	`duty_number` integer NOT NULL,
	`sector_number` integer NOT NULL,
	`carrier` text NOT NULL,
	`flight_number` text NOT NULL,
	`aircraft_type_specific` text,
	`departure_station` text NOT NULL,
	`arrival_station` text NOT NULL,
	`departure_time` text NOT NULL,
	`departure_time_local` text,
	`departure_time_shift` text,
	`arrival_time` text NOT NULL,
	`arrival_time_local` text,
	`arrival_time_shift` text,
	`relative_departure_day` integer,
	`sector_type` text,
	`heavy_crew_identifier` text,
	`flying_hours` text,
	`flying_hours_credit` text,
	`schedule_indicator` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_sectors`("id", "trip_number", "duty_number", "sector_number", "carrier", "flight_number", "aircraft_type_specific", "departure_station", "arrival_station", "departure_time", "departure_time_local", "departure_time_shift", "arrival_time", "arrival_time_local", "arrival_time_shift", "relative_departure_day", "sector_type", "heavy_crew_identifier", "flying_hours", "flying_hours_credit", "schedule_indicator", "created_at", "updated_at") SELECT "id", "trip_number", "duty_number", "sector_number", "carrier", "flight_number", "aircraft_type_specific", "departure_station", "arrival_station", "departure_time", "departure_time_local", "departure_time_shift", "arrival_time", "arrival_time_local", "arrival_time_shift", "relative_departure_day", "sector_type", "heavy_crew_identifier", "flying_hours", "flying_hours_credit", "schedule_indicator", "created_at", "updated_at" FROM `sectors`;--> statement-breakpoint
DROP TABLE `sectors`;--> statement-breakpoint
ALTER TABLE `__new_sectors` RENAME TO `sectors`;--> statement-breakpoint
CREATE TABLE `__new_trips` (
	`trip_number` text PRIMARY KEY NOT NULL,
	`roster_month` text NOT NULL,
	`block_number` text,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`number_of_duties` integer,
	`trip_length` integer,
	`heavy_crew_indicator` text,
	`base` text,
	`local_day_shift` text,
	`crew_comp_pilots` integer,
	`crew_comp_cabin` integer,
	`day_codes` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_trips`("trip_number", "roster_month", "block_number", "start_date", "end_date", "number_of_duties", "trip_length", "heavy_crew_indicator", "base", "local_day_shift", "crew_comp_pilots", "crew_comp_cabin", "day_codes", "created_at", "updated_at") SELECT "trip_number", "roster_month", "block_number", "start_date", "end_date", "number_of_duties", "trip_length", "heavy_crew_indicator", "base", "local_day_shift", "crew_comp_pilots", "crew_comp_cabin", "day_codes", "created_at", "updated_at" FROM `trips`;--> statement-breakpoint
DROP TABLE `trips`;--> statement-breakpoint
ALTER TABLE `__new_trips` RENAME TO `trips`;