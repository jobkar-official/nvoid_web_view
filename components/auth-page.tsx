"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, Building2, Eye, EyeOff, LockKeyhole, Mail, Search, ShieldCheck, UserRound } from "lucide-react";
import WorkerMark from "./worker-mark";

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
    <main className="auth-page auth-page-worker">
      <Link href="/" className="auth-back"><ArrowLeft size={15} /> Back to Worker</Link>
      <div className="auth-layout">
        <section className="auth-brand-panel" aria-labelledby="auth-brand-heading">
          <Link href="/" className="auth-brand" aria-label="worker.com home">
            <span className="auth-brand-mark"><WorkerMark size={25} /></span>
            <span className="auth-brand-wordmark">worker<span>.com</span></span>
          </Link>
          <div className="auth-brand-copy">
            <span className="auth-overline"><span className="auth-overline-dot" /> WORK, CONNECT, GROW</span>
            <h1 id="auth-brand-heading">
              {isRegister ? <>Build your next chapter <span>with Worker.</span></> : <>Your next opportunity is closer <span>than you think.</span></>}
            </h1>
            <p>Discover relevant opportunities, explore jobs across public sources and company career pages, and connect with the right people.</p>
          </div>
          <div className="auth-brand-points">
            <div><span className="auth-point-icon"><Search size={17} /></span><span>Explore opportunities across the job market</span></div>
            <div><span className="auth-point-icon"><ShieldCheck size={17} /></span><span>Keep control of your profile and applications</span></div>
            <div><span className="auth-point-icon"><BriefcaseBusiness size={17} /></span><span>Connect with employers and hiring teams</span></div>
          </div>
          <div className="auth-brand-footer">worker.com <span>·</span> AI-powered job discovery</div>
        </section>

        <section className="auth-form-panel" aria-labelledby="auth-form-title">
          <div className="auth-form-heading">
            <span className="auth-form-icon">{isRegister ? <UserRound size={20} /> : <LockKeyhole size={20} />}</span>
            <span className="auth-overline">{isRegister ? "GET STARTED" : "WELCOME BACK"}</span>
            <h2 id="auth-form-title">{isRegister ? "Create your account" : "Sign in to Worker"}</h2>
            <p>{isRegister ? "Choose how you want to use Worker to get started." : "Enter your details to continue to your workspace."}</p>
          </div>

          <form className="auth-form" onSubmit={submit}>
            {isRegister && (
              <>
                <div className="auth-role-picker" role="group" aria-label="Choose account type">
                  <button type="button" className={role === "4" ? "selected" : ""} aria-pressed={role === "4"} onClick={() => setRole("4")}>
                    <UserRound size={17} />
                    <strong>Job seeker</strong>
                    <small>Find your next opportunity</small>
                  </button>
                  <button type="button" className={role === "3" ? "selected" : ""} aria-pressed={role === "3"} onClick={() => setRole("3")}>
                    <Building2 size={17} />
                    <strong>Recruiter</strong>
                    <small>Discover and hire talent</small>
                  </button>
                </div>
                <label className="auth-field" htmlFor="auth-name">
                  <span>Full name</span>
                  <input id="auth-name" name="name" required value={name} onChange={(event) => setName(event.target.value)} placeholder="Enter your full name" autoComplete="name" />
                </label>
              </>
            )}

            <label className="auth-field" htmlFor="auth-email">
              <span>Email address</span>
              <span className="auth-input">
                <Mail size={17} aria-hidden="true" />
                <input id="auth-email" name="email" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" />
              </span>
            </label>

            <label className="auth-field" htmlFor="auth-password">
              <span>Password</span>
              <span className="auth-input">
                <LockKeyhole size={17} aria-hidden="true" />
                <input
                  id="auth-password"
                  name="password"
                  required
                  minLength={isRegister ? 8 : undefined}
                  type={visible ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={isRegister ? "At least 8 characters" : "Enter your password"}
                  autoComplete={isRegister ? "new-password" : "current-password"}
                />
                <button type="button" className="auth-password-toggle" aria-label={visible ? "Hide password" : "Show password"} aria-pressed={visible} onClick={() => setVisible((value) => !value)}>
                  {visible ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </span>
              {isRegister && <small className="auth-field-hint">Use at least 8 characters for your password.</small>}
            </label>

            {notice && <div className="auth-error" id="auth-error" role="alert">{notice}</div>}

            <button className="auth-submit" type="submit" disabled={busy}>
              <span>{busy ? "Connecting…" : isRegister ? "Create free account" : "Sign in"}</span>
              <ArrowRight size={17} />
            </button>
          </form>

          <p className="auth-switch">
            {isRegister ? "Already have an account?" : "New to Worker?"}
            {" "}<Link href={isRegister ? "/auth/signin" : "/auth/register"}>{isRegister ? "Sign in" : "Create an account"}</Link>
          </p>
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
