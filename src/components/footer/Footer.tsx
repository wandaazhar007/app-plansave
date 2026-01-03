// src/components/footer/Footer.tsx
import styles from "./Footer.module.scss";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.left}>© {year} Plansave. All rights reserved.</div>

        <div className={styles.right}>
          Build with ❤️ by{" "}
          <a
            href="https://wandaazhar.vercel.app"
            target="_blank"
            rel="noreferrer"
            className={styles.link}
          >
            Wanda Azhar
          </a>{" "}
          in Detroit, MI. USA
        </div>
      </div>
    </footer>
  );
}