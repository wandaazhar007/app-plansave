// src/components/auth/AuthSplitLayout.tsx
import styles from "./AuthSplitLayout.module.scss";

type Props = {
  variant?: "split" | "centered";
  leftTitle?: string;
  leftSubtitle?: string;
  children: React.ReactNode;
};

export default function AuthSplitLayout({
  variant = "split",
  leftTitle = "PlanSave",
  leftSubtitle = "A clearer way to track spending and dialysis expenses.",
  children,
}: Props) {
  if (variant === "centered") {
    return (
      <div className={styles.centeredWrap}>
        <div className={styles.centeredInner}>{children}</div>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <aside className={styles.left}>
        <div className={styles.leftInner}>
          <div className={styles.logoCircle} aria-hidden="true">
            <img
              className={styles.logoImg}
              src="/navbar-logo-plansave.png"
              alt=""
            />
          </div>

          <h2 className={styles.brand}>{leftTitle}</h2>
          <p className={styles.tagline}>{leftSubtitle}</p>
        </div>
      </aside>

      <main className={styles.right}>
        <div className={styles.rightInner}>{children}</div>
      </main>
    </div>
  );
}