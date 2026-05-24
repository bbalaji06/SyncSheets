import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 py-16 px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-indigo-600/5 blur-[150px]" />
        <div className="absolute top-1/2 -right-40 w-[400px] h-[400px] rounded-full bg-indigo-500/5 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto">
        {/* Navigation / Header */}
        <div className="flex items-center justify-between mb-12 pb-6 border-b border-gray-800">
          <Link href="/login" className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors text-sm font-medium">
            ← Back to Login
          </Link>
          <div className="text-xs text-gray-500 font-mono">Last updated: May 24, 2026</div>
        </div>

        {/* Header Title */}
        <div className="mb-10 text-center md:text-left">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-xl mb-4">
            🛡️
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-br from-white to-gray-400 bg-clip-text text-transparent">
            Privacy Policy
          </h1>
          <p className="text-gray-400 mt-2 text-sm">
            How SheetSync collects, uses, and safeguards your Google and Supabase data.
          </p>
        </div>

        {/* Content Card */}
        <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 md:p-10 space-y-8 shadow-xl">
          
          {/* Section 1: Intro */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <span className="text-indigo-400">1.</span> Introduction
            </h2>
            <p className="text-gray-300 leading-relaxed text-sm">
              Welcome to SheetSync. We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our application to synchronize data between Google Sheets and your Supabase PostgreSQL databases.
            </p>
          </section>

          {/* Section 2: Data Collection */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <span className="text-indigo-400">2.</span> Information We Collect
            </h2>
            <p className="text-gray-300 leading-relaxed text-sm mb-3">
              To provide our sync services, we request access to specific information via Google OAuth:
            </p>
            <ul className="space-y-2.5 text-sm text-gray-300">
              <li className="flex gap-3">
                <span className="text-indigo-400 font-bold">•</span>
                <div>
                  <strong className="text-white">Google Profile Information:</strong> We access your basic profile (email, name, and profile picture) to identify you and manage your SheetSync account.
                </div>
              </li>
              <li className="flex gap-3">
                <span className="text-indigo-400 font-bold">•</span>
                <div>
                  <strong className="text-white">Google Sheets Data (Read-Only):</strong> We request read-only access to your spreadsheets (`spreadsheets.readonly` and `drive.readonly` scopes) solely to fetch active data rows to sync to your database.
                </div>
              </li>
              <li className="flex gap-3">
                <span className="text-indigo-400 font-bold">•</span>
                <div>
                  <strong className="text-white">Supabase Connection Details:</strong> We store your Supabase URL, service role key, and database connection strings to write Google Sheets rows into your specified database tables.
                </div>
              </li>
            </ul>
          </section>

          {/* Section 3: Data Usage */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <span className="text-indigo-400">3.</span> How We Use Your Data
            </h2>
            <p className="text-gray-300 leading-relaxed text-sm">
              Your Google Sheets data is fetched dynamically during a active sync request. SheetSync **never caches, retains, or stores** the contents of your Google Sheets on our servers. The data is parsed in memory and streamed directly to your Supabase PostgreSQL database. 
            </p>
            <p className="text-gray-300 leading-relaxed text-sm">
              Your Google OAuth tokens are stored securely in your database using modern encryption standards.
            </p>
          </section>

          {/* Section 4: Data Security */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <span className="text-indigo-400">4.</span> Google API Limited Use Disclosure
            </h2>
            <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-2xl p-5 text-sm leading-relaxed text-gray-300">
              <strong className="text-white block mb-1">Google API Services User Data Policy:</strong>
              SheetSync's use and transfer of information received from Google APIs to any other app will adhere to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">Google API Services User Data Policy</a>, including the Limited Use requirements. We do not sell, rent, or share your data with third parties or advertising networks.
            </div>
          </section>

          {/* Section 5: Data Deletion */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <span className="text-indigo-400">5.</span> Your Rights & Data Deletion
            </h2>
            <p className="text-gray-300 leading-relaxed text-sm">
              You can revoke SheetSync's access to your Google Account at any time through your Google Account Security settings. If you wish to permanently delete your SheetSync account and all stored encryption keys and connection details, please contact us or delete your connection within the dashboard settings.
            </p>
          </section>

          {/* Section 6: Contact */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <span className="text-indigo-400">6.</span> Contact Us
            </h2>
            <p className="text-gray-300 leading-relaxed text-sm">
              If you have any questions, concerns, or requests regarding this Privacy Policy, please feel free to reach out:
            </p>
            <div className="text-sm bg-gray-950/60 rounded-xl p-4 border border-gray-800 font-mono text-gray-400">
              Email: privacy@sheetsync.example.com
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-xs text-gray-600">
          © {new Date().getFullYear()} SheetSync. All rights reserved.
        </div>
      </div>
    </main>
  );
}
