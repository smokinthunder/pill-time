// src/core/database/client.ts
import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";
import * as schema from "./schema"; // <--- IMPORTANT

export const expoDb = openDatabaseSync("medicinedb.db");

// Pass the schema here so Drizzle knows about your tables
export const db = drizzle(expoDb, { schema });
