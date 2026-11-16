import styles from "../../../components/jobs/jobs.module.css";
import JobsSkeleton from "../../../components/jobs/skeleton";

export default function Loading() {
  return (
    <div className={styles.board}>
      <JobsSkeleton />
    </div>
  );
}
