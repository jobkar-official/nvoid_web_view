import type { JobPosting, JobSalary } from "../api/agent.api";

const SOURCE_LABELS: Record<string, string> = {
  greenhouse: "Greenhouse",
  lever: "Lever",
  ashby: "Ashby",
  smartrecruiters: "SmartRecruiters",
  workday: "Workday",
  workable: "Workable",
  recruitee: "Recruitee",
  bamboohr: "BambooHR",
  breezy: "Breezy",
  "career-page": "Career page",
  remotive: "Remotive",
  remoteok: "Remote OK",
  weworkremotely: "We Work Remotely",
  workingnomads: "Working Nomads",
  himalayas: "Himalayas",
  jobicy: "Jobicy",
  themuse: "The Muse",
  arbeitnow: "Arbeitnow",
  arbeitsagentur: "Bundesagentur für Arbeit",
  mycareersfuture: "MyCareersFuture",
  hh: "HeadHunter",
  dou: "DOU",
  web: "Public web"
};

export function sourceLabel(id: string) {
  return SOURCE_LABELS[id] ?? id.charAt(0).toUpperCase() + id.slice(1);
}

const DIVISIONS: [Intl.RelativeTimeFormatUnit, number][] = [["year", 31_536_000], ["month", 2_592_000], ["week", 604_800], ["day", 86_400], ["hour", 3_600], ["minute", 60]];
const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

export function timeAgo(value: string) {
  const seconds = Math.round((Date.parse(value) - Date.now()) / 1000);
  if (!Number.isFinite(seconds)) return "";
  const [unit, size] = DIVISIONS.find(([, size]) => Math.abs(seconds) >= size) ?? ["minute", 60];
  return Math.abs(seconds) < 60 ? "just now" : relative.format(Math.round(seconds / size), unit);
}

export function postedLabel(job: JobPosting) {
  return job.postedAt ? `Posted ${timeAgo(job.postedAt)}` : `Added ${timeAgo(job.firstSeen)}`;
}

export function formatSalary(salary: JobSalary | null) {
  if (!salary) return "";
  const { min, max, currency } = salary;
  if (!min && !max) return salary.raw ?? "";
  const money = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1, ...(currency ? { style: "currency", currency } : {}) });
  try {
    return min && max && min !== max ? `${money.format(min)} – ${money.format(max)}` : money.format(max ?? min ?? 0);
  } catch {
    return salary.raw ?? "";
  }
}

export function usefulSummary(job: JobPosting) {
  const summary = job.summary.trim();
  return summary && !summary.startsWith(`${job.title} at `) && summary !== job.title ? summary : "";
}

export function countLabel(value: number) {
  return value.toLocaleString("en-US");
}
