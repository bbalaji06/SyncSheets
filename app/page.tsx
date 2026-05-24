import { redirect } from "next/navigation";

// Middleware handles the "/" redirect before this renders.
// This is just a safety fallback — no auth() call needed.
export default function Home() {
  redirect("/dashboard");
}
