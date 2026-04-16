// src/pages/dashboard/DashboardPage.tsx
import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faWallet,
  faArrowTrendUp,
  faArrowTrendDown,
  faDollarSign,
} from "@fortawesome/free-solid-svg-icons";

import styles from "./DashboardPage.module.scss";
import { useAuth } from "../../lib/auth/useAuth";
import { fetchRecentTransactionsRange } from "../../services/dashboardService";
import type { Transaction } from "../../types/transaction";

function formatUSDFromCents(cents: number) {
  const value = cents / 100;
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

function formatDateLabel(ymd?: string) {
  // ymd expected "YYYY-MM-DD"
  if (!ymd) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) return ymd;
  const [, yyyy, mm, dd] = m;
  return `${mm}-${dd}-${yyyy}`;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toYmd(d: Date) {
  const yyyy = d.getFullYear();
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  return `${yyyy}-${mm}-${dd}`;
}

function daysAgoYmd(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return toYmd(d);
}

type Stat = {
  label: string;
  valueCents: number;
  changePct: number; // percent
  icon: any;
  kind: "up" | "down";
};

type TxRow = {
  title: string;
  meta: string;
  amountCents: number; // signed
  type: "income" | "expense";
};

function safeAmountCents(tx: Transaction): number {
  const anyTx: any = tx as any;
  if (typeof anyTx.amountCents === "number") return anyTx.amountCents;
  if (typeof anyTx.amount === "number") return Math.round(anyTx.amount * 100);
  return 0;
}

function percentChange(current: number, previous: number) {
  if (previous === 0) {
    if (current === 0) return 0;
    return 100;
  }
  return ((current - previous) / Math.abs(previous)) * 100;
}

export default function DashboardPage() {
  const { getAccessToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<Stat[]>([]);
  const [recent, setRecent] = useState<TxRow[]>([]);

  useEffect(() => {
    const controller = new AbortController();

    async function run() {
      setLoading(true);
      setError(null);

      try {
        // ✅ get token ONCE
        const token = await getAccessToken();
        if (!token) throw new Error("Missing auth token.");

        // ✅ backend max limit = 100
        const txs = await fetchRecentTransactionsRange({
          token,
          daysBack: 60,
          limit: 100,
          signal: controller.signal,
        });

        const from30 = daysAgoYmd(30);
        const from60 = daysAgoYmd(60);
        const toToday = toYmd(new Date());

        const last30 = txs.filter((t) => t.date >= from30 && t.date <= toToday);
        const prev30 = txs.filter((t) => t.date >= from60 && t.date < from30);

        const sum = (arr: Transaction[], type: "income" | "expense") => {
          let total = 0;
          for (const tx of arr) {
            if (tx.type !== type) continue;
            total += Math.abs(safeAmountCents(tx));
          }
          return total;
        };

        const income30 = sum(last30, "income");
        const expense30 = sum(last30, "expense");
        const balance30 = income30 - expense30;

        const incomePrev = sum(prev30, "income");
        const expensePrev = sum(prev30, "expense");
        const balancePrev = incomePrev - expensePrev;

        const nextStats: Stat[] = [
          {
            label: "Total Balance",
            valueCents: balance30,
            changePct: percentChange(balance30, balancePrev),
            icon: faWallet,
            kind: balance30 >= balancePrev ? "up" : "down",
          },
          {
            label: "Income",
            valueCents: income30,
            changePct: percentChange(income30, incomePrev),
            icon: faArrowTrendUp,
            kind: income30 >= incomePrev ? "up" : "down",
          },
          {
            label: "Expenses",
            valueCents: expense30,
            changePct: percentChange(expense30, expensePrev),
            icon: faArrowTrendDown,
            kind: expense30 <= expensePrev ? "up" : "down",
          },
          {
            label: "Savings",
            valueCents: balance30,
            changePct: percentChange(balance30, balancePrev),
            icon: faDollarSign,
            kind: balance30 >= balancePrev ? "up" : "down",
          },
        ];

        const sorted = [...txs].sort((a, b) => {
          const ad = a.date || "";
          const bd = b.date || "";
          if (ad !== bd) return bd.localeCompare(ad);
          const ac = a.createdAt || "";
          const bc = b.createdAt || "";
          return bc.localeCompare(ac);
        });

        const nextRecent: TxRow[] = sorted.slice(0, 5).map((t) => {
          const cents = safeAmountCents(t);
          const isIncome = t.type === "income";
          return {
            title: t.category || "Transaction",
            meta: `${formatDateLabel(t.date)} • ${isIncome ? "Income" : "Expense"}`,
            amountCents: isIncome ? cents : -cents,
            type: t.type,
          };
        });

        setStats(nextStats);
        setRecent(nextRecent);
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setError(e?.message || "Failed to load dashboard.");
      } finally {
        setLoading(false);
      }
    }

    run();
    return () => controller.abort();
  }, [getAccessToken]);

  const content = useMemo(() => {
    if (error) {
      return (
        <div className={styles.wrap}>
          <section className={styles.recentCard}>
            <div className={styles.recentHeader}>
              <h2 className={styles.recentTitle}>Dashboard</h2>
              <p className={styles.recentSubtitle}>{error}</p>
            </div>
          </section>
        </div>
      );
    }

    if (loading) {
      return (
        <div className={styles.wrap}>
          <section className={styles.statsGrid} aria-label="Summary cards loading">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={styles.statCard} />
            ))}
          </section>

          <section className={styles.recentCard} aria-label="Recent transactions loading">
            <div className={styles.recentHeader}>
              <h2 className={styles.recentTitle}>Recent Transactions</h2>
              <p className={styles.recentSubtitle}>Loading…</p>
            </div>
          </section>
        </div>
      );
    }

    return (
      <div className={styles.wrap}>
        <header className={styles.header}>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.subtitle}>Welcome back! Here's your financial overview.</p>
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

              <div className={styles.statValue}>{formatUSDFromCents(s.valueCents)}</div>

              <div className={styles.statChange}>
                <span className={s.kind === "down" ? styles.changeDown : styles.changeUp}>
                  {s.changePct >= 0 ? `+${s.changePct.toFixed(1)}%` : `${s.changePct.toFixed(1)}%`} from last 30 days
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
            {recent.length === 0 ? (
              <div className={styles.txRow}>
                <div className={styles.txLeft}>
                  <div className={styles.txTitle}>No transactions yet</div>
                  <div className={styles.txMeta}>Add your first transaction to see activity here.</div>
                </div>
              </div>
            ) : (
              recent.map((t) => (
                <div key={t.title + t.meta + t.amountCents} className={styles.txRow}>
                  <div className={styles.txLeft}>
                    <div className={styles.txTitle}>{t.title}</div>
                    <div className={styles.txMeta}>{t.meta}</div>
                  </div>

                  <div className={t.amountCents >= 0 ? styles.txAmountPos : styles.txAmountNeg}>
                    {t.amountCents >= 0
                      ? `+${formatUSDFromCents(Math.abs(t.amountCents))}`
                      : `-${formatUSDFromCents(Math.abs(t.amountCents))}`}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    );
  }, [error, loading, recent, stats]);

  return <div className="container page">{content}</div>;
}