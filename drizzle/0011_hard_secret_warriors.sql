CREATE TABLE `roster_amendments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`data_load_id` integer NOT NULL,
	`roster_month` text NOT NULL,
	`change_type` text NOT NULL,
	`item_type` text NOT NULL,
	`identifier` text NOT NULL,
	`details` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`data_load_id`) REFERENCES `data_load`(`id`) ON UPDATE no action ON DELETE no action
);
