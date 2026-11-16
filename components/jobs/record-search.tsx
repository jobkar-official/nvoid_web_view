"use client";

import { useEffect } from "react";
import { useGuestHistory } from "../guest-shell";

export default function RecordSearch({ jobTitle, location, resultCount }: { jobTitle: string; location: string; resultCount: number }) {
  const { saveSearch } = useGuestHistory();
  useEffect(() => {
    saveSearch({ jobTitle, location, resultCount });
  }, [jobTitle, location, resultCount, saveSearch]);
  return null;
}
