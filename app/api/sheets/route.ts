import { auth }           from "@/lib/auth";
import { listUserSheets, listSheetTabs } from "@/lib/googleSheets";
import { NextRequest }    from "next/server";

/** GET /api/sheets — list Drive spreadsheet files */
export async function GET() {
  const session = await auth();
  if (!session?.accessToken) return new Response("Unauthorized", { status: 401 });

  const files = await listUserSheets(session.accessToken);
  return Response.json(files);
}

/** GET /api/sheets/tabs?id=SPREADSHEET_ID */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.accessToken) return new Response("Unauthorized", { status: 401 });

  const { spreadsheetId } = await req.json();
  const tabs = await listSheetTabs(session.accessToken, spreadsheetId);
  return Response.json(tabs);
}
