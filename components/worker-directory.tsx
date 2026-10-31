"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight, Bot, BrainCircuit, BriefcaseBusiness, CheckCircle2, Code2,
  Cpu, Database, Globe2, Layers3, Network, Puzzle, Search, ShieldCheck,
  Workflow, type LucideIcon
} from "lucide-react";

export type WorkerDirectoryEntry = {
  name: string;
  category: string;
  kind: string;
  status: string;
  description: string;
  detail?: string;
  icon: "bot" | "brain" | "briefcase" | "code" | "cpu" | "database" | "globe" | "layers" | "network" | "puzzle" | "search" | "shield" | "workflow";
  href?: string;
  linkLabel?: string;
};

export type WorkerDirectoryConfig = {
  eyebrow: string;
  title: string;
  description: string;
  categories: string[];
  entries: WorkerDirectoryEntry[];
  note: string;
};

const iconMap: Record<WorkerDirectoryEntry["icon"], LucideIcon> = {
  bot: Bot,
  brain: BrainCircuit,
  briefcase: BriefcaseBusiness,
  code: Code2,
  cpu: Cpu,
  database: Database,
  globe: Globe2,
  layers: Layers3,
  network: Network,
  puzzle: Puzzle,
  search: Search,
  shield: ShieldCheck,
  workflow: Workflow
};

export default function WorkerDirectory({ config }: { config: WorkerDirectoryConfig }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  const categories = useMemo(() => ["All", ...config.categories], [config.categories]);
  const filteredEntries = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return config.entries.filter((entry) => {
      const matchesCategory = category === "All" || entry.category === category;
      const searchable = [entry.name, entry.category, entry.kind, entry.description, entry.detail, entry.status]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return matchesCategory && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [category, config.entries, query]);

  return (
    <div className="catalog-page worker-directory-page">
      <section className="worker-directory-hero">
        <span className="section-kicker">{config.eyebrow}</span>
        <h1>{config.title}</h1>
        <p>{config.description}</p>
        <div className="worker-directory-meta">
          <span><Layers3 size={13} /> Worker ecosystem catalogue</span>
          <span><CheckCircle2 size={13} /> {config.entries.length} documented entries</span>
          <span><ShieldCheck size={13} /> Availability is labelled honestly</span>
        </div>
        <label className="worker-directory-search">
          <Search size={16} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search capabilities, providers or integrations"
            aria-label="Search directory"
          />
        </label>
      </section>

      <div className="worker-directory-toolbar">
        <div className="worker-directory-tabs" aria-label="Filter directory categories">
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              className={"worker-directory-tab" + (category === item ? " active" : "")}
              aria-pressed={category === item}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <span className="worker-directory-count">{filteredEntries.length} of {config.entries.length} entries</span>
      </div>

      <div className="worker-directory-grid">
        {filteredEntries.map((entry) => {
          const Icon = iconMap[entry.icon];
          return (
            <article className="worker-directory-card" key={entry.name}>
              <div className="worker-directory-card-top">
                <span className="worker-directory-icon"><Icon size={18} strokeWidth={1.8} /></span>
                <span className="worker-directory-type">{entry.kind}</span>
              </div>
              <h2>{entry.name}</h2>
              <p>{entry.description}</p>
              {entry.detail && <div className="worker-directory-detail">{entry.detail}</div>}
              <div className="worker-directory-card-bottom">
                <span className="worker-directory-status">{entry.status}</span>
                {entry.href && (
                  <Link href={entry.href} className="worker-directory-link">
                    {entry.linkLabel || "Explore"} <ArrowUpRight size={13} />
                  </Link>
                )}
              </div>
            </article>
          );
        })}
        {filteredEntries.length === 0 && (
          <div className="worker-directory-empty">
            No matching entries. Try another keyword or category.
          </div>
        )}
      </div>

      <p className="worker-directory-note">{config.note}</p>
    </div>
  );
}
