import type { Metadata } from "next";
import AuthPage from "../../../components/auth-page";

export const metadata: Metadata = { title: "Sign in — Nvoid", robots: { index: false, follow: false } };

export default function SignInPage() {
  return <AuthPage mode="signin" />;
}
