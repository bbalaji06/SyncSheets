import { google } from "googleapis";

function getAuthClient(accessToken: string) {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  auth.setCredentials({ access_token: accessToken });
  return auth;
}

export async function listUserSheets(accessToken: string) {
  const auth = getAuthClient(accessToken);
  const drive = google.drive({ version: "v3", auth });
  const res = await drive.files.list({
    q: "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false",
    fields: "files(id, name, modifiedTime)",
    orderBy: "modifiedTime desc",
    pageSize: 50,
  });
  return res.data.files ?? [];
}

export async function listSheetTabs(accessToken: string, spreadsheetId: string) {
  const auth = getAuthClient(accessToken);
  const sheets = google.sheets({ version: "v4", auth });
  const res = await sheets.spreadsheets.get({ spreadsheetId });
  return (res.data.sheets ?? []).map((s) => s.properties?.title ?? "");
}

export async function fetchSheetRows(
  accessToken: string,
  spreadsheetId: string,
  sheetName: string
): Promise<string[][]> {
  const auth = getAuthClient(accessToken);
  const sheets = google.sheets({ version: "v4", auth });
  console.log("Calling Google Sheets API for range:", sheetName);
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: sheetName,
    majorDimension: "ROWS",
  });
  console.log("Google Sheets API returned", res.data.values?.length, "rows");
  const rows = (res.data.values ?? []) as Array<Array<string | number | boolean | null>>;
  return trimSheetRows(rows);
}

function trimSheetRows(rows: Array<Array<string | number | boolean | null>>): string[][] {
  const normalized = rows.map((row) => {
    const cells = [...row];
    while (cells.length > 0 && isEmptyCell(cells[cells.length - 1])) {
      cells.pop();
    }
    return cells.map((cell) => String(cell ?? ""));
  });

  while (normalized.length > 0 && normalized[normalized.length - 1].every((cell) => cell.trim() === "")) {
    normalized.pop();
  }

  return normalized;
}

function isEmptyCell(value: string | number | boolean | null | undefined): boolean {
  return value === null || value === undefined || String(value).trim() === "";
}
