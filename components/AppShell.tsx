"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

const navItems = [
  { href: "/dashboard",  icon: "⚡", label: "Dashboard" },
  { href: "/sync/new",   icon: "➕", label: "New Sync"  },
  { href: "/history",    icon: "📋", label: "History"   },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-800">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-lg shadow-lg shadow-indigo-600/30">
            🔄
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">SheetSync</p>
            <p className="text-[10px] text-gray-500">Sheets → Supabase</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 flex flex-col gap-1">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                ${pathname === item.href
                  ? "bg-indigo-600/20 text-indigo-400 shadow-sm"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"}`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User footer */}
        <div className="p-3 border-t border-gray-800">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800/50">
            {session?.user?.image && (
              <img src={session.user.image} className="w-7 h-7 rounded-full" alt="" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{session?.user?.name}</p>
              <p className="text-[10px] text-gray-500 truncate">{session?.user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full mt-2 px-3 py-2 text-xs text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-all text-left"
          >
            ↩ Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto bg-gray-950">
        {children}
      </main>
    </div>
  );
}
