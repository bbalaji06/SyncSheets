"use client";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[120px]" />
      </div>

      <div className="relative z-10 text-center max-w-xl">
        {/* Logo */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-600/30 mb-8 text-3xl">
          🔄
        </div>

        <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-br from-white to-gray-400 bg-clip-text text-transparent mb-4">
          SheetSync
        </h1>
        <p className="text-lg text-gray-400 mb-2">
          Sync Google Sheets into Supabase Postgres.
        </p>
        <p className="text-sm text-gray-500 mb-10">
          No code. No credentials.json. Just log in with Google and paste your Supabase key.
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {["Google OAuth", "Auto schema inference", "Dedup via row hash", "Repeated sync safe", "Supabase native"].map(f => (
            <span key={f} className="px-3 py-1 rounded-full bg-gray-800 border border-gray-700 text-xs text-gray-300">
              ✓ {f}
            </span>
          ))}
        </div>

        {/* CTA */}
        <button
          id="btn-google-login"
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-white text-gray-900 font-semibold text-base hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <p className="mt-6 text-xs text-gray-600">
          We request read-only access to your Google Sheets. Your credentials are never stored in plaintext.
        </p>

        {/* Footer */}
        <footer className="mt-12 text-xs text-gray-600 flex items-center justify-center gap-4 border-t border-gray-850/20 pt-6">
          <span>© {new Date().getFullYear()} SheetSync</span>
          <span className="text-gray-800">•</span>
          <Link href="/privacy" className="hover:text-indigo-400 underline decoration-indigo-500/30 underline-offset-4 transition-colors">
            Privacy Policy
          </Link>
        </footer>
      </div>
    </main>
  );
}
