import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { pageHref } from "../../lib/jobs/filters";
import styles from "./jobs.module.css";

function pageWindow(current: number, total: number): (number | "gap")[] {
  const wanted = new Set([1, total, current - 1, current, current + 1]);
  if (current <= 3) [2, 3, 4].forEach((page) => wanted.add(page));
  if (current >= total - 2) [total - 1, total - 2, total - 3].forEach((page) => wanted.add(page));
  const pages = [...wanted].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);
  return pages.flatMap((page, index) => (index > 0 && page - pages[index - 1] > 1 ? ["gap" as const, page] : [page]));
}

export default function Pagination({ path, params, page, totalPages }: { path: string; params: Record<string, string>; page: number; totalPages: number }) {
  if (totalPages <= 1) return null;
  const step = (target: number, label: string, disabled: boolean, children: React.ReactNode) => (
    <Link
      href={pageHref(path, params, target)}
      className={`${styles.pageLink} ${styles.pageStep} ${disabled ? styles.pageDisabled : ""}`}
      aria-label={label}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : undefined}
      scroll
    >
      {children}
    </Link>
  );

  return (
    <nav className={styles.pagination} aria-label="Pagination">
      {step(page - 1, "Previous page", page <= 1, <><ChevronLeft size={16} aria-hidden />Prev</>)}
      {pageWindow(page, totalPages).map((item, index) =>
        item === "gap" ? (
          <span key={`gap-${index}`} className={styles.pageGap} aria-hidden>…</span>
        ) : (
          <Link
            key={item}
            href={pageHref(path, params, item)}
            className={`${styles.pageLink} ${item === page ? styles.pageCurrent : ""}`}
            aria-label={`Page ${item}`}
            aria-current={item === page ? "page" : undefined}
          >
            {item}
          </Link>
        )
      )}
      {step(page + 1, "Next page", page >= totalPages, <>Next<ChevronRight size={16} aria-hidden /></>)}
    </nav>
  );
}
