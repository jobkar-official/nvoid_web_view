import { Building2, CalendarClock, Globe, Layers, MapPin, Search, SlidersHorizontal, Sparkles } from "lucide-react";
import Form from "next/form";
import Link from "next/link";
import type { IndexSummary } from "../../lib/api/agent.api";
import { activeFilterCount, toParams, type JobFilters } from "../../lib/jobs/filters";
import { countLabel, sourceLabel } from "../../lib/jobs/format";
import styles from "./jobs.module.css";

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <span className={styles.control}>{icon}{children}</span>
    </label>
  );
}

export default function JobsFilters({ filters, summary }: { filters: JobFilters; summary: IndexSummary | null }) {
  const active = activeFilterCount(filters);
  const sources = [...(summary?.sources ?? [])].sort((a, b) => b.count - a.count);

  return (
    <>
      <input id="jobs-filter-toggle" type="checkbox" className={styles.filterToggle} />
      <label htmlFor="jobs-filter-toggle" className={styles.filterButton}>
        <SlidersHorizontal size={16} aria-hidden />
        Filters{active > 0 ? ` (${active})` : ""}
      </label>

      <Form action="/jobs" className={styles.filters} key={JSON.stringify(toParams(filters))}>
        <div className={styles.filtersHead}>
          <strong>Refine your search</strong>
          {active > 0 && <Link href="/jobs" className={styles.clear}>Clear all</Link>}
        </div>

        <Field label="Keyword or role" icon={<Search size={16} aria-hidden />}>
          <input name="q" defaultValue={filters.q} placeholder="e.g. Product designer" maxLength={120} autoComplete="off" />
        </Field>
        <Field label="Skills" icon={<Sparkles size={16} aria-hidden />}>
          <input name="skills" defaultValue={filters.skills} placeholder="e.g. Java, Spring Boot" maxLength={120} autoComplete="off" />
        </Field>
        <Field label="Location" icon={<MapPin size={16} aria-hidden />}>
          <input name="location" defaultValue={filters.location} placeholder="City, country or remote" maxLength={120} autoComplete="off" />
        </Field>
        <Field label="Company" icon={<Building2 size={16} aria-hidden />}>
          <input name="company" defaultValue={filters.company} placeholder="e.g. Stripe" maxLength={120} autoComplete="off" />
        </Field>
        {sources.length > 0 && (
          <Field label="Job source" icon={<Layers size={16} aria-hidden />}>
            <select name="source" defaultValue={filters.source}>
              <option value="">All sources</option>
              {sources.map(({ id, count }) => <option key={id} value={id}>{sourceLabel(id)} ({countLabel(count)})</option>)}
            </select>
          </Field>
        )}
        <Field label="Work arrangement" icon={<Globe size={16} aria-hidden />}>
          <select name="remote" defaultValue={filters.remote}>
            <option value="">Any</option>
            <option value="only">Remote only</option>
            <option value="exclude">On-site or hybrid</option>
          </select>
        </Field>
        <Field label="Date posted" icon={<CalendarClock size={16} aria-hidden />}>
          <select name="posted" defaultValue={filters.posted}>
            <option value="">Any time</option>
            <option value="1">Past 24 hours</option>
            <option value="7">Past week</option>
            <option value="30">Past month</option>
          </select>
        </Field>

        <button type="submit" className={styles.primary}>Show jobs</button>
      </Form>
    </>
  );
}
