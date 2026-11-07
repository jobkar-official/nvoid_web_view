import type { ReactNode } from "react";
import { GuestShell } from "../../components/guest-shell";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return <GuestShell>{children}</GuestShell>;
}
