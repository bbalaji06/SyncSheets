import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { ColumnMeta, sanitizeValue, rowHash } from "./schemaInference";
import { Client } from "pg";

export function getUserSupabaseClient(url: string, serviceRoleKey: string): SupabaseClient {
  // Remove trailing slash to prevent "Invalid path specified in request URL" error
  const sanitizedUrl = url.replace(/\/$/, "");
  return createClient(sanitizedUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Create the table (if not exists) and add any new columns.
 * Uses a direct pg connection since Supabase REST doesn't expose DDL.
 */
export async function ensureTable(
  dbUrl: string,
  tableName: string,
  columns: ColumnMeta[],
  log: (msg: string) => void
): Promise<void> {
  const client = new Client({ connectionString: dbUrl });
  await client.connect();

  try {
    // CREATE TABLE with _row_hash for dedup
    const ddl = `
      CREATE TABLE IF NOT EXISTS public."${tableName}" (
        id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        _row_hash   text UNIQUE,
        created_at  timestamptz DEFAULT now(),
        ${columns.map(c => `"${c.snake}" ${c.type}`).join(",\n        ")}
      );
    `;
    await client.query(ddl);
    log(`✅ Table "public.${tableName}" ready`);

    // Add any missing columns (for repeated syncs with new columns)
    for (const col of columns) {
      await client.query(`
        ALTER TABLE public."${tableName}"
        ADD COLUMN IF NOT EXISTS "${col.snake}" ${col.type};
      `);
    }
  } finally {
    await client.end();
  }
}

/** Upsert rows using _row_hash for deduplication */
export async function upsertRows(
  supabase: SupabaseClient,
  tableName: string,
  columns: ColumnMeta[],
  dataRows: string[][]
): Promise<number> {
  const records: Record<string, unknown>[] = [];

  for (const row of dataRows) {
    const values: unknown[] = [];
    const obj: Record<string, unknown> = {};

    for (const col of columns) {
      const value = sanitizeValue(row[col.index], col.type);
      obj[col.snake] = value;
      values.push(value);
    }

    if (values.every((v) => v === null)) continue;

    obj["_row_hash"] = rowHash(values);
    records.push(obj);
  }

  if (records.length === 0) return 0;

  const { error } = await supabase
    .from(tableName)
    .upsert(records, { onConflict: "_row_hash", ignoreDuplicates: false });
  if (error) throw new Error(`Upsert failed: ${error.message}`);

  return records.length;
}
