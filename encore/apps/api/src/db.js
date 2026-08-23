import Database from 'better-sqlite3';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const DB_PATH = process.env.ENCORE_DB_PATH || join(__dirname, '..', 'data.db');

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// 1. Base schema — idempotent; only creates missing objects.
const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

// 2. Migrations — each file runs exactly once, tracked in schema_migrations.
const migrationsDir = join(__dirname, 'migrations');
const files = readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
const applied = new Set(
  db.prepare('SELECT id FROM schema_migrations').all().map(r => r.id),
);
const record = db.prepare('INSERT INTO schema_migrations (id) VALUES (?)');

for (const file of files) {
  if (applied.has(file)) continue;
  const sql = readFileSync(join(migrationsDir, file), 'utf8');
  const tx = db.transaction(() => {
    db.exec(sql);
    record.run(file);
  });
  try {
    tx();
    console.log(`[migration] applied ${file}`);
  } catch (err) {
    console.error(`[migration] failed ${file}:`, err.message);
    throw err;
  }
}
