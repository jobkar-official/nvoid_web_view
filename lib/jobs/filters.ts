export type SearchParamsInput = Record<string, string | string[] | undefined>;

export interface JobFilters {
  q: string;
  location: string;
  skills: string;
  company: string;
  source: string;
  remote: "" | "only" | "exclude";
  posted: "" | "1" | "7" | "30";
  page: number;
}

const REMOTE_VALUES = ["only", "exclude"] as const;
const POSTED_VALUES = ["1", "7", "30"] as const;

function text(value: string | string[] | undefined, max = 120) {
  return (Array.isArray(value) ? value[0] : value)?.trim().slice(0, max) ?? "";
}

export function readFilters(input: SearchParamsInput, queryKey: "q" | "role" = "q"): JobFilters {
  const remote = text(input.remote);
  const posted = text(input.posted);
  const page = Number.parseInt(text(input.page, 6), 10);
  return {
    q: text(input[queryKey]),
    location: text(input.location),
    skills: text(input.skills),
    company: text(input.company),
    source: text(input.source, 40).toLowerCase(),
    remote: (REMOTE_VALUES as readonly string[]).includes(remote) ? (remote as JobFilters["remote"]) : "",
    posted: (POSTED_VALUES as readonly string[]).includes(posted) ? (posted as JobFilters["posted"]) : "",
    page: Number.isFinite(page) && page > 0 ? Math.min(page, 5000) : 1
  };
}

export function toParams(filters: JobFilters, queryKey: "q" | "role" = "q"): Record<string, string> {
  const entries: [string, string][] = [
    [queryKey, filters.q],
    ["location", filters.location],
    ["skills", filters.skills],
    ["company", filters.company],
    ["source", filters.source],
    ["remote", filters.remote],
    ["posted", filters.posted]
  ];
  return Object.fromEntries(entries.filter(([, value]) => value));
}

export function pageHref(path: string, params: Record<string, string>, page: number) {
  const query = new URLSearchParams(params);
  if (page > 1) query.set("page", String(page));
  const search = query.toString();
  return search ? `${path}?${search}` : path;
}

export function activeFilterCount(filters: JobFilters) {
  return Object.keys(toParams(filters)).length;
}
