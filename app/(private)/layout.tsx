import type { ReactNode } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getNvoidSession } from "../../lib/auth-session";
import "./private.css";
import "../product-design-system.css";
import "../brand-light-override.css";
import { GuestShell } from "../../components/guest-shell";

export const metadata: Metadata = {
  robots: { index: false, follow: false }
};

export default async function PrivateLayout({ children }: { children: ReactNode }) {
  const session = await getNvoidSession();
  if (!session) redirect("/auth/signin");
  return <GuestShell>{children}</GuestShell>;
}
