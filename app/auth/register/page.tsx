import type { Metadata } from "next";
import AuthPage from "../../../components/auth-page";

export const metadata: Metadata = { title: "Create an account — Nvoid", robots: { index: false, follow: false } };

export default function RegisterPage() {
  return <AuthPage mode="register" />;
}
