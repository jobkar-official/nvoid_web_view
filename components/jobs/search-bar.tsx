import { ArrowRight, MapPin, Search } from "lucide-react";
import Form from "next/form";
import styles from "./jobs.module.css";

export default function SearchBar({ role, location }: { role: string; location: string }) {
  return (
    <Form action="/job-search" className={styles.searchBar} key={`${role}|${location}`}>
      <label className={styles.searchField}>
        <span className={styles.fieldLabel}>Job title or skill</span>
        <span className={styles.inputRow}>
          <Search size={18} aria-hidden />
          <input name="role" defaultValue={role} placeholder="e.g. Java Developer" maxLength={120} autoComplete="off" />
        </span>
      </label>
      <span className={styles.divider} aria-hidden />
      <label className={styles.searchField}>
        <span className={styles.fieldLabel}>Location</span>
        <span className={styles.inputRow}>
          <MapPin size={18} aria-hidden />
          <input name="location" defaultValue={location} placeholder="City, country or remote" maxLength={120} autoComplete="off" />
        </span>
      </label>
      <button type="submit" className={styles.primary}>
        Search jobs <ArrowRight size={16} aria-hidden />
      </button>
    </Form>
  );
}
