import styles from "./jobs.module.css";

export default function JobsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className={styles.grid} aria-busy="true" aria-label="Loading jobs">
      {Array.from({ length: count }, (_, index) => <div key={index} className={styles.skeleton} />)}
    </div>
  );
}
