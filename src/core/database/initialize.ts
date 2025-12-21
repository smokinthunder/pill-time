import { openDatabaseSync } from "expo-sqlite";
import { drizzle } from "drizzle-orm/expo-sqlite";
import { expoDb as sqliteDb } from "./client";
// Open the database file
// const sqliteDb = openDatabaseSync("medicinedb.db");
export const db = drizzle(sqliteDb);

export const initializeDatabase = async () => {
  try {
    // 1. ENABLE FOREIGN KEYS
    await sqliteDb.execAsync("PRAGMA foreign_keys = ON;");

    // 2. CREATE TABLES (The Blueprints)

    // Medications Table
    await sqliteDb.execAsync(`
      CREATE TABLE IF NOT EXISTS medications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        unit TEXT NOT NULL,
        current_stock REAL NOT NULL,
        total_stock_level REAL,
        refill_threshold REAL,
        created_at INTEGER 
      );
    `);

    // Doses Table (FIXED: Added notification_id directly to blueprint)
    await sqliteDb.execAsync(`
      CREATE TABLE IF NOT EXISTS doses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        medication_id INTEGER NOT NULL,
        time TEXT NOT NULL,
        qty REAL NOT NULL,
        days TEXT,
        notification_id TEXT, 
        FOREIGN KEY (medication_id) REFERENCES medications(id) ON DELETE CASCADE
      );
    `);

    // Logs Table
    await sqliteDb.execAsync(`
      CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        medication_id INTEGER NOT NULL,
        dose_id INTEGER,
        action TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        FOREIGN KEY (medication_id) REFERENCES medications(id) ON DELETE CASCADE
      );
    `);

    // Refills Table
    await sqliteDb.execAsync(`
      CREATE TABLE IF NOT EXISTS refills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        medication_id INTEGER NOT NULL,
        qty REAL NOT NULL,
        price REAL,
        pharmacy_name TEXT,
        refill_date INTEGER NOT NULL,
        FOREIGN KEY (medication_id) REFERENCES medications(id) ON DELETE CASCADE
      );
    `);

    // App Settings Table
    await sqliteDb.execAsync(`
      CREATE TABLE IF NOT EXISTS app_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_name TEXT DEFAULT 'Grandpa',
        show_days_supply INTEGER DEFAULT 1,
        refill_threshold_days INTEGER DEFAULT 5,
        haptic_enabled INTEGER DEFAULT 1,
        theme_preference TEXT DEFAULT 'system'
      );
    `);

    // 3. MIGRATION BLOCK (The "Safety Net")
    // Runs on every startup to catch databases that were made before we added columns
    const runMigration = async () => {
      try {
        await sqliteDb.execAsync(
          `ALTER TABLE doses ADD COLUMN notification_id TEXT;`,
        );
      } catch (e) {}
      try {
        await sqliteDb.execAsync(
          `ALTER TABLE app_settings ADD COLUMN user_name TEXT DEFAULT 'Grandpa';`,
        );
      } catch (e) {}
      try {
        await sqliteDb.execAsync(
          `ALTER TABLE app_settings ADD COLUMN haptic_enabled INTEGER DEFAULT 1;`,
        );
      } catch (e) {}
      try {
        await sqliteDb.execAsync(
          `ALTER TABLE app_settings ADD COLUMN theme_preference TEXT DEFAULT 'system';`,
        );
      } catch (e) {}
    };
    await runMigration();

    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Database initialization failed:", error);
  }
};
