CREATE TABLE `airport_data` (
	`icao_code` text PRIMARY KEY NOT NULL,
	`iata_code` text,
	`name` text NOT NULL,
	`city` text,
	`state` text,
	`country` text,
	`elevation` integer,
	`latitude` real,
	`longitude` real,
	`timezone` text
);
--> statement-breakpoint
CREATE INDEX `iata_code_idx` ON `airport_data` (`iata_code`);