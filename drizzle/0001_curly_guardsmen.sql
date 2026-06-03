ALTER TABLE `users` ADD `avatar` text;--> statement-breakpoint
ALTER TABLE `users` ADD `carrier` text DEFAULT 'British Airways' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `fleet` text;--> statement-breakpoint
ALTER TABLE `users` ADD `position` text;--> statement-breakpoint
ALTER TABLE `users` ADD `contract` text;--> statement-breakpoint
ALTER TABLE `users` ADD `staff_number` text;--> statement-breakpoint
ALTER TABLE `users` ADD `updated_at` integer;