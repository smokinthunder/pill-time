import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { relations, sql } from 'drizzle-orm';

// --------------------------------------------------------
// 1. MEDICINES TABLE (The "Inventory" & "Profile")
// --------------------------------------------------------
export const medications = sqliteTable('medications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  
  name: text('name').notNull(),
  description: text('description'), 
  
  // New Field: Unit
  unit: text('unit', { enum: ['mg', 'ml', 'nos'] }).default('nos'),

  // Suggestion: Keep these for the UI progress bar to work
  currentStock: real('current_stock').notNull().default(0), 
  totalStockLevel: real('total_stock_level'), // For calculating the % bar
  
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

// --------------------------------------------------------
// 2. DOSES TABLE (The "Schedule Rules")
// One Medicine -> Many Doses (e.g. 1 @ 8am, 2 @ 9pm)
// --------------------------------------------------------
export const doses = sqliteTable('doses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  
  medicationId: integer('medication_id')
    .references(() => medications.id, { onDelete: 'cascade' }) // If med deleted, delete schedule
    .notNull(),

  // "Daily" vs "Specific Days"
  // If this string is null, we assume DAILY. 
  // If it has value like "[0, 6]", it means Sun & Sat.
  days: text('days'), 

  time: text('time').notNull(), // Format: "08:00", "22:30"
  qty: real('qty').notNull().default(1.0), // How many to take at this specific time
  notificationId: text("notification_id"), // <--- NEW COLUMN for notification 
});

// --------------------------------------------------------
// 3. LOGS TABLE (The "History")
// Tracks actions. Linked to Medicine AND Dose.
// --------------------------------------------------------
export const logs = sqliteTable('logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  
  // Relates to the Medicine (Always Required)
  medicationId: integer('medication_id')
    .references(() => medications.id, { onDelete: 'cascade' })
    .notNull(),
  
  // Relates to the specific Schedule/Dose (Optional)
  // Why Optional? If I lose a pill at random time, it's not tied to a schedule.
  doseId: integer('dose_id').references(() => doses.id),

  action: text('action', { enum: ['TAKEN', 'SKIPPED', 'LOST'] }).notNull(),
  
  timestamp: integer('timestamp', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

// --------------------------------------------------------
// 4. REFILLS TABLE (The "Purchases")
// --------------------------------------------------------
export const refills = sqliteTable('refills', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  
  medicationId: integer('medication_id')
    .references(() => medications.id, { onDelete: 'cascade' })
    .notNull(),
  
  qty: real('qty').notNull(), // Amount added
  price: real('price'),
  pharmacyName: text('pharmacy_name'),
  
  refillDate: integer('refill_date', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

// --------------------------------------------------------
// 5. RELATIONSHIPS
// --------------------------------------------------------

export const medicationRelations = relations(medications, ({ many }) => ({
  doses: many(doses),
  logs: many(logs),
  refills: many(refills),
}));

export const doseRelations = relations(doses, ({ one, many }) => ({
  medication: one(medications, {
    fields: [doses.medicationId],
    references: [medications.id],
  }),
  logs: many(logs), // One schedule rule has many history logs
}));

export const logsRelations = relations(logs, ({ one }) => ({
  medication: one(medications, {
    fields: [logs.medicationId],
    references: [medications.id],
  }),
  dose: one(doses, {
    fields: [logs.doseId],
    references: [doses.id],
  }),
}));

export const refillsRelations = relations(refills, ({ one }) => ({
  medication: one(medications, {
    fields: [refills.medicationId],
    references: [medications.id],
  }),
}));

export const appSettings = sqliteTable("app_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  
  // Existing
  showDaysSupply: integer("show_days_supply", { mode: "boolean" }).default(true),
  refillThresholdDays: integer("refill_threshold_days").default(5),
  
  // NEW FEATURES
  userName: text("user_name").default("Grandpa"),
  hapticEnabled: integer("haptic_enabled", { mode: "boolean" }).default(true),
  themePreference: text("theme_preference").default("system"), // 'system', 'light', 'dark'
});
