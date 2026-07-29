CREATE TABLE `commits` (
	`id` integer PRIMARY KEY NOT NULL,
	`message` text NOT NULL,
	`developer_id` integer NOT NULL,
	`merge_request_id` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`developer_id`) REFERENCES `developers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`merge_request_id`) REFERENCES `merge_requests`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `developers` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text,
	`team` text
);
--> statement-breakpoint
CREATE TABLE `merge_requests` (
	`id` integer PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`developer_id` integer NOT NULL,
	`created_at` text NOT NULL,
	`merged_at` text,
	`status` text NOT NULL,
	FOREIGN KEY (`developer_id`) REFERENCES `developers`(`id`) ON UPDATE no action ON DELETE no action
);
