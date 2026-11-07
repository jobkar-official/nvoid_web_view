"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, LoaderCircle, RefreshCw, Search, Users, UserRound } from "lucide-react";
import { usersApi, type RelatedPerson } from "../lib/api/profile.api";

const PAGE_SIZE = 12;

function initials(value?: string | null) {
  return (value || "Member").trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase() || "").join("") || "M";
}

function roleLabel(roleId: number) {
  if (roleId === 3) return "Employer";
  if (roleId === 4) return "Job seeker";
  return "Nvoid member";
}

export default function GrowNetworkPage({ userId }: { userId: string | null }) {
  const [people, setPeople] = useState<RelatedPerson[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const requestInFlight = useRef(false);

  const loadPeople = useCallback(async (nextPage: number, append: boolean) => {
    if (!userId || requestInFlight.current) return;
    requestInFlight.current = true;
    setLoading(true);
    setError("");
    try {
      const result = await usersApi.getRelatedPersons(userId, nextPage, PAGE_SIZE);
      setPeople(current => append ? [...current, ...result.filter(person => !current.some(existing => existing.id === person.id))] : result);
      setPage(nextPage);
      setHasMore(result.length === PAGE_SIZE);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "People suggestions could not be loaded.");
    } finally {
      requestInFlight.current = false;
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) void loadPeople(1, false);
  }, [loadPeople, userId]);

  const filteredPeople = useMemo(() => {
    const search = query.trim().toLocaleLowerCase();
    if (!search) return people;
    return people.filter(person => [person.name, person.slug, person.bio, roleLabel(person.roleId)]
      .some(value => String(value || "").toLocaleLowerCase().includes(search)));
  }, [people, query]);

  if (!userId) {
    return (
      <main className="grow-network-page">
        <section className="grow-network-hero">
          <span className="grow-network-eyebrow"><Users size={15} /> YOUR PROFESSIONAL NETWORK</span>
          <h1>Grow your professional network.</h1>
          <p>Sign in to discover people connected to your professional profile and explore the Nvoid community.</p>
          <div className="grow-network-actions">
            <Link href="/auth/signin" className="grow-network-primary">Sign in <ArrowRight size={16} /></Link>
            <Link href="/auth/register" className="grow-network-secondary">Create account</Link>
          </div>
        </section>
        <section className="grow-network-guest-note">
          <Users size={20} />
          <div><strong>Your network starts with your profile</strong><p>Complete your professional details after signing in so the network service can suggest relevant members.</p></div>
        </section>
      </main>
    );
  }

  return (
    <main className="grow-network-page">
      <section className="grow-network-hero">
        <span className="grow-network-eyebrow"><Users size={15} /> YOUR PROFESSIONAL NETWORK</span>
        <h1>Grow your professional network.</h1>
        <p>Explore people suggested by the network service using your Nvoid account.</p>
        <div className="grow-network-search">
          <Search size={17} />
          <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search people by name, profile or role" aria-label="Search people" />
        </div>
      </section>

      <section className="grow-network-results" aria-labelledby="grow-network-results-title">
        <div className="grow-network-results-heading">
          <div><span>NETWORK DISCOVERY</span><h2 id="grow-network-results-title">Suggested people</h2></div>
          <span className="grow-network-count">{filteredPeople.length} shown</span>
        </div>

        {error && (
          <div className="grow-network-alert" role="alert">
            <AlertCircle size={17} /><span>{error}</span>
            <button type="button" onClick={() => void loadPeople(1, false)} disabled={loading}><RefreshCw size={14} /> Retry</button>
          </div>
        )}

        {loading && people.length === 0 && (
          <div className="grow-network-state"><LoaderCircle className="spin" size={22} /><strong>Finding people for your network…</strong><p>Loading suggestions from your account network.</p></div>
        )}

        {!loading && !error && people.length === 0 && (
          <div className="grow-network-state">
            <span><Users size={22} /></span>
            <strong>No people suggestions available yet</strong>
            <p>Complete your profile and check again when the network service has suggestions for your account.</p>
            <Link href="/profile">Complete your profile <ArrowRight size={15} /></Link>
          </div>
        )}

        {filteredPeople.length > 0 && (
          <div className="grow-network-grid">
            {filteredPeople.map(person => (
              <article className="grow-network-card" key={person.id}>
                <div className="grow-network-card-top">
                  <span className="grow-network-avatar">
                    {person.imageUrl && /^https?:\/\//i.test(person.imageUrl)
                      ? <Image src={person.imageUrl} alt="" width={52} height={52} unoptimized />
                      : <span>{initials(person.name)}</span>}
                  </span>
                  <span className="grow-network-role">{roleLabel(person.roleId)}</span>
                </div>
                <h3>{person.name || "Nvoid member"}</h3>
                {person.slug && <span className="grow-network-handle">@{person.slug}</span>}
                <p>{person.bio?.trim() || "This member has not added a professional summary yet."}</p>
                <div className="grow-network-card-footer"><UserRound size={14} /><span>Suggested member</span></div>
              </article>
            ))}
          </div>
        )}

        {!loading && people.length > 0 && filteredPeople.length === 0 && (
          <div className="grow-network-state"><Search size={22} /><strong>No people match that search</strong><p>Try a different name, profile handle or role.</p></div>
        )}

        {hasMore && (
          <div className="grow-network-load-more">
            <button type="button" onClick={() => void loadPeople(page + 1, true)} disabled={loading}>
              {loading ? <LoaderCircle className="spin" size={15} /> : null}
              {loading ? "Loading people…" : "Load more people"}
              {!loading && <ArrowRight size={15} />}
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
