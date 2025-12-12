import { sql } from 'drizzle-orm';
import { db } from './client'; // Import your existing db client

export async function initializeDatabase() {
  try {
    // 1. Enable Foreign Keys
    await db.run(sql`PRAGMA foreign_keys = ON;`);

    // 2. Create MEDICATIONS Table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS medications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        unit TEXT DEFAULT 'nos',
        current_stock REAL DEFAULT 0 NOT NULL,
        total_stock_level REAL,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      );
    `);

    // 3. Create DOSES Table (This was missing!)
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS doses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        medication_id INTEGER NOT NULL,
        days TEXT,
        time TEXT NOT NULL,
        qty REAL DEFAULT 1.0 NOT NULL,
        FOREIGN KEY (medication_id) REFERENCES medications(id) ON DELETE CASCADE
      );
    `);

    // 4. Create LOGS Table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        medication_id INTEGER NOT NULL,
        dose_id INTEGER,
        action TEXT NOT NULL,
        timestamp INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (medication_id) REFERENCES medications(id) ON DELETE CASCADE,
        FOREIGN KEY (dose_id) REFERENCES doses(id)
      );
    `);

    // 5. Create REFILLS Table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS refills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        medication_id INTEGER NOT NULL,
        qty REAL NOT NULL,
        price REAL,
        pharmacy_name TEXT,
        refill_date INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (medication_id) REFERENCES medications(id) ON DELETE CASCADE
      );
    `);

    // 6. Create APP_SETTINGS Table (This was missing!)
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS app_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        show_days_supply INTEGER DEFAULT 1,
        refill_threshold_days INTEGER DEFAULT 5,
        dark_mode INTEGER DEFAULT 0
      );
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
  }
}