"use client";

import { ExternalLink } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../lib/context/AuthContext";
import { buildTrackedApplicationUrl } from "../../lib/application-url";
import styles from "./jobs.module.css";

export default function ApplyButton({ url, source }: { url: string; source: string }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [notice, setNotice] = useState("");

  function apply() {
    setNotice("");
    if (isLoading) {
      setNotice("Checking your account. Try again in a moment.");
      return;
    }

    const destination = buildTrackedApplicationUrl(url, source);
    if (!destination) {
      setNotice("This listing has no valid application link.");
      return;
    }

    if (isAuthenticated) {
      const tab = window.open(destination, "_blank");
      if (!tab) setNotice("Allow pop-ups to open the application in a new tab.");
      else tab.opener = null;
      return;
    }

    const waitingTab = window.open(`/auth/apply-redirect?destination=${encodeURIComponent(destination)}`, "_blank");
    if (!waitingTab) {
      setNotice("Allow pop-ups, then select Apply now again to continue after signing in.");
      return;
    }
    window.location.assign(`/auth/signin?applyUrl=${encodeURIComponent(destination)}`);
  }

  return (
    <div className={styles.applyArea}>
      <button type="button" className={styles.apply} onClick={apply}>
        Apply now <ExternalLink size={14} aria-hidden />
      </button>
      {notice && <p className={styles.applyNote} role="status">{notice}</p>}
    </div>
  );
}
