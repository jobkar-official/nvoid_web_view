"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Globe2, LoaderCircle, MapPin, ShieldCheck, UserRound } from "lucide-react";
import { usersApi, type User } from "../lib/api/profile.api";

function roleLabel(roleId: number) {
  if (roleId === 3) return "Employer";
  if (roleId === 4) return "Job seeker";
  return "Nvoid member";
}

function initials(value?: string | null) {
  return (value || "Member").trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase() || "").join("") || "M";
}

export default function PublicProfilePage({ slug }: { slug: string }) {
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setNotFound(false);
    usersApi.getUserDetailBySlug(slug)
      .then(result => {
        if (!active) return;
        if (!result || !result.id || !result.name) {
          setNotFound(true);
          return;
        }
        setProfile(result);
      })
      .catch(cause => {
        if (!active) return;
        const message = cause instanceof Error ? cause.message : "This profile could not be loaded.";
        if (/not found|does not exist|no record|no data/i.test(message)) setNotFound(true);
        else setError(message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [slug]);

  if (loading) {
    return <main className="public-profile-page"><section className="public-profile-state"><LoaderCircle className="spin" size={24} /><strong>Loading professional profile…</strong><p>Retrieving public profile information.</p></section></main>;
  }

  if (error) {
    return <main className="public-profile-page"><section className="public-profile-state"><span><UserRound size={23} /></span><strong>Profile unavailable</strong><p>{error}</p><Link href="/people">Back to Grow Network <ArrowRight size={15} /></Link></section></main>;
  }

  if (notFound || !profile) {
    return <main className="public-profile-page"><section className="public-profile-state"><span><UserRound size={23} /></span><strong>Profile not found</strong><p>This profile may be unavailable or the address may be incorrect.</p><Link href="/people">Back to Grow Network <ArrowRight size={15} /></Link></section></main>;
  }

  const location = [profile.city, profile.state, profile.country].filter(Boolean).join(", ");

  return (
    <main className="public-profile-page">
      <div className="public-profile-back"><Link href="/people"><ArrowLeft size={15} /> Grow Network</Link></div>
      <section className="public-profile-card">
        <div className="public-profile-cover">
          {profile.coverImage && /^https?:\/\//i.test(profile.coverImage) && <Image src={profile.coverImage} alt="" fill unoptimized sizes="100vw" />}
        </div>
        <div className="public-profile-main">
          <div className="public-profile-avatar">
            {profile.imageUrl && /^https?:\/\//i.test(profile.imageUrl)
              ? <Image src={profile.imageUrl} alt="" width={104} height={104} unoptimized />
              : <span>{initials(profile.name)}</span>}
          </div>
          <div className="public-profile-heading">
            <div>
              <span className="public-profile-eyebrow"><ShieldCheck size={13} /> PUBLIC PROFILE</span>
              <h1>{profile.name}</h1>
              <p>{roleLabel(profile.roleId)}</p>
            </div>
            {profile.openToWork && <span className="public-profile-open-status"><span /> Open to work</span>}
          </div>
          {location && <div className="public-profile-location"><MapPin size={15} />{location}</div>}
          <div className="public-profile-divider" />
          <section className="public-profile-about">
            <h2>About</h2>
            <p>{profile.bio || profile.description || "This member has not added a professional summary yet."}</p>
          </section>
          <div className="public-profile-footer">
            <span><Globe2 size={14} /> NVOIDAI professional network</span>
            <Link href="/job-search">Explore opportunities <ArrowRight size={15} /></Link>
          </div>
        </div>
      </section>
    </main>
  );
}
