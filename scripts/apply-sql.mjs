// Apply one or more .sql files to the database in DATABASE_URL.
// Usage: node scripts/apply-sql.mjs <file.sql> [more.sql ...]
// DATABASE_URL is read from the environment (never hardcode it). Supabase requires SSL.
//
// This is the DDL channel for the hosted project (DECISIONS D11): PostgREST cannot run
// DDL, and `supabase db push` errors on storage-object ownership, so migrations and
// functions are applied here with a direct Postgres connection.
import pg from 'pg';
import { readFileSync } from 'node:fs';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL not set (source .env.test.local first).');
const files = process.argv.slice(2);
if (files.length === 0) throw new Error('Pass at least one .sql file.');

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();
try {
  for (const f of files) {
    const sql = readFileSync(f, 'utf8');
    process.stdout.write(`applying ${f} ... `);
    await client.query(sql);
    console.log('ok');
  }
} finally {
  await client.end();
}
console.log('DONE');
