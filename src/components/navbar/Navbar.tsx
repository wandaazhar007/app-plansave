// src/components/navbar/Navbar.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faGear,
  faUser,
  faRightFromBracket,
} from "@fortawesome/free-solid-svg-icons";

import { useAuth } from "../../lib/auth/useAuth";
import styles from "./Navbar.module.scss";

type Props = {
  onToggleSidebar?: () => void;
};

export default function Navbar({ onToggleSidebar }: Props) {
  const navigate = useNavigate();

  // ASSUMPTION: useAuth() provides firebase user object
  const { logout, user } = useAuth() as {
    logout: () => Promise<void>;
    user?: { displayName?: string | null; email?: string | null } | null;
  };

  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const userLabel = useMemo(() => {
    const name = (user?.displayName ?? "").trim();
    if (name) return name;

    const email = (user?.email ?? "").trim();
    if (email && email.includes("@")) return email.split("@")[0];

    return "Account";
  }, [user?.displayName, user?.email]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current) return;
      if (menuRef.current.contains(e.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  async function onLogout() {
    setOpen(false);
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <header className={styles.navbar}>
      <div className={styles.inner}>
        <div className={styles.left}>
          <button
            type="button"
            className={styles.hamburger}
            onClick={onToggleSidebar}
            aria-label="Open menu"
          >
            <FontAwesomeIcon icon={faBars} />
          </button>

          <div
            className={styles.brand}
            onClick={() => navigate("/app/dashboard")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") navigate("/app/dashboard");
            }}
            aria-label="Go to dashboard"
          >
            <img
              className={styles.logo}
              src="/navbar-logo-plansave.png"
              alt="Plansave"
            />
            <span className={styles.title}>PLANSAVE</span>
          </div>
        </div>

        <div className={styles.right} ref={menuRef}>

          <button
            type="button"
            className={styles.profileBtn}
            aria-label="Account menu"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
          >
            <span className={styles.profileAvatar} aria-hidden="true">
              <FontAwesomeIcon icon={faUser} />
            </span>
            <span className={styles.profileName}>{userLabel}</span>
          </button>

          {open ? (
            <div className={styles.dropdown} role="menu" aria-label="Profile menu">
              <button
                type="button"
                className={styles.menuItem}
                onClick={() => {
                  setOpen(false);
                  navigate("/app/profile");
                }}
              >
                <span className={styles.menuIcon} aria-hidden="true">
                  <FontAwesomeIcon icon={faUser} />
                </span>
                <span>{userLabel}</span>
              </button>

              <button
                type="button"
                className={styles.menuItem}
                onClick={() => {
                  setOpen(false);
                  navigate("/app/settings");
                }}
              >
                <span className={styles.menuIcon} aria-hidden="true">
                  <FontAwesomeIcon icon={faGear} />
                </span>
                <span>Settings</span>
              </button>

              <div className={styles.divider} />

              <button
                type="button"
                className={`${styles.menuItem} ${styles.logout}`}
                onClick={onLogout}
              >
                <span className={styles.menuIcon} aria-hidden="true">
                  <FontAwesomeIcon icon={faRightFromBracket} />
                </span>
                <span>Logout</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}