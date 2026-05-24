import Google from "next-auth/providers/google";
import type { NextAuthConfig } from "next-auth";

/**
 * Edge-compatible auth config — NO adapter, NO db, NO Node.js imports.
 * Used only by middleware.ts which runs in Edge Runtime.
 */
export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn  = !!auth?.user;
      const isAuthPage  = nextUrl.pathname.startsWith("/login");
      const isApiAuth   = nextUrl.pathname.startsWith("/api/auth");
      const isRoot      = nextUrl.pathname === "/";

      if (isApiAuth)                            return true;
      // Root "/" — skip an extra page.tsx auth() call by redirecting here
      if (isRoot)                               return Response.redirect(new URL(isLoggedIn ? "/dashboard" : "/login", nextUrl));
      if (isLoggedIn && isAuthPage)             return Response.redirect(new URL("/dashboard", nextUrl));
      if (!isLoggedIn && !isAuthPage)           return Response.redirect(new URL("/login", nextUrl));
      return true;
    },
  },
};
