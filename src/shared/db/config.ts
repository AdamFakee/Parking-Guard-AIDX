// Database configuration constants

export const DB_VERSION = 4;
export const DB_NAME = `app_parking_v${DB_VERSION}.db`;

export const DB_CONFIG = {
  // Bật foreign keys cho SQLite (quan trọng khi dùng ORM với relations)
  enableForeignKeys: true,
};
