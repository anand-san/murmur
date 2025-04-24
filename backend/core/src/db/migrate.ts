import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";

// Create database connection
const sqlite = new Database("murmur.db");
const db = drizzle(sqlite);

// Run migrations
migrate(db, { migrationsFolder: "./drizzle" });

console.log("Migrations completed successfully");
