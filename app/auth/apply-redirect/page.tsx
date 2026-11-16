import type { Metadata } from "next";
import ApplyRedirect from "../../../components/apply-redirect";

export const metadata: Metadata = {
  title: "Continue to application | NVOIDAI",
  robots: { index: false, follow: false }
};

export default function ApplyRedirectPage() {
  return <ApplyRedirect />;
}
