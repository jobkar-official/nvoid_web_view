"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Activity, ArrowRight, ArrowUpRight, Bell, BriefcaseBusiness, Check, CheckCircle2, ClipboardList, FileText, GraduationCap, Languages, MessageSquare, Pencil, Plus, ShieldCheck, Sparkles, Target, Trash2, UserRound, X } from "lucide-react";
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

type Session = { user: { id?: string; name?: string; fullName?: string; email?: string; slug?: string; phone?: string } };
type RecordData = Record<string, any>;
type Page = { title: string; description: string; icon: typeof BriefcaseBusiness };
const pages: Record<string, Page> = {
  activity: { title: "Application", description: "Manage your saved opportunities and application activity.", icon: BriefcaseBusiness },
  profile: { title: "Profile", description: "Manage your professional information and preferences.", icon: UserRound },
  highlights: { title: "Open to work", description: "Manage your availability and job preferences.", icon: Target },
  messages: { title: "Messages", description: "View your conversations.", icon: MessageSquare },
  notifications: { title: "Notifications", description: "Review your account updates.", icon: Bell },
  support: { title: "Support", description: "Get help with your account.", icon: BriefcaseBusiness }
};
type ProfileTab = "profile" | "education" | "skills" | "experience" | "languages" | "resume";
const profileTabIds: ProfileTab[] = ["profile", "education", "skills", "experience", "languages", "resume"];
const profileTabNavigation = [
  { id: "profile" as ProfileTab, label: "Edit profile", icon: UserRound },
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

export default function PrivateAccountPage({ initialSession, initialSection }: { initialSession: Session; initialSection: string }) {
  const id = initialSession.user.id || "";
  const userId = Number(id);
  const name = initialSession.user.fullName || initialSession.user.name || "Member";
  const section = ({ application: "activity", message: "messages", notification: "notifications" } as Record<string, string>)[initialSection] || initialSection;
  const [profileTab, setProfileTab] = useState<ProfileTab>("profile");
  const [activityTab, setActivityTab] = useState<"saved" | "applications">("saved");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [profile, setProfile] = useState({ name, email: initialSession.user.email || "", phone: initialSession.user.phone || "", bio: "", city: "", state: "", country: "India" });
  const [skills, setSkills] = useState<RecordData[]>([]);
  const [education, setEducation] = useState<RecordData[]>([]);
  const [experience, setExperience] = useState<RecordData[]>([]);
  const [resumes, setResumes] = useState<RecordData[]>([]);
  const [languages, setLanguages] = useState<RecordData[]>([]);
  const [saved, setSaved] = useState<RecordData[]>([]);
  const [alerts, setAlerts] = useState<RecordData[]>([]);
  const [tickets, setTickets] = useState<RecordData[]>([]);
  const [threads, setThreads] = useState<RecordData[]>([]);
  const [chat, setChat] = useState<RecordData[]>([]);
  const [activeThread, setActiveThread] = useState<RecordData | null>(null);
  const [openStatus, setOpenStatus] = useState<RecordData | null>(null);
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
  const [replacingResumeId, setReplacingResumeId] = useState<number | string | null>(null);

  const loadPage = useCallback(async () => {
    if (section === "activity" && activityTab === "applications") return;
    if (!id || !Number.isFinite(userId)) {
      setError("The sign-in response did not include a valid account ID. Account-specific API calls need that ID.");
      return;
    }
    setLoading(true);
    setError("");
    try {
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
      if (section === "activity" && activityTab === "saved") setSaved(await favouriteApi.getFavouriteJobsByUserId(id));
      if (section === "notifications") setAlerts(await notificationApi.getNotificationsByUserId(id));
      if (section === "messages") setThreads(await messageApi.getThreadsByUserId(id));
      if (section === "highlights") {
        const status = await openToWorkApi.getByUserId(id);
        setOpenStatus(status);
        if (status) setAvailability({ jobTitle: status.jobTitle || "", jobType: status.jobType || "Full-time", noticePeriod: status.noticePeriod || "Immediate", experienceYears: String(status.experienceYears ?? 0), experienceMonths: String(status.experienceMonths ?? 0), expectedSalaryMin: String(status.expectedSalaryMin ?? 0), expectedSalaryMax: String(status.expectedSalaryMax ?? 0), highestEducation: status.highestEducation || "Graduate" });
      }
      if (section === "support") setTickets(await supportApi.getTicketsByUserId(id));
    } catch (cause) {
      setError(errorText(cause));
    } finally {
      setLoading(false);
    }
  }, [section, profileTab, activityTab, id, userId, initialSession.user.slug, initialSession.user.email, initialSession.user.phone, name]);

  useEffect(() => { void loadPage(); }, [loadPage]);

  const go = (target: string) => {
    setNotice("");
    setError("");
    if (profileTabIds.includes(target as ProfileTab)) {
      setProfileTab(target as ProfileTab);
      return;
    }
    if (target === "saved" || target === "applications") {
      setActivityTab(target);
      return;
    }
    if (target === "find-jobs") window.location.assign("/");
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
    const oldResume = resumes.find(item => String(item.id) === String(replacingResumeId));
    if (replacingResumeId !== null && !oldResume) return setError("The resume selected for replacement is no longer available. Refresh the list and try again.");
    void perform(async () => {
      await resumeApi.uploadResume(body);
      if (replacingResumeId !== null && oldResume) {
        try {
          await resumeApi.deleteResume(oldResume.id);
        } catch {
          const refreshed = await resumeApi.getResumesByUserId(id).catch(() => []);
          setResumes(rows(refreshed));
          throw new Error("The new resume was uploaded, but the previous file could not be removed. Review your resume list for both files.");
        }
      }
      setFile(null);
      setReplacingResumeId(null);
    }, replacingResumeId !== null ? "Resume replaced successfully." : "Resume uploaded successfully.");
  };
  const saveAvailability = (event: FormEvent) => {
    event.preventDefault();
    void perform(() => openToWorkApi.saveStatus({ userId, name, email: initialSession.user.email, phoneNumber: initialSession.user.phone, noticePeriod: availability.noticePeriod, experienceYears: Number(availability.experienceYears), experienceMonths: Number(availability.experienceMonths), expectedSalaryMin: Number(availability.expectedSalaryMin), expectedSalaryMax: Number(availability.expectedSalaryMax), highestEducation: availability.highestEducation, jobTitle: availability.jobTitle, jobType: availability.jobType }), "Availability preferences submitted.");
  };
  const createTicket = (event: FormEvent) => {
    event.preventDefault();
    void perform(() => supportApi.createTicket({ userId, subject: support.subject, description: support.description }), "Support request submitted.");
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

  const page = pages[section] || pages.activity;
  const Icon = page.icon;

  return <div className="nv-main nv-private-page">
    <div className="nv-content">
      <div className="nv-page-heading">
        <div>
          <div className="nv-eyebrow"><Icon size={14} /> ACCOUNT <span>·</span> PRIVATE</div>
          <h1>{page.title}</h1>
          <p>{page.description}</p>
        </div>
      </div>
      {error && <div className="nv-alert nv-alert-error" role="alert"><X size={16} /><span>{error}</span><button onClick={() => setError("")} aria-label="Dismiss"><X size={14} /></button></div>}
      {notice && <div className="nv-alert nv-alert-success" role="status"><CheckCircle2 size={16} /><span>{notice}</span><button onClick={() => setNotice("")} aria-label="Dismiss"><X size={14} /></button></div>}
      {loading && <div className="nv-loading-line"><span /> Syncing account data</div>}

      {section === "profile" && <nav className="nv-profile-tabs" aria-label="Profile sections">
        {profileTabNavigation.map(item => {
          const TabIcon = item.icon;
          return <button type="button" key={item.id} className={"nv-profile-tab" + (profileTab === item.id ? " active" : "")} aria-current={profileTab === item.id ? "page" : undefined} onClick={() => go(item.id)}><TabIcon size={15} /><span>{item.label}</span></button>;
        })}
      </nav>}

      {section === "profile" && profileTab === "profile" && <section className="nv-panel nv-panel-spaced"><div className="nv-panel-heading"><div><h2>Professional identity</h2><p>Keep your account information up to date.</p></div><UserRound size={18} /></div><form className="nv-form-grid" onSubmit={saveProfile}><label>Full name<input required value={profile.name} onChange={event => setProfile({ ...profile, name: event.target.value })} /></label><label>Email address<input type="email" value={profile.email} onChange={event => setProfile({ ...profile, email: event.target.value })} /></label><label>Phone number<input value={profile.phone} onChange={event => setProfile({ ...profile, phone: event.target.value })} /></label><label>Country<input value={profile.country} onChange={event => setProfile({ ...profile, country: event.target.value })} /></label><label>State<input value={profile.state} onChange={event => setProfile({ ...profile, state: event.target.value })} /></label><label>City<input value={profile.city} onChange={event => setProfile({ ...profile, city: event.target.value })} /></label><label className="nv-full">Professional summary<textarea rows={5} value={profile.bio} onChange={event => setProfile({ ...profile, bio: event.target.value })} /></label><div className="nv-form-footer nv-full"><span>Account ID: {id || "Not returned by authentication"}</span><button className="nv-primary" disabled={busy}><Check size={15} /> Save profile</button></div></form></section>}

      {section === "profile" && profileTab === "skills" && <div className="nv-content-stack"><section className="nv-panel nv-panel-spaced"><div className="nv-panel-heading"><div><h2>Add a skill</h2><p>Save a skill to your professional profile.</p></div><Plus size={18} /></div><form className="nv-form-grid nv-skill-form" onSubmit={addSkill}><label>Skill name<input required value={skillName} onChange={event => setSkillName(event.target.value)} placeholder="Java, React, Product Design" /></label><label>Proficiency<select value={skillLevel} onChange={event => setSkillLevel(event.target.value)}><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label><label>Years<input type="number" min="0" max="60" value={skillYears} onChange={event => setSkillYears(event.target.value)} /></label><label>Months<input type="number" min="0" max="11" value={skillMonths} onChange={event => setSkillMonths(event.target.value)} /></label><div className="nv-form-footer nv-full"><div className="nv-form-actions"><button type="button" className="nv-secondary" hidden={editingSkillId === null} onClick={() => { setEditingSkillId(null); setSkillName(""); setSkillLevel("Intermediate"); setSkillYears("1"); setSkillMonths("0"); }}>Cancel</button><button className="nv-primary" disabled={busy}><Plus size={15} /> {editingSkillId !== null ? "Save changes" : "Add skill"}</button></div></div></form></section><section className="nv-panel nv-panel-spaced"><div className="nv-panel-heading"><div><h2>Your skills</h2><p>{skills.length} records</p></div><Target size={18} /></div><div className="nv-record-grid">{skills.map(item => <Record key={item.id} title={item.skillName || "Skill"} meta={[item.proficiencyLevel, item.year ? item.year + "y " + (item.month || 0) + "m" : ""].filter(Boolean).join(" · ")} onEdit={() => { setEditingSkillId(item.id); setSkillName(item.skillName || ""); setSkillLevel(item.proficiencyLevel || "Intermediate"); setSkillYears(String(item.year ?? 0)); setSkillMonths(String(item.month ?? 0)); }} onDelete={() => void perform(() => skillsApi.deleteSkill(item.id), "Skill removed.")} />)}</div>{!skills.length && !loading && <EmptyState title="No skills added yet" text="Add your strongest skills to complete your profile." />}</section></div>}

      {section === "profile" && profileTab === "education" && <div className="nv-content-stack"><section className="nv-panel nv-panel-spaced"><div className="nv-panel-heading"><div><h2>Add qualification</h2><p>Create an education record on your account.</p></div><GraduationCap size={18} /></div><form className="nv-form-grid" onSubmit={addEducation}><label>Qualification<input required value={qualification.qualification} onChange={event => setQualification({ ...qualification, qualification: event.target.value })} /></label><label>University / board<input required value={qualification.boardOrUniversity} onChange={event => setQualification({ ...qualification, boardOrUniversity: event.target.value })} /></label><label>Start year<input required type="number" value={qualification.startYear} onChange={event => setQualification({ ...qualification, startYear: event.target.value })} /></label><label>Completion year<input required type="number" value={qualification.completeYear} onChange={event => setQualification({ ...qualification, completeYear: event.target.value })} /></label><label>Study mode<input value={qualification.from} onChange={event => setQualification({ ...qualification, from: event.target.value })} /></label><label>Grade / score<input value={qualification.grade} onChange={event => setQualification({ ...qualification, grade: event.target.value })} /></label><div className="nv-form-footer nv-full"><div className="nv-form-actions"><button type="button" className="nv-secondary" hidden={editingEducationId === null} onClick={() => { setEditingEducationId(null); setQualification({ qualification: "", boardOrUniversity: "", startYear: "", completeYear: "", from: "", grade: "" }); }}>Cancel</button><button className="nv-primary" disabled={busy}><Plus size={15} /> {editingEducationId !== null ? "Save changes" : "Save education"}</button></div></div></form></section><section className="nv-panel nv-panel-spaced"><div className="nv-panel-heading"><div><h2>Education history</h2><p>{education.length} records</p></div><GraduationCap size={18} /></div><div className="nv-record-list">{education.map(item => <Record key={item.id} title={item.qualification || "Qualification"} meta={[item.boardOrUniversity, item.startYear && item.completeYear ? item.startYear + "–" + item.completeYear : "", item.grade].filter(Boolean).join(" · ")} onEdit={() => { setEditingEducationId(item.id); setQualification({ qualification: item.qualification || "", boardOrUniversity: item.boardOrUniversity || "", startYear: String(item.startYear ?? ""), completeYear: String(item.completeYear ?? ""), from: item.from || "", grade: item.grade || "" }); }} onDelete={() => void perform(() => qualificationApi.deleteQualification(item.id), "Education record deleted.")} />)}</div>{!education.length && !loading && <EmptyState title="No education records" text="Add your qualifications to complete your professional profile." />}</section></div>}

      {section === "profile" && profileTab === "experience" && <div className="nv-content-stack"><section className="nv-panel nv-panel-spaced"><div className="nv-panel-heading"><div><h2>Add experience</h2><p>Save a current or previous role to your professional history.</p></div><Activity size={18} /></div><form className="nv-form-grid" onSubmit={addExperience}><label>Company<input required value={work.companyName} onChange={event => setWork({ ...work, companyName: event.target.value })} /></label><label>Designation<input required value={work.designation} onChange={event => setWork({ ...work, designation: event.target.value })} /></label><label>Location<input value={work.companyLocation} onChange={event => setWork({ ...work, companyLocation: event.target.value })} /></label><label>Start date<input required type="date" value={work.startDate} onChange={event => setWork({ ...work, startDate: event.target.value })} /></label><label>End date<input type="date" disabled={work.current} value={work.endDate} onChange={event => setWork({ ...work, endDate: event.target.value })} /></label><label className="nv-check-label"><input type="checkbox" checked={work.current} onChange={event => setWork({ ...work, current: event.target.checked })} /> I currently work here</label><div className="nv-form-footer nv-full"><div className="nv-form-actions"><button type="button" className="nv-secondary" hidden={editingExperienceId === null} onClick={() => { setEditingExperienceId(null); setWork({ companyName: "", designation: "", companyLocation: "", startDate: "", endDate: "", current: false }); }}>Cancel</button><button className="nv-primary" disabled={busy}><Plus size={15} /> {editingExperienceId !== null ? "Save changes" : "Add experience"}</button></div></div></form></section><section className="nv-panel nv-panel-spaced"><div className="nv-panel-heading"><div><h2>Work history</h2><p>{experience.length} records</p></div><Activity size={18} /></div><div className="nv-record-list">{experience.map(item => <Record key={item.id} title={item.designation || "Role"} meta={[item.companyName, item.companyLocation, dateText(item.startDate) + " – " + (item.isCurrent ? "Present" : dateText(item.endDate))].filter(Boolean).join(" · ")} onEdit={() => { setEditingExperienceId(item.id); setWork({ companyName: item.companyName || "", designation: item.designation || "", companyLocation: item.companyLocation || "", startDate: item.startDate || "", endDate: item.endDate || "", current: Boolean(item.isCurrent) }); }} onDelete={() => void perform(() => experienceApi.deleteExperience(item.id), "Experience record deleted.")} />)}</div>{!experience.length && !loading && <EmptyState title="No experience added" text="Add your work history to complete your profile." />}</section></div>}

      {section === "profile" && profileTab === "languages" && <div className="nv-content-stack"><section className="nv-panel nv-panel-spaced"><div className="nv-panel-heading"><div><h2>Add a language</h2><p>Record the languages you can use at work.</p></div><Languages size={18} /></div><form className="nv-form-grid" onSubmit={addLanguage}><label>Language<input required value={languageName} onChange={event => setLanguageName(event.target.value)} placeholder="e.g. English, Hindi, Gujarati" /></label><label>Proficiency<select value={languageProficiency} onChange={event => setLanguageProficiency(event.target.value)}><option>Native</option><option>Fluent</option><option>Professional</option><option>Conversational</option><option>Basic</option></select></label><div className="nv-form-footer nv-full"><div className="nv-form-actions"><button type="button" className="nv-secondary" hidden={editingLanguageId === null} onClick={() => { setEditingLanguageId(null); setLanguageName(""); setLanguageProficiency("Professional"); }}>Cancel</button><button className="nv-primary" disabled={busy || !languageName.trim()}><Plus size={15} /> {editingLanguageId !== null ? "Save changes" : "Add language"}</button></div></div></form></section><section className="nv-panel nv-panel-spaced"><div className="nv-panel-heading"><div><h2>Your languages</h2><p>{languages.length} language records</p></div><Languages size={18} /></div><div className="nv-record-grid">{languages.map(item => <Record key={item.id} title={item.language || "Language"} meta={item.proficiency || "Proficiency not provided"} onEdit={() => { setEditingLanguageId(item.id); setLanguageName(item.language || ""); setLanguageProficiency(item.proficiency || "Professional"); }} onDelete={() => void perform(() => languageApi.deleteLanguage(item.id, { userId, language: item.language }), "Language removed from your profile.")} />)}</div>{!languages.length && !loading && <EmptyState title="No languages added" text="Add the languages you use to communicate professionally." />}</section><div className="nv-info-strip"><ShieldCheck size={16} /><span>The API has no dedicated language update endpoint. Editing saves the replacement first, then removes the previous record.</span></div></div>}

      {section === "profile" && profileTab === "resume" && <div className="nv-content-stack"><section className="nv-panel nv-panel-spaced"><div className="nv-panel-heading"><div><h2>{replacingResumeId !== null ? "Replace resume" : "Upload a resume"}</h2><p>{replacingResumeId !== null ? "The new file is uploaded before the previous resume is removed." : "Upload a resume to your Jobkar profile."}</p></div><FileText size={18} /></div><form className="nv-upload-form" onSubmit={uploadResume}><label className="nv-file-drop"><FileText size={24} /><strong>{file?.name || "Choose your resume"}</strong><small>PDF or DOC/DOCX · Select a file from this device</small><input type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={event => setFile(event.target.files?.[0] || null)} /></label><div className="nv-form-footer"><div className="nv-form-actions"><button type="button" className="nv-secondary" hidden={replacingResumeId === null} onClick={() => { setReplacingResumeId(null); setFile(null); }}>Cancel</button><button className="nv-primary" disabled={busy || !file}><Plus size={15} /> {replacingResumeId !== null ? "Replace resume" : "Upload resume"}</button></div></div></form></section><section className="nv-panel nv-panel-spaced"><div className="nv-panel-heading"><div><h2>Your resumes</h2><p>{resumes.length} records</p></div><FileText size={18} /></div><div className="nv-record-list">{resumes.map(item => <div className="nv-record" key={item.id}><span className="nv-record-icon"><FileText size={17} /></span><div><strong>{item.fileName || item.name || (item.resume || "").split("/").pop() || "Resume " + item.id}</strong><small>{dateText(item.createdAt)}</small></div>{item.resume && <a className="nv-icon-action" href={String(item.resume)} target="_blank" rel="noreferrer" aria-label="Open resume"><ArrowUpRight size={16} /></a>}<button className="nv-icon-action" onClick={() => { setReplacingResumeId(item.id); setFile(null); }} aria-label="Replace resume"><Pencil size={16} /></button><button className="nv-icon-action danger" onClick={() => void perform(() => resumeApi.deleteResume(item.id), "Resume deleted.")} aria-label="Delete resume"><Trash2 size={16} /></button></div>)}</div>{!resumes.length && !loading && <EmptyState title="No resume on file" text="Upload a current resume so it is attached to your account." />}</section></div>}

      {section === "activity" && <section className="nv-panel nv-panel-spaced">
        <div className="nv-panel-heading"><div><h2>Application</h2><p>Manage your saved opportunities and track your applications.</p></div><BriefcaseBusiness size={18} /></div>
        <nav className="nv-profile-tabs nv-activity-tabs" aria-label="Saved jobs and applications">
          <button type="button" className={"nv-profile-tab" + (activityTab === "saved" ? " active" : "")} aria-current={activityTab === "saved" ? "page" : undefined} onClick={() => go("saved")}><BriefcaseBusiness size={15} /><span>Saved jobs</span></button>
          <button type="button" className={"nv-profile-tab" + (activityTab === "applications" ? " active" : "")} aria-current={activityTab === "applications" ? "page" : undefined} onClick={() => go("applications")}><ClipboardList size={15} /><span>Applications</span></button>
        </nav>
        {activityTab === "saved" && <><div className="nv-job-grid">{saved.map(item => <article className="nv-job-card" key={item.id}><div className="nv-job-top"><span className="nv-job-company">{initials(item.companyName || "Company")}</span><span className="nv-status-neutral">Saved {dateText(item.createdAt)}</span></div><h3>{item.title}</h3><p>{item.companyName || "Company not listed"}</p><div className="nv-job-meta"><span>{[item.city, item.state].filter(Boolean).join(", ") || "Location not listed"}</span><span>{item.experience || "Experience not listed"}</span><span>{item.workMode || "Work mode not listed"}</span></div><div className="nv-job-bottom"><strong>{item.salaryRange || "Salary not disclosed"}</strong><button className="nv-secondary nv-small" onClick={() => void perform(() => favouriteApi.deleteFavouriteApplication(item.id), "Removed from saved jobs.")}><Trash2 size={14} /> Remove</button></div></article>)}</div>{!saved.length && !loading && <EmptyState title="No saved jobs yet" text="Save an opportunity from Find jobs to build your shortlist." action={() => go("find-jobs")} actionLabel="Find jobs" />}</>}
        {activityTab === "applications" && <EmptyState title="Application history is not available yet" text="Your application activity will appear here when a verified application-history service is connected." action={() => go("find-jobs")} actionLabel="Find jobs" />}
      </section>}

      {section === "highlights" && <section className="nv-panel nv-panel-spaced">
        <div className="nv-panel-heading"><div><h2>Open to work</h2><p>Set your availability and job preferences.</p></div><Target size={18} /></div>
        {openStatus && <div className="nv-info-strip"><ShieldCheck size={16} /><span>Your current preferences are saved. Update any field below to refresh them.</span></div>}
        <form className="nv-form-grid" onSubmit={saveAvailability}>
          <label>Desired role<input required value={availability.jobTitle} onChange={event => setAvailability({ ...availability, jobTitle: event.target.value })} placeholder="e.g. Product Designer" /></label>
          <label>Job type<select value={availability.jobType} onChange={event => setAvailability({ ...availability, jobType: event.target.value })}><option>Full-time</option><option>Part-time</option><option>Contract</option><option>Internship</option></select></label>
          <label>Notice period<select value={availability.noticePeriod} onChange={event => setAvailability({ ...availability, noticePeriod: event.target.value })}><option>Immediate</option><option>15 days</option><option>30 days</option><option>60 days</option><option>90 days</option></select></label>
          <label>Experience years<input type="number" min="0" max="60" value={availability.experienceYears} onChange={event => setAvailability({ ...availability, experienceYears: event.target.value })} /></label>
          <label>Experience months<input type="number" min="0" max="11" value={availability.experienceMonths} onChange={event => setAvailability({ ...availability, experienceMonths: event.target.value })} /></label>
          <label>Highest education<input value={availability.highestEducation} onChange={event => setAvailability({ ...availability, highestEducation: event.target.value })} /></label>
          <label>Minimum expected salary<input type="number" min="0" value={availability.expectedSalaryMin} onChange={event => setAvailability({ ...availability, expectedSalaryMin: event.target.value })} /></label>
          <label>Maximum expected salary<input type="number" min="0" value={availability.expectedSalaryMax} onChange={event => setAvailability({ ...availability, expectedSalaryMax: event.target.value })} /></label>
          <div className="nv-form-footer nv-full"><button className="nv-primary" disabled={busy}><Check size={15} /> Save preferences</button></div>
        </form>
      </section>}

      {section === "messages" && <div className="nv-content-stack">
        <section className="nv-panel nv-panel-spaced">
          <div className="nv-panel-heading"><div><h2>Conversations</h2><p>Your recent private chats.</p></div><MessageSquare size={18} /></div>
          <div className="nv-record-list">
            {threads.map(thread => {
              const partner = (thread.participants || []).find((person: RecordData) => String(person.id) !== id) || thread.participants?.[0];
              return <button type="button" className="nv-record nv-message-record" key={thread.threadId || thread.id} onClick={() => void openChat(thread)}>
                <span className="nv-record-icon">{initials(partner?.name || "Member")}</span>
                <span><strong>{partner?.name || "Conversation"}</strong><small>{thread.lastMsg || "No message preview"} · {dateText(thread.lastMsgTime)}</small></span>
                {Number(thread.unreadCount) > 0 && <span className="nv-status-neutral">{thread.unreadCount} new</span>}
              </button>;
            })}
          </div>
          {!threads.length && !loading && <EmptyState title="No conversations yet" text="Your private conversations will appear here." />}
        </section>
        {activeThread && <section className="nv-panel nv-panel-spaced">
          <div className="nv-panel-heading"><div><h2>Conversation</h2><p>{(activeThread.participants || []).map((person: RecordData) => person.name).filter(Boolean).join(", ")}</p></div><MessageSquare size={18} /></div>
          <div className="nv-record-list">{chat.map((message, index) => <article className="nv-record" key={message.id || index}><div><strong>{message.senderName || message.sender?.name || "Message"}</strong><small>{message.message || message.content || message.text || "Message content unavailable"} · {dateText(message.createdAt || message.sentAt)}</small></div></article>)}</div>
          {!chat.length && <EmptyState title="No messages in this conversation" text="New messages will appear here." />}
        </section>}
      </div>}

      {section === "notifications" && <section className="nv-panel nv-panel-spaced">
        <div className="nv-panel-heading"><div><h2>Notifications</h2><p>Updates related to your account and activity.</p></div><Bell size={18} /></div>
        <div className="nv-record-list">{alerts.map(item => <article className="nv-record" key={item.id}>
          <span className="nv-record-icon"><Bell size={16} /></span>
          <div><strong>{item.title || "Notification"}</strong><small>{item.message || ""} · {dateText(item.createdAt)}</small></div>
          {!item.isRead && <button className="nv-secondary nv-small" onClick={() => void perform(() => notificationApi.markAsRead(item.id), "Notification marked as read.")}>Mark read</button>}
          <button className="nv-icon-action danger" aria-label="Delete notification" onClick={() => void perform(() => notificationApi.deleteNotification(item.id), "Notification deleted.")}><Trash2 size={15} /></button>
        </article>)}</div>
        {!alerts.length && !loading && <EmptyState title="You're all caught up" text="New account updates will appear here." />}
      </section>}

      {section === "support" && <div className="nv-content-stack">
        <section className="nv-panel nv-panel-spaced">
          <div className="nv-panel-heading"><div><h2>Create a support request</h2><p>Tell us what you need help with.</p></div><BriefcaseBusiness size={18} /></div>
          <form className="nv-form-grid" onSubmit={createTicket}>
            <label className="nv-full">Subject<input required value={support.subject} onChange={event => setSupport({ ...support, subject: event.target.value })} placeholder="How can we help?" /></label>
            <label className="nv-full">Details<textarea required rows={5} value={support.description} onChange={event => setSupport({ ...support, description: event.target.value })} placeholder="Describe the issue or question." /></label>
            <div className="nv-form-footer nv-full"><button className="nv-primary" disabled={busy || !support.subject.trim() || !support.description.trim()}><Plus size={15} /> Submit request</button></div>
          </form>
        </section>
        <section className="nv-panel nv-panel-spaced">
          <div className="nv-panel-heading"><div><h2>Your support requests</h2><p>{tickets.length} requests</p></div><BriefcaseBusiness size={18} /></div>
          <div className="nv-record-list">{tickets.map(ticket => <article className="nv-record" key={ticket.id}><div><strong>{ticket.subject || "Support request"}</strong><small>{ticket.status || "Status pending"} · {dateText(ticket.createdAt)}</small></div></article>)}</div>
          {!tickets.length && !loading && <EmptyState title="No support requests yet" text="Requests you submit will appear here." />}
        </section>
      </div>}
    </div>
  </div>;

}

function Record({ title, meta, onEdit, onDelete }: { title: string; meta: string; onEdit?: () => void; onDelete?: () => void }) {
  return <article className="nv-record"><span className="nv-record-icon"><FileText size={17} /></span><div><strong>{title}</strong><small>{meta || "Details not provided"}</small></div>{onEdit && <button className="nv-icon-action" onClick={onEdit} aria-label={"Edit " + title}><Pencil size={16} /></button>}{onDelete && <button className="nv-icon-action danger" onClick={onDelete} aria-label={"Remove " + title}><Trash2 size={16} /></button>}</article>;
}
function EmptyState({ title, text, action, actionLabel }: { title: string; text: string; action?: () => void; actionLabel?: string }) {
  return <div className="nv-empty"><span><Sparkles size={21} /></span><h3>{title}</h3><p>{text}</p>{action && <button className="nv-text-action" onClick={action}>{actionLabel || "Continue"} <ArrowRight size={14} /></button>}</div>;
}
