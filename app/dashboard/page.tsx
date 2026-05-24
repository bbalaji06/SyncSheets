import { auth }    from "@/lib/auth";
import Link        from "next/link";

export default async function DashboardPage() {
  // Middleware already ensures the user is authenticated before reaching here.
  // auth() here is only to read the session data (user name) — no redirect needed.
  const session = (await auth())!;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">Welcome back, {session.user?.name?.split(" ")[0]} 👋</p>
        </div>
        <Link
          href="/sync/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/20 hover:-translate-y-0.5"
        >
          ➕ New Sync
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total Syncs",   value: "—",   icon: "🔄", color: "text-indigo-400" },
          { label: "Rows Synced",   value: "—",   icon: "📦", color: "text-emerald-400" },
          { label: "Tables Created",value: "—",   icon: "🗂️", color: "text-amber-400"  },
        ].map(s => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 relative overflow-hidden group hover:border-gray-700 transition-colors">
            <div className="text-2xl absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">{s.icon}</div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">{s.label}</p>
            <p className={`text-3xl font-extrabold font-mono ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Syncs placeholder */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="font-semibold text-white">Recent Sync Jobs</h2>
          <Link href="/history" className="text-xs text-indigo-400 hover:text-indigo-300">View all →</Link>
        </div>
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-600">
          <span className="text-4xl">📭</span>
          <p className="text-sm">No syncs yet.</p>
          <Link href="/sync/new" className="text-xs text-indigo-400 hover:text-indigo-300">
            Run your first sync →
          </Link>
        </div>
      </div>
    </div>
  );
}
