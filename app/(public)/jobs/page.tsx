import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BriefcaseBusiness, BookmarkCheck, ClipboardList } from "lucide-react";
import { getNvoidSession } from "../../../lib/auth-session";

export const metadata: Metadata = {
  title: "My Jobs | NVOIDAI",
  description: "Access your saved job opportunities and application activity on NVOIDAI.",
  robots: { index: false, follow: false }
};

export default async function JobsPage() {
  const session = await getNvoidSession();
  if (session) redirect("/application");

  return (
    <main className="my-jobs-page">
      <section className="my-jobs-hero">
        <span className="my-jobs-eyebrow"><BriefcaseBusiness size={15} /> YOUR JOB ACTIVITY</span>
        <h1>Your jobs, in one place.</h1>
        <p>Sign in to access the jobs you have saved and the application activity available to your account.</p>
        <div className="my-jobs-actions">
          <Link href="/auth/signin?next=%2Fapplication" className="my-jobs-primary">Sign in to My Jobs <ArrowRight size={16} /></Link>
          <Link href="/job-search" className="my-jobs-secondary">Find jobs</Link>
        </div>
      </section>
      <section className="my-jobs-features">
        <article><span><BookmarkCheck size={19} /></span><div><strong>Saved opportunities</strong><p>Return to vacancies you saved while browsing.</p></div></article>
        <article><span><ClipboardList size={19} /></span><div><strong>Application activity</strong><p>Review application information made available to your account.</p></div></article>
      </section>
    </main>
  );
}
