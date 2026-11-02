"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LoaderCircle, ShieldCheck } from "lucide-react";
import { buildTrackedApplicationUrl } from "../lib/application-url";

export default function ApplyRedirect() {
  const [status, setStatus] = useState<"waiting" | "invalid" | "timeout">("waiting");

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const destination = buildTrackedApplicationUrl(query.get("destination") || "");
    if (!destination) {
      setStatus("invalid");
      return;
    }

    let stopped = false;
    let attempts = 0;
    let timer: number | undefined;

    const checkSession = async () => {
      try {
        const response = await fetch("/api/auth/session", {
          method: "GET",
          cache: "no-store",
          credentials: "same-origin",
          headers: { accept: "application/json" }
        });
        if (response.ok) {
          const session = await response.json();
          if (session.authenticated) {
            window.location.replace(destination);
            return;
          }
        }
      } catch {}

      attempts += 1;
      if (stopped) return;
      if (attempts >= 900) {
        setStatus("timeout");
        return;
      }
      timer = window.setTimeout(checkSession, 1000);
    };

    void checkSession();
    return () => {
      stopped = true;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, []);

  return (
    <main className="auth-page nvoid-apply-redirect">
      <section className="nvoid-apply-redirect-card" aria-live="polite">
        {status === "waiting" ? <LoaderCircle className="spin" size={24} /> : <ShieldCheck size={24} />}
        <h1>{status === "waiting" ? "Continue to your application" : status === "invalid" ? "Application link unavailable" : "Sign-in window expired"}</h1>
        <p>{status === "waiting" ? "This tab will open the original job application after you finish signing in or creating your NVOIDAI account in the other tab." : status === "invalid" ? "The job source did not provide a valid web address. Return to your search and open the original listing." : "Authentication was not completed in time. You can close this tab and try Apply Now again."}</p>
        <Link href="/" className="nvoid-apply-redirect-home">Back to NVOIDAI</Link>
      </section>
    </main>
  );
}
