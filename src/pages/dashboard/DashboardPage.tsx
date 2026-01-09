// src/pages/dashboard/DashboardPage.tsx
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faWallet,
  faArrowTrendUp,
  faArrowTrendDown,
  faDollarSign,
} from "@fortawesome/free-solid-svg-icons";

import styles from "./DashboardPage.module.scss";

function formatUSD(value: number) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `$${value.toFixed(2)}`;
  }
}

type Stat = {
  label: string;
  value: number;
  change: number; // percent
  icon: any;
  kind: "up" | "down";
};

type Tx = {
  title: string;
  meta: string;
  amount: number;
};

export default function DashboardPage() {
  const stats: Stat[] = [
    {
      label: "Total Balance",
      value: 12450,
      change: 2.5,
      icon: faWallet,
      kind: "up",
    },
    {
      label: "Income",
      value: 4200,
      change: 12.3,
      icon: faArrowTrendUp,
      kind: "up",
    },
    {
      label: "Expenses",
      value: 2840,
      change: -3.2,
      icon: faArrowTrendDown,
      kind: "down",
    },
    {
      label: "Savings",
      value: 1360,
      change: 8.1,
      icon: faDollarSign,
      kind: "up",
    },
  ];

  const recent: Tx[] = [
    { title: "Grocery Store", meta: "Today • Food", amount: -85.5 },
    { title: "Salary Deposit", meta: "Yesterday • Income", amount: 4200 },
    { title: "Netflix Subscription", meta: "Jan 1 • Entertainment", amount: -15.99 },
    { title: "Electric Bill", meta: "Dec 30 • Utilities", amount: -120.0 },
  ];

  return (
    // ✅ supaya sejajar dengan navbar (max-width + padding yang sama)
    <div className="container page">
      <div className={styles.wrap}>
        <header className={styles.header}>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.subtitle}>
            Welcome back! Here's your financial overview.
          </p>
        </header>

        <section className={styles.statsGrid} aria-label="Summary cards">
          {stats.map((s) => (
            <div key={s.label} className={styles.statCard}>
              <div className={styles.statTop}>
                <div className={styles.statLabel}>{s.label}</div>
                <div className={styles.statIcon} aria-hidden="true">
                  <FontAwesomeIcon icon={s.icon} />
                </div>
              </div>

              <div className={styles.statValue}>{formatUSD(s.value)}</div>

              <div className={styles.statChange}>
                <span className={s.kind === "down" ? styles.changeDown : styles.changeUp}>
                  {s.change > 0 ? `+${s.change}%` : `${s.change}%`} from last month
                </span>
              </div>
            </div>
          ))}
        </section>

        <section className={styles.recentCard} aria-label="Recent transactions">
          <div className={styles.recentHeader}>
            <h2 className={styles.recentTitle}>Recent Transactions</h2>
            <p className={styles.recentSubtitle}>Your latest financial activities</p>
          </div>

          <div className={styles.txList}>
            {recent.map((t) => (
              <div key={t.title + t.meta} className={styles.txRow}>
                <div className={styles.txLeft}>
                  <div className={styles.txTitle}>{t.title}</div>
                  <div className={styles.txMeta}>{t.meta}</div>
                </div>

                <div className={t.amount >= 0 ? styles.txAmountPos : styles.txAmountNeg}>
                  {t.amount >= 0
                    ? `+${formatUSD(t.amount)}`
                    : `-${formatUSD(Math.abs(t.amount))}`}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}