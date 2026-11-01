import type { Metadata } from "next";
import ForgotPasswordPage from "../../../components/forgot-password-page";

export const metadata: Metadata = {
  title: "Forgot password — Nvoid",
  robots: { index: false, follow: false }
};

export default function ForgotPasswordRoute() {
  return <ForgotPasswordPage />;
}
