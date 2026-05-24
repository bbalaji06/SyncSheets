"use client";

import { useEffect, useRef, useState } from "react";
import AppShell from "@/components/AppShell";

interface LogLine {
  text: string;
  type: "info" | "success" | "error" | "accent";
}

const LOG_FLUSH_MS = 250;
const MAX_LOG_LINES = 250;

export default function NewSyncPage() {
  const [form, setForm] = useState({
    spreadsheetId: "",
    sheetName: "",
    tableName: "",
    supabaseUrl: "",
    serviceRoleKey: "",
    dbUrl: "",
  });
  const [tabs, setTabs] = useState<string[]>([]);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [progress, setProg] = useState(0);
  const [running, setRun] = useState(false);
  const [done, setDone] = useState<"success" | "error" | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const pendingLogsRef = useRef<LogLine[]>([]);
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const flushLogs = () => {
    flushTimerRef.current = null;
    if (pendingLogsRef.current.length === 0) return;

    const pending = pendingLogsRef.current;
    pendingLogsRef.current = [];
    setLogs(prev => [...prev, ...pending].slice(-MAX_LOG_LINES));
  };

  const addLog = (text: string, immediate = false) => {
    const type: LogLine["type"] =
      text.startsWith("SUCCESS") ? "success" :
      text.startsWith("ERROR") || text.startsWith("WARN") ? "error" :
      text.startsWith("COLUMN") ? "accent" :
      "info";

    pendingLogsRef.current.push({ text, type });

    if (immediate) {
      if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
      flushLogs();
      return;
    }

    if (!flushTimerRef.current) {
      flushTimerRef.current = setTimeout(flushLogs, LOG_FLUSH_MS);
    }
  };

  useEffect(() => {
    if (!logRef.current) return;
    logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  useEffect(() => {
    return () => {
      if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
    };
  }, []);

  const fetchTabs = async () => {
    if (!form.spreadsheetId) return;
    const res = await fetch("/api/sheets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spreadsheetId: form.spreadsheetId }),
    });
    const data = await res.json();
    setTabs(data);
  };

  const startSync = async () => {
    pendingLogsRef.current = [];
    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }

    setRun(true);
    setLogs([]);
    setProg(5);
    setDone(null);
    addLog("INFO Starting sync...", true);

    const res = await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "Unknown error");
      addLog(`ERROR Server error (${res.status}): ${txt}`, true);
      setRun(false);
      return;
    }

    if (!res.body) {
      addLog("ERROR No response body received from server", true);
      setRun(false);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done: streamDone } = await reader.read();
      if (streamDone) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() ?? "";
      for (const part of parts) {
        const line = part.replace(/^data: /, "");
        if (!line) continue;
        if (line.startsWith("__DONE__:")) {
          flushLogs();
          const ok = line === "__DONE__:0";
          setDone(ok ? "success" : "error");
          setProg(100);
          setRun(false);
        } else {
          addLog(line);
          setProg(p => Math.min(92, p + 2));
        }
      }
    }
  };

  const logColor = {
    success: "text-emerald-400",
    error: "text-red-400",
    accent: "text-indigo-300",
    info: "text-gray-400",
  };

  return (
    <AppShell>
      <div className="p-8 max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">New Sync</h1>
          <p className="text-gray-400 text-sm mt-1">Connect a Google Sheet to your Supabase database</p>
        </div>

        <div className="space-y-6">
          <section className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-600/30 text-indigo-400 text-xs flex items-center justify-center font-bold">1</span>
              Google Sheet
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider font-medium block mb-1.5">Spreadsheet ID</label>
                <div className="flex gap-2">
                  <input
                    id="input-spreadsheet-id"
                    value={form.spreadsheetId}
                    onChange={e => set("spreadsheetId", e.target.value)}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 font-mono"
                    placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
                  />
                  <button
                    onClick={fetchTabs}
                    className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm text-gray-300 hover:text-white transition-all"
                  >
                    Load Tabs
                  </button>
                </div>
                <p className="text-xs text-gray-600 mt-1">Found in your Sheet URL after /d/</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider font-medium block mb-1.5">Sheet Tab</label>
                {tabs.length > 0 ? (
                  <select
                    id="select-sheet-tab"
                    value={form.sheetName}
                    onChange={e => set("sheetName", e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Select a tab...</option>
                    {tabs.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                ) : (
                  <input
                    id="input-sheet-name"
                    value={form.sheetName}
                    onChange={e => set("sheetName", e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 font-mono"
                    placeholder="Sheet1"
                  />
                )}
              </div>
            </div>
          </section>

          <section className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-600/30 text-emerald-400 text-xs flex items-center justify-center font-bold">2</span>
              Supabase Target Database
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider font-medium block mb-1.5">Supabase Project URL</label>
                <input
                  id="input-supabase-url"
                  value={form.supabaseUrl}
                  onChange={e => set("supabaseUrl", e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 font-mono"
                  placeholder="https://xxxx.supabase.co"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider font-medium block mb-1.5">Service Role Key</label>
                <input
                  id="input-service-role-key"
                  type="password"
                  value={form.serviceRoleKey}
                  onChange={e => set("serviceRoleKey", e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 font-mono"
                  placeholder="eyJ..."
                />
                <p className="text-xs text-gray-600 mt-1">Settings - API - service_role (secret). Used in-request only, never stored.</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider font-medium block mb-1.5">Direct DB URL (for table creation)</label>
                <input
                  id="input-db-url"
                  type="password"
                  value={form.dbUrl}
                  onChange={e => set("dbUrl", e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 font-mono"
                  placeholder="postgresql://postgres:password@db.xxxx.supabase.co:5432/postgres"
                />
                <p className="text-xs text-gray-600 mt-1">Settings - Database - Connection string (direct)</p>
              </div>
            </div>
          </section>

          <section className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-600/30 text-amber-400 text-xs flex items-center justify-center font-bold">3</span>
              Target Table
            </h2>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider font-medium block mb-1.5">Table Name</label>
              <input
                id="input-table-name"
                value={form.tableName}
                onChange={e => set("tableName", e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_"))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 font-mono"
                placeholder="my_sheet_data"
              />
              <p className="text-xs text-gray-600 mt-1">Created in the public schema of your Supabase project.</p>
            </div>
          </section>

          <button
            id="btn-start-sync"
            onClick={startSync}
            disabled={running}
            className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-base transition-all shadow-lg shadow-indigo-600/20 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-3"
          >
            {running
              ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Syncing...</>
              : "Start Sync"}
          </button>

          {(logs.length > 0 || running) && (
            <section className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              <div className="h-1 bg-gray-800">
                <div className="h-full bg-indigo-500 transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
              </div>

              {done && (
                <div className={`px-6 py-3 text-sm font-medium ${done === "success" ? "bg-emerald-600/10 text-emerald-400 border-b border-emerald-600/20" : "bg-red-600/10 text-red-400 border-b border-red-600/20"}`}>
                  {done === "success" ? "Sync completed successfully." : "Sync failed. Check logs below."}
                </div>
              )}

              <div ref={logRef} className="p-4 h-72 overflow-y-auto font-mono text-xs space-y-0.5 bg-gray-950">
                {logs.map((l, i) => (
                  <div key={i} className={`log-line ${logColor[l.type]}`}>
                    <span className="text-gray-700 mr-2 select-none">[{String(i + 1).padStart(3, "0")}]</span>
                    {l.text}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </AppShell>
  );
}
