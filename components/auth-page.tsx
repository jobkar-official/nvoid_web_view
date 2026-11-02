"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Building2, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, UserRound } from "lucide-react";
import { signInWithJobkar } from "../lib/context/auth-client";
import { buildTrackedApplicationUrl } from "../lib/application-url";

export default function AuthPage({ mode }: { mode: "signin" | "register" }) {
  const isRegister = mode === "register";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"4" | "3">("4");
  const [visible, setVisible] = useState(false);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [applyUrl, setApplyUrl] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("role") === "3") setRole("3");
    const destination = params.get("applyUrl");
    if (destination) setApplyUrl(buildTrackedApplicationUrl(destination) || "");
    else setApplyUrl("");
  }, [mode]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    try {
      if (isRegister) {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name, email, password, roleId: Number(role) })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "Registration could not be completed.");
        if (!data.authenticated) throw new Error("The authentication service did not confirm this session.");
      } else {
        const session = await signInWithJobkar(email, password);
        if (!session.authenticated) throw new Error("Jobkar authentication did not confirm this session.");
      }
      window.location.assign("/");
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
          <Link href="/" className="auth-brand"><span className="brand-symbol" aria-hidden="true"><Image src="/favicon.svg" alt="" width={26} height={26} priority /></span><strong>NVOIDAI</strong></Link>
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
          <div className="auth-brand-footer">NVOIDAI · AI-powered employment platform</div>
        </section>
        <section className="auth-form-panel">
          <div className="auth-form-heading">
            <span className="auth-form-icon">{isRegister ? <UserRound size={20} /> : <LockKeyhole size={20} />}</span>
            <span className="auth-overline">{isRegister ? "CREATE YOUR ACCOUNT" : "ACCOUNT ACCESS"}</span>
            <h2>{isRegister ? "Join Nvoid" : "Sign in"}</h2>
            <p>{applyUrl ? "Your selected job application will open in a new tab after you successfully " + (isRegister ? "create your account." : "sign in.") : isRegister ? "Start with a free candidate or employer account." : "Continue to Nvoid."}</p>
          </div>
          <form className="auth-form" onSubmit={submit}>
            {isRegister && (
              <div className="auth-role-picker" aria-label="Choose account type">
                <button type="button" className={role === "4" ? "selected" : ""} onClick={() => setRole("4")}><UserRound size={16} /><strong>Job seeker</strong><small>{isRegister ? "Find opportunities" : "Job seeker account"}</small></button>
                <button type="button" className={role === "3" ? "selected" : ""} onClick={() => setRole("3")}><Building2 size={16} /><strong>Recruiter</strong><small>{isRegister ? "Hire talent" : "Recruiter account"}</small></button>
              </div>
            )}
            {isRegister && <label>Full name<input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Your full name" autoComplete="name" /></label>}
            <label>Email address<span className="auth-input"><Mail size={16} /><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" /></span></label>
            <label>Password<span className="auth-input"><LockKeyhole size={16} /><input required minLength={8} type={visible ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" autoComplete={isRegister ? "new-password" : "current-password"} /><button type="button" aria-label={visible ? "Hide password" : "Show password"} onClick={() => setVisible((value) => !value)}>{visible ? <EyeOff size={16} /> : <Eye size={16} />}</button></span>{!isRegister && <span className="auth-forgot-row"><Link href="/auth/forgot-password">Forgot password?</Link></span>}</label>
            {notice && <div className="auth-error" role="alert">{notice}</div>}
            <button className="auth-submit" type="submit" disabled={busy}>{busy ? "Connecting…" : isRegister ? "Create free account" : "Sign in"}<ArrowRight size={16} /></button>
          </form>
          <p className="auth-switch">{isRegister ? "Already have an account?" : "New to Nvoid?"} <Link href={(isRegister ? "/auth/signin" : "/auth/register") + (applyUrl ? "?applyUrl=" + encodeURIComponent(applyUrl) : "")}>{isRegister ? "Sign in" : "Create an account"}</Link></p>
          <p className="auth-terms">By continuing, you agree to the <Link href="/terms">Terms</Link> and acknowledge the <Link href="/privacy">Privacy Policy</Link>.</p>

        </section>
      </div>
    </main>
  );
}

function SearchIcon() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>;
}
