import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

/**
 * Proxy uses the EDGE-SAFE authConfig only.
 * No pg, no DrizzleAdapter, no Node.js crypto.
 */
export default NextAuth(authConfig).auth;

export const config = {
  // Exclude static assets, API routes (they do their own auth), and Next.js internals
  matcher: ["/((?!api|_next/data|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"],
};
