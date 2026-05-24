import crypto from "crypto";

export interface ColumnMeta {
  index:    number;
  original: string;
  snake:    string;
  type:     PgType;
}

type PgType = "text" | "numeric" | "integer" | "boolean" | "date" | "timestamptz";

/* ---- helpers (ported from createTablesFromSheets.js) ---- */

const toSnakeCase = (str = "") =>
  str.toString().toLowerCase().trim()
    .replace(/[^\w]+/g, "_")
    .replace(/^_|_$/g, "");

const isDate = (val: string) => {
  if (typeof val !== "string" || val.length < 6) return false;
  const dateRx = /^(\d{1,4}[-\/.]\d{1,2}[-\/.]\d{1,4})/;
  const isoRx  = /^\d{4}-\d{2}-\d{2}T/;
  if (!dateRx.test(val.trim()) && !isoRx.test(val.trim())) return false;
  return normalizeDateValue(val, "date") !== null;
};

const isNumber = (val: string) =>
  val !== "" && /^-?\d+(?:\.\d+)?$/.test(String(val).trim());

const isBoolean = (val: string) =>
  ["yes","no","true","false","y","n","1","0"].includes(String(val).toLowerCase());

function inferType(columnName: string, samples: string[]): PgType {
  const name = columnName.toLowerCase().replace(/[^\w]+/g, "_");

  if (name.includes("timestamp"))                                          return "timestamptz";
  
  // Prioritize numeric keywords over ambiguous "planned"/"actual"
  if (["qty","quantity","rate","amount","tax","price","cost"].some(k => name.includes(k))) return "numeric";
  if (name.includes("delay") || name.includes("day") || name.includes("no_"))       return "integer";
  if (name.includes("with_tax") || name.startsWith("is_"))                return "boolean";
  
  // Explicit date-like headers get first pass, but generic names like "planned" or "actual"
  // should fall back to sample-based inference.
  if (name.includes("date")) return "date";

  if (name.includes("number") || name.includes("id") || name.includes("code") || name.includes("ref")) {
    return samples.length > 0 && samples.every(isNumber) ? "numeric" : "text";
  }

  if (samples.length > 0) {
    let numC = 0, dateC = 0, boolC = 0;
    for (const v of samples) {
      if      (isBoolean(v)) boolC++;
      else if (isDate(v))    dateC++;
      else if (isNumber(v))  numC++;
    }
    if (boolC >= 2) return "boolean";
    if (dateC >= 2) return "date";
    if (numC  >= 2) return "numeric";
  }
  return "text";
}

/* ---- public API ---- */

export function inferSchema(headers: string[], sampleRows: string[][]): ColumnMeta[] {
  return headers
    .map((header, colIndex) => {
      if (!header) return null;
      const snake   = toSnakeCase(header);
      if (snake === "id") return null;                      // skip — we generate our own
      const samples = sampleRows.slice(0, 10).map(r => r[colIndex]).filter(Boolean);
      return { index: colIndex, original: header, snake, type: inferType(header, samples) };
    })
    .filter(Boolean) as ColumnMeta[];
}

export function sanitizeValue(val: unknown, type: PgType): unknown {
  if (val === null || val === undefined || val === "") return null;
  const s = String(val).trim();

  if (type === "numeric" || type === "integer") {
    const n = parseFloat(s.replace(/[^\d.-]/g, ""));
    if (isNaN(n)) return null;
    return type === "integer" ? Math.floor(n) : n;
  }
  if (type === "date" || type === "timestamptz") {
    return normalizeDateValue(s, type);
  }
  if (type === "boolean") {
    if (["yes","true","y","1"].includes(s.toLowerCase())) return true;
    if (["no","false","n","0"].includes(s.toLowerCase()))  return false;
    return null;
  }
  return s;
}

export function rowHash(values: unknown[]): string {
  return crypto.createHash("md5").update(values.map(String).join("|")).digest("hex");
}

function normalizeDateValue(value: string, type: Extract<PgType, "date" | "timestamptz">): string | null {
  const s = value.trim();
  if (!s) return null;

  const isoMatch = s.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2})(?::(\d{2})(?::(\d{2})(\.\d{1,3})?)?)?(Z|[+-]\d{2}:\d{2})?)?$/
  );
  if (isoMatch) {
    const [, yearStr, monthStr, dayStr] = isoMatch;
    const year = Number(yearStr);
    const month = Number(monthStr);
    const day = Number(dayStr);

    if (!isValidCalendarDate(year, month, day)) return null;
    if (type === "date") return `${yearStr}-${monthStr}-${dayStr}`;

    const parsed = new Date(s);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }

  const looseMatch = s.match(/^(\d{1,4})[\/.](\d{1,2})[\/.](\d{1,4})$/);
  if (!looseMatch) return null;

  const [, first, second, third] = looseMatch;

  // Support yyyy/mm/dd and dd/mm/yyyy. Reject ambiguous two-digit years.
  const ymd =
    first.length === 4 ? [Number(first), Number(second), Number(third)] :
    third.length === 4 ? [Number(third), Number(second), Number(first)] :
    null;

  if (!ymd) return null;

  const [year, month, day] = ymd;
  if (!isValidCalendarDate(year, month, day)) return null;

  const normalized = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return type === "date" ? normalized : `${normalized}T00:00:00.000Z`;
}

function isValidCalendarDate(year: number, month: number, day: number): boolean {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
  if (year < 1000 || year > 9999) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  const dt = new Date(Date.UTC(year, month - 1, day));
  return (
    dt.getUTCFullYear() === year &&
    dt.getUTCMonth() === month - 1 &&
    dt.getUTCDate() === day
  );
}
