import type { ReactNode } from "react";
import { GuestShell } from "../../components/guest-shell";
import "./agent-crawl.css";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return <GuestShell>{children}</GuestShell>;
}
