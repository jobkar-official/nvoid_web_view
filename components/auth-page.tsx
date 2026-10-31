"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, Building2, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, Sparkles, UserRound } from "lucide-react";

export default function AuthPage({ mode }: { mode: "signin" | "register" }) {
  const isRegister = mode === "register";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"4" | "3">("4");
  const [visible, setVisible] = useState(false);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const requestedRole = new URLSearchParams(window.location.search).get("role");
    if (requestedRole === "3") setRole("3");
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch("/api/auth/" + mode, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, password, roleId: Number(role) })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Authentication could not be completed.");
      if (!data.authenticated) throw new Error("The authentication service did not confirm this session.");
      const next = new URLSearchParams(window.location.search).get("next");
      const destination = next && next.startsWith("/") && !next.startsWith("//") ? next : "/workspace";
      window.location.assign(destination);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Authentication service is unavailable.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-page">
      <Link href="/" className="auth-back"><ArrowLeft size={15} /> Back to Nvoid</Link>
      <div className="auth-layout">
        <section className="auth-brand-panel">
          <Link href="/" className="auth-brand"><span className="brand-symbol"><Sparkles size={20} /></span><strong>NVOID</strong></Link>
          <div className="auth-brand-copy">
            <span className="auth-overline">EMPLOYMENT, WITH INTELLIGENCE</span>
            <h1>{isRegister ? "Your next opportunity starts here." : "Welcome back to your next opportunity."}</h1>
            <p>Discover jobs across connected sources, let your AI agent keep looking and connect with employers in one place.</p>
          </div>
          <div className="auth-brand-points">
            <div><SearchIcon /><span>Discover opportunities across the job market</span></div>
            <div><ShieldCheck size={17} /><span>One professional profile for smarter matching</span></div>
            <div><Building2 size={17} /><span>Free job posting and hiring workspace</span></div>
          </div>
          <div className="auth-brand-footer">Nvoid · AI-powered employment platform</div>
        </section>
        <section className="auth-form-panel">
          <div className="auth-form-heading">
            <span className="auth-form-icon">{isRegister ? <UserRound size={20} /> : <LockKeyhole size={20} />}</span>
            <span className="auth-overline">{isRegister ? "CREATE YOUR ACCOUNT" : "ACCOUNT ACCESS"}</span>
            <h2>{isRegister ? "Join Nvoid" : "Sign in"}</h2>
            <p>{isRegister ? "Start with a free candidate or employer account." : "Continue to your Nvoid workspace."}</p>
          </div>
          <form className="auth-form" onSubmit={submit}>
            {isRegister && (
              <>
                <div className="auth-role-picker">
                  <button type="button" className={role === "4" ? "selected" : ""} onClick={() => setRole("4")}><UserRound size={16} /><strong>Job seeker</strong><small>Find opportunities</small></button>
                  <button type="button" className={role === "3" ? "selected" : ""} onClick={() => setRole("3")}><Building2 size={16} /><strong>Recruiter</strong><small>Hire talent</small></button>
                </div>
                <label>Full name<input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Your full name" autoComplete="name" /></label>
              </>
            )}
            <label>Email address<span className="auth-input"><Mail size={16} /><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" /></span></label>
            <label>Password<span className="auth-input"><LockKeyhole size={16} /><input required minLength={8} type={visible ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" autoComplete={isRegister ? "new-password" : "current-password"} /><button type="button" aria-label={visible ? "Hide password" : "Show password"} onClick={() => setVisible((value) => !value)}>{visible ? <EyeOff size={16} /> : <Eye size={16} />}</button></span></label>
            {notice && <div className="auth-error" role="alert">{notice}</div>}
            <button className="auth-submit" type="submit" disabled={busy}>{busy ? "Connecting…" : isRegister ? "Create free account" : "Sign in"}<ArrowRight size={16} /></button>
          </form>
          <p className="auth-switch">{isRegister ? "Already have an account?" : "New to Nvoid?"} <Link href={isRegister ? "/auth/signin" : "/auth/register"}>{isRegister ? "Sign in" : "Create an account"}</Link></p>
          <p className="auth-terms">By continuing, you agree to the <Link href="/terms">Terms</Link> and acknowledge the <Link href="/privacy">Privacy Policy</Link>.</p>
          {process.env.NODE_ENV !== "production" && (
            <div className="auth-preview">
              <span>Workspace UI preview · development only</span>
              <div><Link href="/preview/workspace/4"><BriefcaseBusiness size={13} /> Seeker</Link><Link href="/preview/workspace/3"><Building2 size={13} /> Recruiter</Link><Link href="/preview/workspace/7"><ShieldCheck size={13} /> Support</Link></div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function SearchIcon() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>;
}
