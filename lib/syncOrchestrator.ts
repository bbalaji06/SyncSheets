import { fetchSheetRows } from "./googleSheets";
import { inferSchema } from "./schemaInference";
import { ensureTable, getUserSupabaseClient, upsertRows } from "./supabaseExecutor";

export interface SyncConfig {
  accessToken: string;
  spreadsheetId: string;
  sheetName: string;
  tableName: string;
  supabaseUrl: string;
  serviceRoleKey: string;
  dbUrl: string;
  batchSize?: number;
}

const DEFAULT_BATCH_SIZE = 50;

export async function* runSync(config: SyncConfig): AsyncGenerator<string> {
  const {
    accessToken,
    spreadsheetId,
    sheetName,
    tableName,
    supabaseUrl,
    serviceRoleKey,
    dbUrl,
  } = config;
  const batchSize = Math.max(1, config.batchSize ?? DEFAULT_BATCH_SIZE);

  const syncStartedAt = Date.now();

  yield `INFO Fetching data from "${sheetName}"...`;
  const fetchStartedAt = Date.now();
  const rows = await fetchSheetRows(accessToken, spreadsheetId, sheetName);
  yield `INFO Google fetch completed in ${elapsedMs(fetchStartedAt)}ms`;

  if (rows.length === 0) {
    yield "WARN Sheet is empty; nothing to sync.";
    return;
  }

  const [headers, ...dataRows] = rows;
  yield `INFO Found ${headers.length} columns and ${dataRows.length} data rows`;

  yield "INFO Inferring column types...";
  const schemaStartedAt = Date.now();
  const schema = inferSchema(headers, dataRows);
  yield `INFO Schema inference completed in ${elapsedMs(schemaStartedAt)}ms`;
  for (const col of schema) {
    yield `COLUMN "${col.original}" -> ${col.snake} (${col.type})`;
  }

  yield `INFO Creating or verifying table "public.${tableName}"...`;
  const ddlStartedAt = Date.now();
  await ensureTable(dbUrl, tableName, schema, () => undefined);
  yield `SUCCESS Table "public.${tableName}" ready in ${elapsedMs(ddlStartedAt)}ms`;

  yield "INFO Connecting to target Supabase...";
  const supabase = getUserSupabaseClient(supabaseUrl, serviceRoleKey);

  yield `INFO Upserting ${dataRows.length} rows in batches of ${batchSize}...`;
  let total = 0;
  const batchCount = Math.ceil(dataRows.length / batchSize);

  for (let i = 0; i < dataRows.length; i += batchSize) {
    const batch = dataRows.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const batchStartedAt = Date.now();
    const inserted = await upsertRows(supabase, tableName, schema, batch);
    total += inserted;

    if (shouldLogBatch(batchNum, batchCount)) {
      yield `INFO Batch ${batchNum}/${batchCount}: ${inserted} rows upserted in ${elapsedMs(batchStartedAt)}ms`;
    }
  }

  yield `SUCCESS Done. ${total} rows synced to "public.${tableName}" in ${elapsedMs(syncStartedAt)}ms`;
}

function elapsedMs(startedAt: number): number {
  return Date.now() - startedAt;
}

function shouldLogBatch(batchNum: number, batchCount: number): boolean {
  return batchCount <= 10 || batchNum === 1 || batchNum === batchCount || batchNum % 5 === 0;
}
