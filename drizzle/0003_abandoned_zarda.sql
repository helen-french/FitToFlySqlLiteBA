CREATE TABLE `crew` (
	`staff_number` text PRIMARY KEY NOT NULL,
	`surname` text NOT NULL,
	`firstname` text NOT NULL,
	`name_code` text,
	`seniority_number` integer,
	`aircraft_type` text,
	`crew_base` text,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`avatar` text,
	`carrier` text DEFAULT 'British Airways' NOT NULL,
	`fleet` text,
	`position` text,
	`contract` text,
	`staff_number` text,
	`avatar_uri` text,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_users`("id", "name", "email", "avatar", "carrier", "fleet", "position", "contract", "staff_number", "avatar_uri", "created_at", "updated_at") SELECT "id", "name", "email", "avatar", "carrier", "fleet", "position", "contract", "staff_number", "avatar_uri", "created_at", "updated_at" FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);