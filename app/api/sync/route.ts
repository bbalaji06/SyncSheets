import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { runSync } from "@/lib/syncOrchestrator";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.accessToken) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { spreadsheetId, sheetName, tableName, supabaseUrl, serviceRoleKey, dbUrl } = body;

  console.log("Sync request received for table:", tableName);

  if (!spreadsheetId || !sheetName || !tableName || !supabaseUrl || !serviceRoleKey || !dbUrl) {
    console.error("Missing required fields in sync request");
    return new Response("Missing required fields", { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (line: string) => {
        controller.enqueue(encoder.encode(`data: ${line}\n\n`));
      };

      try {
        console.log("Starting runSync generator...");
        for await (const log of runSync({
          accessToken: session.accessToken,
          spreadsheetId,
          sheetName,
          tableName,
          supabaseUrl,
          serviceRoleKey,
          dbUrl,
        })) {
          send(log);
        }
        console.log("Sync generator finished");
        send("__DONE__:0");
      } catch (err: unknown) {
        console.error("Sync engine error:", err);
        const message = err instanceof Error ? err.message : "Unknown sync error";
        send(`ERROR ${message}`);
        send("__DONE__:1");
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
