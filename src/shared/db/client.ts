import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as SQLite from 'expo-sqlite';
import { DB_CONFIG, DB_NAME } from './config';
import * as schemas from './schemas';

export const sqliteDb = SQLite.openDatabaseSync(DB_NAME);

if (DB_CONFIG.enableForeignKeys) {
  sqliteDb.execSync('PRAGMA foreign_keys = ON;');
}

export const db = drizzle(sqliteDb, { schema: schemas });
