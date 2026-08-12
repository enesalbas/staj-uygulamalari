CREATE TABLE `repos` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`language` text,
	`stars` integer NOT NULL,
	`url` text NOT NULL,
	`fetched_at` text NOT NULL
);
