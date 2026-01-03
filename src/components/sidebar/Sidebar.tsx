// src/components/sidebar/Sidebar.tsx
import { NavLink } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTableCells,
  faRightLeft,
  faWallet,
  faArrowsRotate,
  faChartColumn,
  faFileArrowDown,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

import styles from "./Sidebar.module.scss";

type Props = {
  isOpen?: boolean; // mobile
  onClose?: () => void;
};

export default function Sidebar({ isOpen = false, onClose }: Props) {
  const links = [
    { to: "/app/dashboard", label: "Dashboard", icon: faTableCells },
    { to: "/app/transactions", label: "Transactions", icon: faRightLeft },
    { to: "/app/budgets", label: "Budgets", icon: faWallet },
    { to: "/app/recurring", label: "Recurring", icon: faArrowsRotate },
    { to: "/app/analytics", label: "Analytics", icon: faChartColumn },
    { to: "/app/export", label: "Export", icon: faFileArrowDown },
  ];

  return (
    <>
      {/* overlay (mobile) */}
      <div
        className={`${styles.overlay} ${isOpen ? styles.overlayOpen : ""}`}
        onClick={onClose}
        aria-hidden={!isOpen}
      />

      <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ""}`}>
        <div className={styles.mobileTop}>
          <div className={styles.menuLabel}>MENU</div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close menu">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <nav className={styles.nav}>
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `${styles.link} ${isActive ? styles.active : ""}`
              }
              end
            >
              <span className={styles.icon} aria-hidden="true">
                <FontAwesomeIcon icon={l.icon} />
              </span>
              <span className={styles.text}>{l.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}