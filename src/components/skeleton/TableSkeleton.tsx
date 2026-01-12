// src/components/skeleton/TableSkeleton.tsx
import styles from "./TableSkeleton.module.scss";

export default function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className={styles.wrap} aria-label="Loading transactions">
      <div className={styles.header}>
        <div className={styles.skel} />
        <div className={styles.skel} />
        <div className={styles.skel} />
      </div>

      <div className={styles.table}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className={styles.row}>
            <div className={styles.skel} />
            <div className={styles.skel} />
            <div className={styles.skel} />
            <div className={styles.skel} />
            <div className={styles.skel} />
          </div>
        ))}
      </div>
    </div>
  );
}