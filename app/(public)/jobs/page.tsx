import type { Metadata } from "next";
import IndexedJobsPage from "../../../components/indexed-jobs-page";

export const metadata: Metadata = {
  title: "My Jobs | NVOIDAI",
  description: "Browse open opportunities collected from public company career pages and filter the NVOIDAI indexed job catalogue.",
  robots: { index: false, follow: true }
};

export default function JobsPage() {
  return <IndexedJobsPage />;
}
