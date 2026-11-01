"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Activity, ArrowRight, ArrowUpRight, Bell, BriefcaseBusiness, Check, CheckCircle2, ChevronRight, CircleHelp, ClipboardList, Code2, FileText, GraduationCap, Languages, LayoutDashboard, LoaderCircle, LogOut, MessageCircle, MessageSquare, PanelLeftClose, PanelLeftOpen, Pencil, Plus, RefreshCw, Search, Send, ShieldCheck, Sparkles, Target, Trash2, UserRound, X } from "lucide-react";
import { qualificationApi } from "../lib/api/education.api";
import { experienceApi } from "../lib/api/experience.api";
import { languageApi } from "../lib/api/language.api";
import { generalApi as favouriteApi } from "../lib/api/favourite.api";
import { openToWorkApi } from "../lib/api/highlights.api";
import { messageApi } from "../lib/api/message.api";
import { notificationApi } from "../lib/api/notification.api";
import { usersApi } from "../lib/api/profile.api";
import { resumeApi } from "../lib/api/resume.api";
import { skillsApi } from "../lib/api/skill.api";
import { supportApi } from "../lib/api/support.api";

type Session = { roleId: 3 | 4 | 7; user: { id?: string; name?: string; fullName?: string; email?: string; slug?: string; phone?: string } };
type RecordData = Record<string, any>;
type Page = { title: string; description: string; icon: typeof Search };
const nav = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, group: "Workspace" },
  { id: "connections", label: "API connections", icon: Code2, group: "Workspace" },
  { id: "find-jobs", label: "Find jobs", icon: Search, group: "Discover" },
  { id: "recommendations", label: "Recommended jobs", icon: Sparkles, group: "Discover" },
  { id: "saved", label: "Saved jobs", icon: BriefcaseBusiness, group: "Discover" },
  { id: "applications", label: "Applications", icon: ClipboardList, group: "Discover" },
  { id: "profile", label: "Profile", icon: UserRound, group: "Profile" },
  { id: "highlights", label: "Open to work", icon: Target, group: "Activity" },
  { id: "messages", label: "Messages", icon: MessageSquare, group: "Activity" },
  { id: "notifications", label: "Notifications", icon: Bell, group: "Activity" },
  { id: "support", label: "Support", icon: CircleHelp, group: "Help" }
];
const pages: Record<string, Page> = {
  overview: { title: "Overview", description: "Your account, activity and connected services in one place.", icon: LayoutDashboard },
  connections: { title: "API connections", description: "Live checks against the Jobkar services connected to this account.", icon: Code2 },
  "find-jobs": { title: "Find jobs", description: "Search live job sources connected to your Nvoid agent.", icon: Search },
  recommendations: { title: "Recommended jobs", description: "Opportunities returned by your authenticated Jobkar profile.", icon: Sparkles },
  saved: { title: "Saved jobs", description: "Jobs you have saved to your account.", icon: BriefcaseBusiness },
  applications: { title: "Applications", description: "Review verifiable application activity from connected services.", icon: ClipboardList },
  profile: { title: "Profile", description: "Manage your professional identity and contact details.", icon: UserRound },
  skills: { title: "Skills", description: "Maintain the skills used to represent and match your profile.", icon: Target },
  education: { title: "Education", description: "Manage your qualifications and academic history.", icon: GraduationCap },
  experience: { title: "Experience", description: "Keep your work history up to date.", icon: Activity },
  resume: { title: "Resume", description: "Upload and manage the resume attached to your account.", icon: FileText },
  languages: { title: "Languages", description: "Manage the languages you use professionally.", icon: Languages },
  highlights: { title: "Open to work", description: "Manage your availability and matching preferences.", icon: Target },
  messages: { title: "Messages", description: "View conversations from the Jobkar chat service.", icon: MessageSquare },
  notifications: { title: "Notifications", description: "Review account alerts and mark them as read.", icon: Bell },
  support: { title: "Support", description: "Create support requests and track existing tickets.", icon: CircleHelp }
};
type ProfileTab = "profile" | "education" | "skills" | "experience" | "languages" | "resume";
const profileTabIds: ProfileTab[] = ["profile", "education", "skills", "experience", "languages", "resume"];
const profileTabNavigation = [
  { id: "profile" as ProfileTab, label: "Profile", icon: UserRound },
  { id: "education" as ProfileTab, label: "Education", icon: GraduationCap },
  { id: "skills" as ProfileTab, label: "Skills", icon: Target },
  { id: "experience" as ProfileTab, label: "Experience", icon: Activity },
  { id: "languages" as ProfileTab, label: "Languages", icon: Languages },
  { id: "resume" as ProfileTab, label: "Resume", icon: FileText }
];
function rows<T = RecordData>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (!value || typeof value !== "object") return [];
  const object = value as Record<string, unknown>;
  if (Array.isArray(object.data)) return object.data as T[];
  if (Array.isArray(object.result)) return object.result as T[];
  if (Array.isArray(object.content)) return object.content as T[];
  return [];
}
function errorText(error: unknown) { return error instanceof Error ? error.message : "The request could not be completed."; }
function dateText(value?: string | null) {
  if (!value) return "Date not provided";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}
function initials(value: string) { return value.trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase() || "").join("") || "N"; }

export default function PrivateWorkspace({ initialSession, initialSection }: { initialSession: Session; initialSection: string }) {
  const router = useRouter();
  const id = initialSession.user.id || "";
  const userId = Number(id);
  const role = initialSession.roleId === 3 ? "Recruiter" : initialSession.roleId === 7 ? "Support" : "Job seeker";
  const name = initialSession.user.fullName || initialSession.user.name || role;
  const requestedProfileTab = profileTabIds.includes(initialSection as ProfileTab) ? initialSection as ProfileTab : "profile";
  const section = profileTabIds.includes(initialSection as ProfileTab) ? "profile" : pages[initialSection] ? initialSection : "overview";
  const [profileTab, setProfileTab] = useState<ProfileTab>(requestedProfileTab);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [stats, setStats] = useState({ jobs: 0, saved: 0, unread: 0, skills: 0, education: 0, experience: 0, resumes: 0 });
  const [profile, setProfile] = useState({ name, email: initialSession.user.email || "", phone: initialSession.user.phone || "", bio: "", city: "", state: "", country: "India" });
  const [skills, setSkills] = useState<RecordData[]>([]);
  const [education, setEducation] = useState<RecordData[]>([]);
  const [experience, setExperience] = useState<RecordData[]>([]);
  const [resumes, setResumes] = useState<RecordData[]>([]);
  const [languages, setLanguages] = useState<RecordData[]>([]);
  const [saved, setSaved] = useState<RecordData[]>([]);
  const [recommended, setRecommended] = useState<RecordData[]>([]);
  const [alerts, setAlerts] = useState<RecordData[]>([]);
  const [tickets, setTickets] = useState<RecordData[]>([]);
  const [threads, setThreads] = useState<RecordData[]>([]);
  const [chat, setChat] = useState<RecordData[]>([]);
  const [activeThread, setActiveThread] = useState<RecordData | null>(null);
  const [openStatus, setOpenStatus] = useState<RecordData | null>(null);
  const [checks, setChecks] = useState<Array<{ name: string; ok: boolean; detail: string }>>([]);
  const [jobs, setJobs] = useState<RecordData[]>([]);
  const [jobTitle, setJobTitle] = useState("");
  const [jobLocation, setJobLocation] = useState("India");
  const [skillName, setSkillName] = useState("");
  const [skillLevel, setSkillLevel] = useState("Intermediate");
  const [skillYears, setSkillYears] = useState("1");
  const [skillMonths, setSkillMonths] = useState("0");
  const [editingSkillId, setEditingSkillId] = useState<number | string | null>(null);
  const [qualification, setQualification] = useState({ qualification: "", boardOrUniversity: "", startYear: "", completeYear: "", from: "", grade: "" });
  const [editingEducationId, setEditingEducationId] = useState<number | string | null>(null);
  const [work, setWork] = useState({ companyName: "", designation: "", companyLocation: "", startDate: "", endDate: "", current: false });
  const [editingExperienceId, setEditingExperienceId] = useState<number | string | null>(null);
  const [languageName, setLanguageName] = useState("");
  const [languageProficiency, setLanguageProficiency] = useState("Professional");
  const [editingLanguageId, setEditingLanguageId] = useState<number | string | null>(null);
  const [availability, setAvailability] = useState({ jobTitle: "", jobType: "Full-time", noticePeriod: "Immediate", experienceYears: "0", experienceMonths: "0", expectedSalaryMin: "0", expectedSalaryMax: "0", highestEducation: "Graduate" });
  const [support, setSupport] = useState({ subject: "", description: "" });
  const [file, setFile] = useState<File | null>(null);

  const visibleNav = useMemo(() => initialSession.roleId === 7 ? nav.filter(item => ["overview", "connections", "applications", "messages", "notifications", "support"].includes(item.id)) : nav, [initialSession.roleId]);

  const loadPage = useCallback(async () => {
    if (section === "find-jobs" || section === "applications") return;
    if (!id || !Number.isFinite(userId)) {
      setError("The sign-in response did not include a valid account ID. Account-specific API calls need that ID.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      if (section === "overview") {
        const results = await Promise.allSettled([
          openToWorkApi.getRecommendedJobByUserId(id),
          favouriteApi.getFavouriteJobsByUserId(id),
          notificationApi.getNotificationsByUserId(id),
          skillsApi.getSkillsByUserId(id),
          qualificationApi.getQualificationsByUserId(id),
          experienceApi.getExperienceList(id),
          resumeApi.getResumesByUserId(id),
          openToWorkApi.getByUserId(id)
        ]);
        const value = (index: number) => results[index].status === "fulfilled" ? (results[index] as PromiseFulfilledResult<any>).value : null;
        const recs = rows(value(0));
        const savedRows = rows(value(1));
        const notes = rows(value(2));
        setRecommended(recs);
        setSaved(savedRows);
        setAlerts(notes);
        setOpenStatus(value(7));
        setStats({ jobs: recs.length, saved: savedRows.length, unread: notes.filter((item: any) => !item.isRead).length, skills: rows(value(3)).length, education: rows(value(4)).length, experience: rows(value(5)).length, resumes: rows(value(6)).length });
        return;
      }
      if (section === "connections") {
        const tests: Array<[string, () => Promise<unknown>]> = [
          ["Recommended jobs", () => openToWorkApi.getRecommendedJobByUserId(id)],
          ["Saved jobs", () => favouriteApi.getFavouriteJobsByUserId(id)],
          ["Skills", () => skillsApi.getSkillsByUserId(id)],
          ["Education", () => qualificationApi.getQualificationsByUserId(id)],
          ["Experience", () => experienceApi.getExperienceList(id)],
          ["Resumes", () => resumeApi.getResumesByUserId(id)],
          ["Notifications", () => notificationApi.getNotificationsByUserId(id)],
          ["Messages", () => messageApi.getThreadsByUserId(id)],
          ["Support", () => supportApi.getTicketsByUserId(id)]
        ];
        const result = await Promise.allSettled(tests.map(([, test]) => test()));
        setChecks(result.map((item, index) => ({ name: tests[index][0], ok: item.status === "fulfilled", detail: item.status === "fulfilled" ? rows(item.value).length + " live records returned" : errorText(item.reason) })));
        return;
      }
      if (section === "profile") {
        if (profileTab === "profile") {
          if (initialSession.user.slug) {
            const item = await usersApi.getUserDetailBySlug(initialSession.user.slug);
            setProfile({ name: item.name || name, email: item.email || initialSession.user.email || "", phone: item.phone || initialSession.user.phone || "", bio: item.bio || item.description || "", city: item.city || "", state: item.state || "", country: item.country || "India" });
          } else {
            setProfile(current => ({ ...current, name, email: initialSession.user.email || current.email, phone: initialSession.user.phone || current.phone }));
          }
        }
        if (profileTab === "skills") setSkills(await skillsApi.getSkillsByUserId(id));
        if (profileTab === "education") setEducation(await qualificationApi.getQualificationsByUserId(id));
        if (profileTab === "experience") setExperience(await experienceApi.getExperienceList(id));
        if (profileTab === "languages") setLanguages(rows(await languageApi.getLanguagesByUserId(id)));
        if (profileTab === "resume") setResumes(await resumeApi.getResumesByUserId(id));
        return;
      }
      if (section === "saved") setSaved(await favouriteApi.getFavouriteJobsByUserId(id));
      if (section === "recommendations") setRecommended(await openToWorkApi.getRecommendedJobByUserId(id));
      if (section === "notifications") setAlerts(await notificationApi.getNotificationsByUserId(id));
      if (section === "messages") setThreads(await messageApi.getThreadsByUserId(id));
      if (section === "highlights") setOpenStatus(await openToWorkApi.getByUserId(id));
      if (section === "support") setTickets(await supportApi.getTicketsByUserId(id));
    } catch (cause) {
      setError(errorText(cause));
    } finally {
      setLoading(false);
    }
  }, [section, profileTab, id, userId, initialSession.user.slug, initialSession.user.email, initialSession.user.phone, name]);

  useEffect(() => { void loadPage(); }, [loadPage]);

  const go = (target: string) => {
    setNotice("");
    setError("");
    setExpanded(false);
    if (profileTabIds.includes(target as ProfileTab)) {
      setProfileTab(target as ProfileTab);
      router.push("/workspace/profile");
      return;
    }
    router.push(target === "overview" ? "/workspace" : "/workspace/" + target);
  };

  const perform = async (action: () => Promise<unknown>, success: string) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
      setNotice(success);
      await loadPage();
    } catch (cause) {
      setError(errorText(cause));
    } finally {
      setBusy(false);
    }
  };

  const saveProfile = (event: FormEvent) => {
    event.preventDefault();
    if (!userId) return setError("A valid account ID is required to save this profile.");
    void perform(() => usersApi.updateProfile(id, { id: userId, name: profile.name, phone: profile.phone, email: profile.email, bio: profile.bio, description: profile.bio, city: profile.city, state: profile.state, country: profile.country }), "Profile update sent to Jobkar.");
  };
  const addSkill = (event: FormEvent) => {
    event.preventDefault();
    const payload = { userId, skillName: skillName.trim(), proficiencyLevel: skillLevel, year: Number(skillYears), month: Number(skillMonths) };
    void perform(async () => {
      if (editingSkillId !== null) await skillsApi.updateSkill(editingSkillId, payload);
      else await skillsApi.saveSkill(payload);
      setEditingSkillId(null);
      setSkillName("");
      setSkillLevel("Intermediate");
      setSkillYears("1");
      setSkillMonths("0");
    }, editingSkillId !== null ? "Skill updated." : "Skill saved to your profile.");
  };
  const addEducation = (event: FormEvent) => {
    event.preventDefault();
    const payload = { userId, qualification: qualification.qualification, boardOrUniversity: qualification.boardOrUniversity, startYear: Number(qualification.startYear), completeYear: Number(qualification.completeYear), from: qualification.from, grade: qualification.grade };
    void perform(async () => {
      if (editingEducationId !== null) await qualificationApi.updateQualification(Number(editingEducationId), { id: Number(editingEducationId), ...payload });
      else await qualificationApi.saveQualification(payload);
      setEditingEducationId(null);
      setQualification({ qualification: "", boardOrUniversity: "", startYear: "", completeYear: "", from: "", grade: "" });
    }, editingEducationId !== null ? "Education record updated." : "Education record submitted to Jobkar.");
  };
  const addExperience = (event: FormEvent) => {
    event.preventDefault();
    const payload = { userId, companyName: work.companyName, designation: work.designation, companyLocation: work.companyLocation, startDate: work.startDate, endDate: work.current ? null : work.endDate || null, isCurrent: work.current ? 1 : 0 };
    void perform(async () => {
      if (editingExperienceId !== null) await experienceApi.updateExperience(Number(editingExperienceId), { id: Number(editingExperienceId), ...payload });
      else await experienceApi.createExperience(payload);
      setEditingExperienceId(null);
      setWork({ companyName: "", designation: "", companyLocation: "", startDate: "", endDate: "", current: false });
    }, editingExperienceId !== null ? "Experience record updated." : "Experience record submitted to Jobkar.");
  };
  const addLanguage = (event: FormEvent) => {
    event.preventDefault();
    const existing = languages.find(item => String(item.id) === String(editingLanguageId));
    if (editingLanguageId !== null && !existing) return setError("The language record being edited is no longer available. Refresh the list and try again.");
    void perform(async () => {
      await languageApi.saveLanguage({ userId, language: languageName.trim(), proficiency: languageProficiency });
      if (editingLanguageId !== null && existing) {
        try {
          await languageApi.deleteLanguage(existing.id, { userId, language: existing.language });
        } catch {
          setEditingLanguageId(null);
          const refreshedLanguages = await languageApi.getLanguagesByUserId(id).catch(() => []);
          setLanguages(rows(refreshedLanguages));
          throw new Error("The new language entry was saved, but the previous entry could not be removed. Review your language list for a duplicate.");
        }
      }
      setEditingLanguageId(null);
      setLanguageName("");
      setLanguageProficiency("Professional");
    }, editingLanguageId !== null ? "Language updated." : "Language added to your profile.");
  };
  const uploadResume = (event: FormEvent) => {
    event.preventDefault();
    if (!file) return setError("Choose a resume file first.");
    const body = new FormData();
    body.append("userId", id);
    body.append("file", file);
    void perform(() => resumeApi.uploadResume(body), "Resume upload submitted.");
  };
  const saveAvailability = (event: FormEvent) => {
    event.preventDefault();
    void perform(() => openToWorkApi.saveStatus({ userId, name, email: initialSession.user.email, phoneNumber: initialSession.user.phone, noticePeriod: availability.noticePeriod, experienceYears: Number(availability.experienceYears), experienceMonths: Number(availability.experienceMonths), expectedSalaryMin: Number(availability.expectedSalaryMin), expectedSalaryMax: Number(availability.expectedSalaryMax), highestEducation: availability.highestEducation, jobTitle: availability.jobTitle, jobType: availability.jobType }), "Availability preferences submitted.");
  };
  const createTicket = (event: FormEvent) => {
    event.preventDefault();
    void perform(() => supportApi.createTicket({ userId, subject: support.subject, description: support.description }), "Support request submitted.");
  };
  const searchJobs = async (event: FormEvent) => {
    event.preventDefault();
    if (!jobTitle.trim() || !jobLocation.trim()) return setError("Enter a job title and location.");
    setBusy(true);
    setError("");
    setJobs([]);
    try {
      const response = await fetch("/api/agent/search", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ profile: { userId: id, fullName: name, firstName: name.split(" ")[0], lastName: name.split(" ").slice(1).join(" "), email: initialSession.user.email || "", phone: initialSession.user.phone || "", jobTitle: jobTitle.trim(), location: jobLocation.trim(), countries: [jobLocation.trim()], skills: [], keywords: [jobTitle.trim()], experienceYears: 0, salaryMin: 0, salaryCurrency: "INR", employmentTypes: ["full-time"], remote: false, summary: "", linkedinUrl: "", portfolioUrl: "", resumePath: "" }, limit: 60, syncToBackend: false }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Job search failed.");
      setJobs(rows(data.jobs));
      setNotice(rows(data.jobs).length + " live results returned by connected sources.");
    } catch (cause) {
      setError(errorText(cause));
    } finally {
      setBusy(false);
    }
  };
  const openChat = async (thread: RecordData) => {
    setActiveThread(thread);
    setChat([]);
    const partner = (thread.participants || []).find((person: any) => String(person.id) !== id) || thread.participants?.[0];
    if (!partner?.id) return;
    try {
      setChat(rows(await messageApi.getChatHistory(userId, Number(partner.id))));
    } catch (cause) {
      setError(errorText(cause));
    }
  };

  const page = pages[section];
  const Icon = page.icon;
  const groups = ["Workspace", "Discover", "Profile", "Activity", "Help"];

  return <div className={"nv-workspace" + (expanded ? " nv-expanded" : "")}>
    {expanded && <button className="nv-scrim" aria-label="Close navigation" onClick={() => setExpanded(false)} />}
    <aside className="nv-sidebar">
      <div className="nv-brand-row"><span className="nv-brand-mark"><Sparkles size={19} /></span>{expanded && <span className="nv-brand-name"><strong>NVOID</strong><small>Intelligent workspace</small></span>}<button className="nv-collapse" onClick={() => setExpanded(value => !value)} aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}>{expanded ? <PanelLeftClose size={17} /> : <PanelLeftOpen size={17} />}</button></div>
      <div className="nv-workspace-label">{expanded ? "YOUR WORKSPACE" : "WORKSPACE"}</div>
      <nav className="nv-nav">{groups.map(group => {
        const items = visibleNav.filter(item => item.group === group);
        if (!items.length) return null;
        return <div className="nv-nav-group" key={group}>{expanded && <span className="nv-nav-heading">{group}</span>}{items.map(item => {
          const ItemIcon = item.icon;
          return <button key={item.id} className={"nv-nav-link" + (section === item.id ? " active" : "")} onClick={() => go(item.id)} title={expanded ? undefined : item.label}><ItemIcon size={18} /><span>{item.label}</span>{item.id === "notifications" && stats.unread > 0 && <i>{stats.unread}</i>}</button>;
        })}</div>;
      })}</nav>
      <div className="nv-sidebar-bottom"><div className="nv-user-card"><span className="nv-avatar">{initials(name)}</span>{expanded && <span className="nv-user-info"><strong>{name}</strong><small>{role}</small></span>}</div><button className="nv-nav-link nv-logout" onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined); router.replace("/"); router.refresh(); }} title={expanded ? undefined : "Sign out"}><LogOut size={17} /><span>Sign out</span></button></div>
    </aside>
    <main className="nv-main">
      <header className="nv-topbar"><div className="nv-breadcrumb"><span>Workspace</span><ChevronRight size={14} /><strong>{page.title}</strong></div><div className="nv-topbar-actions"><span className="nv-live-pill"><i /> Jobkar API</span><button className="nv-icon-button" onClick={() => void loadPage()} aria-label="Refresh data"><RefreshCw size={17} className={loading ? "nv-spin" : ""} /></button><span className="nv-top-avatar">{initials(name)}</span></div></header>
      <div className="nv-content">
        <div className="nv-page-heading"><div><div className="nv-eyebrow"><Icon size={14} /> {role} workspace <span>·</span> PRIVATE</div><h1>{page.title}</h1><p>{page.description}</p></div><span className="nv-secure-label"><ShieldCheck size={14} /> Secure session</span></div>
        {error && <div className="nv-alert nv-alert-error" role="alert"><X size={16} /><span>{error}</span><button onClick={() => setError("")} aria-label="Dismiss"><X size={14} /></button></div>}
        {notice && <div className="nv-alert nv-alert-success" role="status"><CheckCircle2 size={16} /><span>{notice}</span><button onClick={() => setNotice("")} aria-label="Dismiss"><X size={14} /></button></div>}
        {loading && <div className="nv-loading-line"><span /> Syncing account data from Jobkar services</div>}

        {section === "profile" && <nav className="nv-profile-tabs" aria-label="Profile sections">
          {profileTabNavigation.map(item => {
            const TabIcon = item.icon;
            return <button type="button" key={item.id} className={"nv-profile-tab" + (profileTab === item.id ? " active" : "")} aria-current={profileTab === item.id ? "page" : undefined} onClick={() => go(item.id)}><TabIcon size={15} /><span>{item.label}</span></button>;
          })}
        </nav>}

        {section === "overview" && <div className="nv-overview">
          <section className="nv-welcome"><div className="nv-welcome-copy"><span className="nv-welcome-kicker">YOUR PROFESSIONAL WORKSPACE</span><h2>Welcome back, {name.split(" ")[0]}.</h2><p>Your profile, activity and connected Jobkar services are ready in one workspace.</p><div className="nv-welcome-actions"><button className="nv-primary" onClick={() => go("find-jobs")}><Search size={16} /> Discover jobs <ArrowRight size={15} /></button><button className="nv-secondary" onClick={() => go("connections")}><Code2 size={16} /> View API status</button></div></div><div className="nv-welcome-visual"><div className="nv-ring nv-ring-one" /><div className="nv-ring nv-ring-two" /><span><Sparkles size={30} /></span></div></section>
          <div className="nv-stat-grid">{[["Recommended jobs", stats.jobs, Sparkles, "recommendations"], ["Saved jobs", stats.saved, BriefcaseBusiness, "saved"], ["Unread alerts", stats.unread, Bell, "notifications"], ["Profile skills", stats.skills, Target, "skills"]].map(([label, value, Symbol, target]) => { const StatIcon = Symbol as typeof Search; return <button key={String(label)} className="nv-stat-card" onClick={() => go(String(target))}><span className="nv-stat-icon"><StatIcon size={18} /></span><span className="nv-stat-label">{String(label)}</span><strong>{Number(value)}</strong><small>Live account data</small></button>; })}</div>
          <div className="nv-overview-grid"><section className="nv-panel"><div className="nv-panel-heading"><div><h2>Professional profile</h2><p>Account identity and profile records.</p></div><UserRound size={18} /></div><div className="nv-profile-summary"><span className="nv-profile-avatar">{initials(name)}</span><div><strong>{name}</strong><small>{initialSession.user.email || "Email not provided"}</small><small>{role} account · ID {id || "Unavailable"}</small></div></div><div className="nv-summary-chips"><span>{stats.education} education records</span><span>{stats.experience} experiences</span><span>{stats.resumes} resumes</span></div><button className="nv-text-action" onClick={() => go("profile")}>Manage profile <ArrowUpRight size={14} /></button></section><section className="nv-panel"><div className="nv-panel-heading"><div><h2>Connection health</h2><p>Authenticated requests through your private session.</p></div><Activity size={18} /></div><div className="nv-connection-summary"><span className="nv-connection-dot" /><div><strong>Jobkar Edge Gateway</strong><small>Same-origin proxy · HttpOnly session cookie</small></div><span className="nv-status-good">Secure</span></div><div className="nv-connection-summary"><span className="nv-connection-dot nv-connection-chat" /><div><strong>Jobkar Chat</strong><small>Private chat API proxy</small></div><span className="nv-status-neutral">On demand</span></div><button className="nv-text-action" onClick={() => go("connections")}>Run live checks <ArrowUpRight size={14} /></button></section></div>
          <div className="nv-footer-note"><ShieldCheck size={15} /> Your access token stays in an HttpOnly cookie. Browser JavaScript does not read or store the token.</div>
        </div>}

        {section === "connections" && <section className="nv-panel nv-panel-spaced"><div className="nv-panel-heading"><div><h2>Connected API services</h2><p>Each row runs a real request using a method in the API modules.</p></div><button className="nv-secondary nv-small" onClick={() => void loadPage()}><RefreshCw size={14} /> Run checks</button></div><div className="nv-connection-list">{checks.map(item => <div className="nv-connection-row" key={item.name}><span className={"nv-connection-mark " + (item.ok ? "good" : "attention")}>{item.ok ? <Check size={15} /> : <X size={15} />}</span><div><strong>{item.name}</strong><small>{item.detail}</small></div><span className={item.ok ? "nv-status-good" : "nv-status-warning"}>{item.ok ? "Responding" : "Needs attention"}</span></div>)}</div>{!checks.length && !loading && <EmptyState title="Run your first connection check" text="This tests recommendations, saved jobs, skills, education, experience, resumes, notifications, messages and support." />}<div className="nv-info-strip"><ShieldCheck size={16} /><span>An empty list is a successful API response. Failed requests are shown separately.</span></div></section>}

        {section === "profile" && profileTab === "profile" && <section className="nv-panel nv-panel-spaced"><div className="nv-panel-heading"><div><h2>Professional identity</h2><p>Updates are sent through the authenticated profile endpoint.</p></div><UserRound size={18} /></div><form className="nv-form-grid" onSubmit={saveProfile}><label>Full name<input required value={profile.name} onChange={event => setProfile({ ...profile, name: event.target.value })} /></label><label>Email address<input type="email" value={profile.email} onChange={event => setProfile({ ...profile, email: event.target.value })} /></label><label>Phone number<input value={profile.phone} onChange={event => setProfile({ ...profile, phone: event.target.value })} /></label><label>Country<input value={profile.country} onChange={event => setProfile({ ...profile, country: event.target.value })} /></label><label>State<input value={profile.state} onChange={event => setProfile({ ...profile, state: event.target.value })} /></label><label>City<input value={profile.city} onChange={event => setProfile({ ...profile, city: event.target.value })} /></label><label className="nv-full">Professional summary<textarea rows={5} value={profile.bio} onChange={event => setProfile({ ...profile, bio: event.target.value })} /></label><div className="nv-form-footer nv-full"><span>Account ID: {id || "Not returned by authentication"}</span><button className="nv-primary" disabled={busy}><Check size={15} /> Save profile</button></div></form></section>}

        {section === "profile" && profileTab === "skills" && <div className="nv-content-stack"><section className="nv-panel nv-panel-spaced"><div className="nv-panel-heading"><div><h2>Add a skill</h2><p>Save a skill to your Jobkar professional profile.</p></div><Plus size={18} /></div><form className="nv-form-grid nv-skill-form" onSubmit={addSkill}><label>Skill name<input required value={skillName} onChange={event => setSkillName(event.target.value)} placeholder="Java, React, Product Design" /></label><label>Proficiency<select value={skillLevel} onChange={event => setSkillLevel(event.target.value)}><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label><label>Years<input type="number" min="0" max="60" value={skillYears} onChange={event => setSkillYears(event.target.value)} /></label><label>Months<input type="number" min="0" max="11" value={skillMonths} onChange={event => setSkillMonths(event.target.value)} /></label><div className="nv-form-footer nv-full"><span>/backend/skills/save · /backend/skills/update/:id</span><div className="nv-form-actions"><button type="button" className="nv-secondary" hidden={editingSkillId === null} onClick={() => { setEditingSkillId(null); setSkillName(""); setSkillLevel("Intermediate"); setSkillYears("1"); setSkillMonths("0"); }}>Cancel</button><button className="nv-primary" disabled={busy}><Plus size={15} /> {editingSkillId !== null ? "Save changes" : "Add skill"}</button></div></div></form></section><section className="nv-panel nv-panel-spaced"><div className="nv-panel-heading"><div><h2>Your skills</h2><p>{skills.length} records returned by your account.</p></div><Target size={18} /></div><div className="nv-record-grid">{skills.map(item => <Record key={item.id} title={item.skillName || "Skill"} meta={[item.proficiencyLevel, item.year ? item.year + "y " + (item.month || 0) + "m" : ""].filter(Boolean).join(" · ")} onEdit={() => { setEditingSkillId(item.id); setSkillName(item.skillName || ""); setSkillLevel(item.proficiencyLevel || "Intermediate"); setSkillYears(String(item.year ?? 0)); setSkillMonths(String(item.month ?? 0)); }} onDelete={() => void perform(() => skillsApi.deleteSkill(item.id), "Skill removed.")} />)}</div>{!skills.length && !loading && <EmptyState title="No skills added yet" text="Add your strongest skills to complete your profile." />}</section></div>}

        {section === "profile" && profileTab === "education" && <div className="nv-content-stack"><section className="nv-panel nv-panel-spaced"><div className="nv-panel-heading"><div><h2>Add qualification</h2><p>Create an education record on your account.</p></div><GraduationCap size={18} /></div><form className="nv-form-grid" onSubmit={addEducation}><label>Qualification<input required value={qualification.qualification} onChange={event => setQualification({ ...qualification, qualification: event.target.value })} /></label><label>University / board<input required value={qualification.boardOrUniversity} onChange={event => setQualification({ ...qualification, boardOrUniversity: event.target.value })} /></label><label>Start year<input required type="number" value={qualification.startYear} onChange={event => setQualification({ ...qualification, startYear: event.target.value })} /></label><label>Completion year<input required type="number" value={qualification.completeYear} onChange={event => setQualification({ ...qualification, completeYear: event.target.value })} /></label><label>Study mode<input value={qualification.from} onChange={event => setQualification({ ...qualification, from: event.target.value })} /></label><label>Grade / score<input value={qualification.grade} onChange={event => setQualification({ ...qualification, grade: event.target.value })} /></label><div className="nv-form-footer nv-full"><span>/backend/qualifications/save · /backend/qualifications/update/:id</span><div className="nv-form-actions"><button type="button" className="nv-secondary" hidden={editingEducationId === null} onClick={() => { setEditingEducationId(null); setQualification({ qualification: "", boardOrUniversity: "", startYear: "", completeYear: "", from: "", grade: "" }); }}>Cancel</button><button className="nv-primary" disabled={busy}><Plus size={15} /> {editingEducationId !== null ? "Save changes" : "Save education"}</button></div></div></form></section><section className="nv-panel nv-panel-spaced"><div className="nv-panel-heading"><div><h2>Education history</h2><p>{education.length} records from Jobkar.</p></div><GraduationCap size={18} /></div><div className="nv-record-list">{education.map(item => <Record key={item.id} title={item.qualification || "Qualification"} meta={[item.boardOrUniversity, item.startYear && item.completeYear ? item.startYear + "–" + item.completeYear : "", item.grade].filter(Boolean).join(" · ")} onEdit={() => { setEditingEducationId(item.id); setQualification({ qualification: item.qualification || "", boardOrUniversity: item.boardOrUniversity || "", startYear: String(item.startYear ?? ""), completeYear: String(item.completeYear ?? ""), from: item.from || "", grade: item.grade || "" }); }} onDelete={() => void perform(() => qualificationApi.deleteQualification(item.id), "Education record deleted.")} />)}</div>{!education.length && !loading && <EmptyState title="No education records" text="Add your qualifications to complete your professional profile." />}</section></div>}

        {section === "profile" && profileTab === "experience" && <div className="nv-content-stack"><section className="nv-panel nv-panel-spaced"><div className="nv-panel-heading"><div><h2>Add experience</h2><p>Save a current or previous role to your professional history.</p></div><Activity size={18} /></div><form className="nv-form-grid" onSubmit={addExperience}><label>Company<input required value={work.companyName} onChange={event => setWork({ ...work, companyName: event.target.value })} /></label><label>Designation<input required value={work.designation} onChange={event => setWork({ ...work, designation: event.target.value })} /></label><label>Location<input value={work.companyLocation} onChange={event => setWork({ ...work, companyLocation: event.target.value })} /></label><label>Start date<input required type="date" value={work.startDate} onChange={event => setWork({ ...work, startDate: event.target.value })} /></label><label>End date<input type="date" disabled={work.current} value={work.endDate} onChange={event => setWork({ ...work, endDate: event.target.value })} /></label><label className="nv-check-label"><input type="checkbox" checked={work.current} onChange={event => setWork({ ...work, current: event.target.checked })} /> I currently work here</label><div className="nv-form-footer nv-full"><span>/backend/experience/create · /backend/experience/update/:id</span><div className="nv-form-actions"><button type="button" className="nv-secondary" hidden={editingExperienceId === null} onClick={() => { setEditingExperienceId(null); setWork({ companyName: "", designation: "", companyLocation: "", startDate: "", endDate: "", current: false }); }}>Cancel</button><button className="nv-primary" disabled={busy}><Plus size={15} /> {editingExperienceId !== null ? "Save changes" : "Add experience"}</button></div></div></form></section><section className="nv-panel nv-panel-spaced"><div className="nv-panel-heading"><div><h2>Work history</h2><p>{experience.length} records from Jobkar.</p></div><Activity size={18} /></div><div className="nv-record-list">{experience.map(item => <Record key={item.id} title={item.designation || "Role"} meta={[item.companyName, item.companyLocation, dateText(item.startDate) + " – " + (item.isCurrent ? "Present" : dateText(item.endDate))].filter(Boolean).join(" · ")} onEdit={() => { setEditingExperienceId(item.id); setWork({ companyName: item.companyName || "", designation: item.designation || "", companyLocation: item.companyLocation || "", startDate: item.startDate || "", endDate: item.endDate || "", current: Boolean(item.isCurrent) }); }} onDelete={() => void perform(() => experienceApi.deleteExperience(item.id), "Experience record deleted.")} />)}</div>{!experience.length && !loading && <EmptyState title="No experience added" text="Add your work history to complete your profile." />}</section></div>}

        {section === "profile" && profileTab === "languages" && <div className="nv-content-stack"><section className="nv-panel nv-panel-spaced"><div className="nv-panel-heading"><div><h2>Add a language</h2><p>Record the languages you can use at work.</p></div><Languages size={18} /></div><form className="nv-form-grid" onSubmit={addLanguage}><label>Language<input required value={languageName} onChange={event => setLanguageName(event.target.value)} placeholder="e.g. English, Hindi, Gujarati" /></label><label>Proficiency<select value={languageProficiency} onChange={event => setLanguageProficiency(event.target.value)}><option>Native</option><option>Fluent</option><option>Professional</option><option>Conversational</option><option>Basic</option></select></label><div className="nv-form-footer nv-full"><span>/backend/language/save · /backend/language/delete/:id</span><div className="nv-form-actions"><button type="button" className="nv-secondary" hidden={editingLanguageId === null} onClick={() => { setEditingLanguageId(null); setLanguageName(""); setLanguageProficiency("Professional"); }}>Cancel</button><button className="nv-primary" disabled={busy || !languageName.trim()}><Plus size={15} /> {editingLanguageId !== null ? "Save changes" : "Add language"}</button></div></div></form></section><section className="nv-panel nv-panel-spaced"><div className="nv-panel-heading"><div><h2>Your languages</h2><p>{languages.length} language records from Jobkar.</p></div><Languages size={18} /></div><div className="nv-record-grid">{languages.map(item => <Record key={item.id} title={item.language || "Language"} meta={item.proficiency || "Proficiency not provided"} onEdit={() => { setEditingLanguageId(item.id); setLanguageName(item.language || ""); setLanguageProficiency(item.proficiency || "Professional"); }} onDelete={() => void perform(() => languageApi.deleteLanguage(item.id, { userId, language: item.language }), "Language removed from your profile.")} />)}</div>{!languages.length && !loading && <EmptyState title="No languages added" text="Add the languages you use to communicate professionally." />}</section><div className="nv-info-strip"><ShieldCheck size={16} /><span>The API has no dedicated language update endpoint. Editing saves the replacement first, then removes the previous record.</span></div></div>}

        {section === "profile" && profileTab === "resume" && <div className="nv-content-stack"><section className="nv-panel nv-panel-spaced"><div className="nv-panel-heading"><div><h2>Upload a resume</h2><p>Send a file to the Jobkar resume upload endpoint.</p></div><FileText size={18} /></div><form className="nv-upload-form" onSubmit={uploadResume}><label className="nv-file-drop"><FileText size={24} /><strong>{file?.name || "Choose your resume"}</strong><small>PDF or DOC/DOCX · Select a file from this device</small><input type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={event => setFile(event.target.files?.[0] || null)} /></label><div className="nv-form-footer"><span>Sent privately through the authenticated API proxy.</span><button className="nv-primary" disabled={busy || !file}><Plus size={15} /> Upload resume</button></div></form></section><section className="nv-panel nv-panel-spaced"><div className="nv-panel-heading"><div><h2>Your resumes</h2><p>{resumes.length} records returned by the resume API.</p></div><FileText size={18} /></div><div className="nv-record-list">{resumes.map(item => <div className="nv-record" key={item.id}><span className="nv-record-icon"><FileText size={17} /></span><div><strong>{item.fileName || item.name || (item.resume || "").split("/").pop() || "Resume " + item.id}</strong><small>{dateText(item.createdAt)}</small></div>{item.resume && <a className="nv-icon-action" href={String(item.resume)} target="_blank" rel="noreferrer" aria-label="Open resume"><ArrowUpRight size={16} /></a>}<button className="nv-icon-action danger" onClick={() => void perform(() => resumeApi.deleteResume(item.id), "Resume deleted.")} aria-label="Delete resume"><Trash2 size={16} /></button></div>)}</div>{!resumes.length && !loading && <EmptyState title="No resume on file" text="Upload a current resume so it is attached to your account." />}</section></div>}

        {section === "recommendations" && <section className="nv-panel nv-panel-spaced"><div className="nv-panel-heading"><div><h2>Recommended for your profile</h2><p>{recommended.length} opportunities returned by the live recommendation API.</p></div><Sparkles size={18} /></div><div className="nv-job-grid">{recommended.map(job => <JobCard key={job.jobId} job={job} onSave={() => { if (!job.jobId || !job.companyId) return setError("This recommendation is missing IDs needed by the saved-jobs API."); void perform(() => favouriteApi.saveFavourite({ userId, jobId: job.jobId, companyId: job.companyId }), "Job added to your saved list."); }} disabled={busy || job.isFavorite} />)}</div>{!recommended.length && !loading && <EmptyState title="No recommendations returned" text="Add skills and an open-to-work preference to help Jobkar match opportunities." action={() => go("highlights")} actionLabel="Set job preferences" />}</section>}

        {section === "saved" && <section className="nv-panel nv-panel-spaced"><div className="nv-panel-heading"><div><h2>Your saved jobs</h2><p>{saved.length} jobs currently saved on your Jobkar account.</p></div><BriefcaseBusiness size={18} /></div><div className="nv-job-grid">{saved.map(item => <article className="nv-job-card" key={item.id}><div className="nv-job-top"><span className="nv-job-company">{initials(item.companyName || "Company")}</span><span className="nv-status-neutral">Saved {dateText(item.createdAt)}</span></div><h3>{item.title}</h3><p>{item.companyName || "Company not listed"}</p><div className="nv-job-meta"><span>{[item.city, item.state].filter(Boolean).join(", ") || "Location not listed"}</span><span>{item.experience || "Experience not listed"}</span><span>{item.workMode || "Work mode not listed"}</span></div><div className="nv-job-bottom"><strong>{item.salaryRange || "Salary not disclosed"}</strong><button className="nv-secondary nv-small" onClick={() => void perform(() => favouriteApi.deleteFavouriteApplication(item.id), "Removed from saved jobs.")}><Trash2 size={14} /> Remove</button></div></article>)}</div>{!saved.length && !loading && <EmptyState title="No saved jobs yet" text="Save an opportunity from your recommendations to build your shortlist." action={() => go("recommendations")} actionLabel="Explore recommendations" />}</section>}

        {section === "highlights" && <div className="nv-content-stack"><section className="nv-panel nv-panel-spaced"><div className="nv-panel-heading"><div><h2>Open-to-work profile</h2><p>Your availability and preferences used for matching.</p></div><Target size={18} /></div>{openStatus ? <div className="nv-status-card"><div><span className="nv-status-good">Preference found</span><h3>{openStatus.jobTitle || "Career preferences"}</h3><p>{openStatus.jobType || "Employment type not specified"} · {openStatus.experienceYears || 0}y {openStatus.experienceMonths || 0}m experience</p><small>Notice period: {openStatus.noticePeriod || "Not specified"}</small></div><button className="nv-secondary" disabled={busy} onClick={() => void perform(() => openToWorkApi.toggleStatus(id), "Availability status updated.")}>Toggle availability</button></div> : <EmptyState title="No open-to-work preference found" text="Add the role, availability and salary range you are targeting." />}</section><section className="nv-panel nv-panel-spaced"><div className="nv-panel-heading"><div><h2>Set your preferences</h2><p>Save details used by Jobkar's matching endpoints.</p></div><Target size={18} /></div><form className="nv-form-grid" onSubmit={saveAvailability}><label>Target job title<input required value={availability.jobTitle} onChange={event => setAvailability({ ...availability, jobTitle: event.target.value })} /></label><label>Job type<select value={availability.jobType} onChange={event => setAvailability({ ...availability, jobType: event.target.value })}><option>Full-time</option><option>Part-time</option><option>Contract</option><option>Internship</option></select></label><label>Notice period<input value={availability.noticePeriod} onChange={event => setAvailability({ ...availability, noticePeriod: event.target.value })} /></label><label>Highest education<input value={availability.highestEducation} onChange={event => setAvailability({ ...availability, highestEducation: event.target.value })} /></label><label>Experience years<input type="number" min="0" value={availability.experienceYears} onChange={event => setAvailability({ ...availability, experienceYears: event.target.value })} /></label><label>Experience months<input type="number" min="0" max="11" value={availability.experienceMonths} onChange={event => setAvailability({ ...availability, experienceMonths: event.target.value })} /></label><label>Expected salary minimum<input type="number" min="0" value={availability.expectedSalaryMin} onChange={event => setAvailability({ ...availability, expectedSalaryMin: event.target.value })} /></label><label>Expected salary maximum<input type="number" min="0" value={availability.expectedSalaryMax} onChange={event => setAvailability({ ...availability, expectedSalaryMax: event.target.value })} /></label><div className="nv-form-footer nv-full"><span>/backend/open_to_work/save</span><button className="nv-primary" disabled={busy}><Check size={15} /> Save preferences</button></div></form></section></div>}

        {section === "notifications" && <section className="nv-panel nv-panel-spaced"><div className="nv-panel-heading"><div><h2>Account notifications</h2><p>{alerts.filter(item => !item.isRead).length} unread of {alerts.length} total.</p></div><Bell size={18} /></div><div className="nv-notification-list">{alerts.map(item => <article className={"nv-notification" + (!item.isRead ? " unread" : "")} key={item.id}><span className="nv-notification-mark"><Bell size={16} /></span><div><strong>{item.title}</strong><p>{item.message}</p><small>{dateText(item.createdAt)}</small></div><div className="nv-notification-actions">{!item.isRead && <button className="nv-icon-action" title="Mark read" onClick={() => void perform(() => notificationApi.markAsRead(item.id), "Notification marked as read.")}><Check size={16} /></button>}<button className="nv-icon-action danger" title="Delete" onClick={() => void perform(() => notificationApi.deleteNotification(item.id), "Notification deleted.")}><Trash2 size={16} /></button></div></article>)}</div>{!alerts.length && !loading && <EmptyState title="You're all caught up" text="New account and job updates will appear here." />}</section>}

        {section === "messages" && <section className="nv-panel nv-panel-spaced"><div className="nv-panel-heading"><div><h2>Conversations</h2><p>{threads.length} conversation threads returned by Jobkar Chat.</p></div><MessageCircle size={18} /></div><div className="nv-messages-layout"><div className="nv-thread-list">{threads.map(thread => { const person = (thread.participants || []).find((item: any) => String(item.id) !== id) || thread.participants?.[0]; return <button key={thread.threadId} className={"nv-thread" + (activeThread?.threadId === thread.threadId ? " active" : "")} onClick={() => void openChat(thread)}><span className="nv-thread-avatar">{initials(person?.name || "Member")}</span><span><strong>{person?.name || "Conversation"}</strong><small>{thread.lastMsg || "Open conversation"}</small><small>{dateText(thread.lastMsgTime)}</small></span>{thread.unreadCount > 0 && <i>{thread.unreadCount}</i>}</button>; })}{!threads.length && !loading && <p className="nv-muted-copy">No conversation threads were returned.</p>}</div><div className="nv-chat-preview">{activeThread ? <><div className="nv-chat-title"><strong>{activeThread.participants?.find((item: any) => String(item.id) !== id)?.name || "Conversation"}</strong><small>Thread #{activeThread.threadId}</small></div><div className="nv-chat-history">{chat.map((item, index) => <div className="nv-chat-bubble" key={item.id || index}><p>{item.message || item.content || item.text || "Message content not provided"}</p><small>{dateText(item.createdAt || item.created_at)}</small></div>)}{!chat.length && <EmptyState title="No history returned" text="The history endpoint returned no message records." />}</div></> : <EmptyState title="Select a conversation" text="Choose a conversation to load history. Message sending is not enabled because no verified send-message method is defined in the API modules." />}</div></div></section>}

        {section === "support" && <div className="nv-content-stack"><section className="nv-panel nv-panel-spaced"><div className="nv-panel-heading"><div><h2>Create a support request</h2><p>Send a request to the Jobkar support service.</p></div><Send size={18} /></div><form className="nv-form-grid" onSubmit={createTicket}><label className="nv-full">Subject<input required value={support.subject} onChange={event => setSupport({ ...support, subject: event.target.value })} /></label><label className="nv-full">Description<textarea required rows={5} value={support.description} onChange={event => setSupport({ ...support, description: event.target.value })} /></label><div className="nv-form-footer nv-full"><span>/backend/support/create</span><button className="nv-primary" disabled={busy}><Send size={15} /> Submit request</button></div></form></section><section className="nv-panel nv-panel-spaced"><div className="nv-panel-heading"><div><h2>Your support tickets</h2><p>{tickets.length} tickets returned by the support API.</p></div><CircleHelp size={18} /></div><div className="nv-record-list">{tickets.map(item => <Record key={item.id} title={item.subject} meta={item.status + " · " + dateText(item.createdAt)} onDelete={item.status !== "CLOSED" ? () => void perform(() => supportApi.closeTicket(item.id, { userId, subject: item.subject, description: item.description }), "Support ticket closed.") : undefined} />)}</div>{!tickets.length && !loading && <EmptyState title="No support tickets" text="Create a request above to contact the support team." />}</section></div>}

        {section === "find-jobs" && <section className="nv-panel nv-panel-spaced"><div className="nv-panel-heading"><div><h2>Search connected job sources</h2><p>Nvoid searches configured live providers. Results are not submitted as applications.</p></div><Search size={18} /></div><form className="nv-search-form" onSubmit={searchJobs}><label>Job title or skill<input required value={jobTitle} onChange={event => setJobTitle(event.target.value)} placeholder="Java Backend Developer" /></label><label>Location<input required value={jobLocation} onChange={event => setJobLocation(event.target.value)} placeholder="City, country or Remote" /></label><button className="nv-primary" disabled={busy}>{busy ? <LoaderCircle size={16} className="nv-spin" /> : <Search size={16} />}{busy ? "Searching" : "Search live sources"}</button></form><div className="nv-agent-results">{jobs.map((item, index) => <article className="nv-agent-job" key={item.id || item.jobId || index}><div><strong>{item.title || "Untitled role"}</strong><small>{item.company || item.companyName || "Company not listed"} · {item.location || "Location not listed"}</small><small>{item.source || "Connected source"}</small></div>{(item.applicationUrl || item.jobUrl || item.url) && <a href={String(item.applicationUrl || item.jobUrl || item.url)} target="_blank" rel="noreferrer">View listing <ArrowUpRight size={14} /></a>}</article>)}</div>{!jobs.length && <EmptyState title="Ready to search" text="Enter a job title and location. Only actual results returned by connected sources are displayed." />}<div className="nv-info-strip"><ShieldCheck size={16} /><span>Search runs with backend synchronization disabled. It does not claim that an application has been submitted.</span></div></section>}

        {section === "applications" && <section className="nv-panel nv-panel-spaced"><div className="nv-panel-heading"><div><h2>Application activity</h2><p>The pushed API modules do not define a verified personal-application list endpoint.</p></div><ClipboardList size={18} /></div><EmptyState title="Application history API not connected" text="Recommendations, saved jobs, profile, skills, education, experience, resumes, chat, notifications and support are connected. No application-history method exists in the current API modules, so records are not fabricated." action={() => go("connections")} actionLabel="Review connected APIs" /></section>}
      </div>
    </main>
  </div>;
}

function Record({ title, meta, onEdit, onDelete }: { title: string; meta: string; onEdit?: () => void; onDelete?: () => void }) {
  return <article className="nv-record"><span className="nv-record-icon"><FileText size={17} /></span><div><strong>{title}</strong><small>{meta || "Details not provided"}</small></div>{onEdit && <button className="nv-icon-action" onClick={onEdit} aria-label={"Edit " + title}><Pencil size={16} /></button>}{onDelete && <button className="nv-icon-action danger" onClick={onDelete} aria-label={"Remove " + title}><Trash2 size={16} /></button>}</article>;
}
function JobCard({ job, onSave, disabled }: { job: RecordData; onSave: () => void; disabled: boolean }) {
  return <article className="nv-job-card"><div className="nv-job-top"><span className="nv-job-company">{initials(job.companyName || "Company")}</span>{job.isVerified && <span className="nv-status-good"><ShieldCheck size={13} /> Verified</span>}</div><h3>{job.title}</h3><p>{job.companyName}</p><div className="nv-job-meta"><span>{[job.city, job.state].filter(Boolean).join(", ") || "Location not listed"}</span><span>{job.experience || "Experience not listed"}</span><span>{job.workMode || "Work mode not listed"}</span></div><div className="nv-job-bottom"><strong>{job.salaryRange || "Salary not disclosed"}</strong><button className="nv-secondary nv-small" disabled={disabled} onClick={onSave}>{job.isFavorite ? "Saved" : "Save job"}</button></div></article>;
}
function EmptyState({ title, text, action, actionLabel }: { title: string; text: string; action?: () => void; actionLabel?: string }) {
  return <div className="nv-empty"><span><Sparkles size={21} /></span><h3>{title}</h3><p>{text}</p>{action && <button className="nv-text-action" onClick={action}>{actionLabel || "Continue"} <ArrowRight size={14} /></button>}</div>;
}
