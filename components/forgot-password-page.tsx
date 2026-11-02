"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, LockKeyhole, Mail, ShieldCheck } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [notice, setNotice] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim() })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "We couldn't process your request. Please try again.");
      setSubmitted(true);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The password recovery service is unavailable.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-page">
      <Link href="/auth/signin" className="auth-back"><ArrowLeft size={15} /> Back to sign in</Link>
      <div className="auth-layout">
        <section className="auth-brand-panel">
          <Link href="/" className="auth-brand"><span className="brand-symbol" aria-hidden="true"><Image src="/favicon.svg" alt="" width={26} height={26} priority /></span><strong>NVOIDAI</strong></Link>
          <div className="auth-brand-copy">
            <span className="auth-overline">YOUR ACCOUNT, SECURED</span>
            <h1>Get back to what’s next.</h1>
            <p>One quick step to regain access to your account and continue discovering opportunities with NVOIDAI.</p>
          </div>
          <div className="auth-brand-points">
            <div><Mail size={17} /><span>Receive a secure password recovery link by email</span></div>
            <div><ShieldCheck size={17} /><span>Your account stays protected throughout recovery</span></div>
            <div><LockKeyhole size={17} /><span>Choose a new password before signing in again</span></div>
          </div>
          <div className="auth-brand-footer">NVOIDAI · AI-powered employment platform</div>
        </section>

        <section className="auth-form-panel">
          <div className="auth-form-heading">
            <span className="auth-form-icon">{submitted ? <CheckCircle2 size={20} /> : <Mail size={20} />}</span>
            <span className="auth-overline">ACCOUNT RECOVERY</span>
            <h2>{submitted ? "Check your inbox" : "Forgot your password?"}</h2>
            <p>{submitted ? "If an account is registered with that email, password reset instructions will be on their way." : "Enter the email address associated with your account. We’ll send instructions to reset your password."}</p>
          </div>

          {!submitted ? (
            <form className="auth-form" onSubmit={submit}>
              <label>Email address<span className="auth-input"><Mail size={16} /><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" /></span></label>
              {notice && <div className="auth-error" role="alert">{notice}</div>}
              <button className="auth-submit" type="submit" disabled={busy}>{busy ? "Sending instructions…" : "Send reset instructions"}<ArrowRight size={16} /></button>
            </form>
          ) : (
            <div className="auth-forgot-success" role="status">
              <span><CheckCircle2 size={19} /></span>
              <div><strong>Request submitted</strong><p>Check your inbox and spam folder for the recovery email. The message will only confirm whether an account can be recovered.</p></div>
            </div>
          )}

          <p className="auth-switch">{submitted ? "Ready to try again?" : "Remembered your password?"} <Link href="/auth/signin">Back to sign in</Link></p>
          <p className="auth-terms">For security, this page doesn’t reveal whether an email address has an account.</p>
        </section>
      </div>
    </main>
  );
}
