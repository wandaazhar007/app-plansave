// src/pages/transactions/TransactionsPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faTrash,
  faPenToSquare,
  faFilter,
  faRotateRight,
  faChevronDown,
  faArrowRotateLeft,
} from "@fortawesome/free-solid-svg-icons";

import { useAuth } from "../../lib/auth/useAuth";
import { useToast } from "../../components/toast/ToastProvider";

import type { Transaction } from "../../types/transaction";
import { listTransactions, deleteTransaction } from "../../services/transactionsService";

import ConfirmDeleteModal from "../../components/confirmDeleteModal/ConfirmDeleteModal";
import styles from "./TransactionsPage.module.scss";

type Filters = {
  q: string;
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
};

type RedirectToast = {
  type: "success" | "error" | "info";
  title?: string;
  message: string;
};

type Summary = {
  incomeCents: number;
  expenseCents: number;
  balanceCents: number;
  rangeLabel: string;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toYmd(d: Date) {
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  return `${y}-${m}-${day}`;
}

function daysAgoYmd(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return toYmd(d);
}

function todayYmd() {
  return toYmd(new Date());
}

function formatMoney(amountCents: number, currency: "USD" | "IDR") {
  const value = amountCents / 100;

  try {
    return new Intl.NumberFormat(currency === "IDR" ? "id-ID" : "en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: currency === "IDR" ? 0 : 2,
      minimumFractionDigits: currency === "IDR" ? 0 : 2,
    }).format(value);
  } catch {
    return currency === "IDR" ? `Rp ${value}` : `$${value}`;
  }
}

export default function TransactionsPage() {
  const { getAccessToken } = useAuth();
  const { push } = useToast();

  const navigate = useNavigate();
  const location = useLocation();

  // UI (default: CLOSED)
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Data (list)
  const [items, setItems] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ cursor should come from res.meta.nextCursor
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  // search skeleton
  const [searching, setSearching] = useState(false);

  const [filters, setFilters] = useState<Filters>({
    q: "",
    from: "",
    to: "",
  });

  const [debouncedQ, setDebouncedQ] = useState(filters.q);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  // List limit (kamu set 3)
  const [pageLimit] = useState(3);
  const hasDateFilter = !!filters.from || !!filters.to;

  // Summary
  const [summary, setSummary] = useState<Summary>({
    incomeCents: 0,
    expenseCents: 0,
    balanceCents: 0,
    rangeLabel: "Last 30 days",
  });
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // live search debounce + skeleton
  useEffect(() => {
    setSearching(true);

    const t = window.setTimeout(() => {
      setDebouncedQ(filters.q);
      window.setTimeout(() => setSearching(false), 450);
    }, 250);

    return () => window.clearTimeout(t);
  }, [filters.q]);

  // client-side live search
  const visibleItems = useMemo(() => {
    const q = debouncedQ.trim().toLowerCase();
    if (!q) return items;

    return items.filter((tx) => {
      const hay = `${tx.category ?? ""} ${tx.note ?? ""} ${tx.type ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, debouncedQ]);

  async function fetchFirst() {
    setLoading(true);
    setError(null);

    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Missing auth token.");

      const res: any = await listTransactions({
        token,
        limit: pageLimit,
        cursor: undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
      });

      setItems(res.data || []);

      // ✅ FIX: cursor from meta.nextCursor
      setNextCursor(res?.meta?.nextCursor ?? null);
    } catch (e: any) {
      setError(e?.message || "Failed to load transactions.");
    } finally {
      setLoading(false);
    }
  }

  async function loadMore() {
    // ✅ if nextCursor is null, no more pages
    if (!nextCursor) return;

    setLoadingMore(true);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Missing auth token.");

      const res: any = await listTransactions({
        token,
        limit: pageLimit,
        cursor: nextCursor,
        from: filters.from || undefined,
        to: filters.to || undefined,
      });

      setItems((prev) => [...prev, ...(res.data || [])]);

      // ✅ FIX: cursor from meta.nextCursor
      setNextCursor(res?.meta?.nextCursor ?? null);
    } catch (e: any) {
      push({ type: "error", title: "Failed", message: e?.message || "Failed to load more." });
    } finally {
      setLoadingMore(false);
    }
  }

  // Summary fetch (accurate by paging all data in range)
  async function fetchSummary() {
    setSummaryLoading(true);
    setSummaryError(null);

    const token = await getAccessToken();
    if (!token) {
      setSummaryLoading(false);
      setSummaryError("Missing auth token.");
      return;
    }

    const from = filters.from || daysAgoYmd(30);
    const to = filters.to || todayYmd();

    const rangeLabel =
      filters.from || filters.to
        ? `Range: ${filters.from || from} → ${filters.to || to}`
        : "Last 30 days";

    try {
      let cursor: string | undefined = undefined;
      let incomeCents = 0;
      let expenseCents = 0;

      const MAX_PAGES = 50;
      let pages = 0;

      while (pages < MAX_PAGES) {
        pages += 1;

        const res: any = await listTransactions({
          token,
          limit: 100,
          cursor,
          from,
          to,
        });

        const data: Transaction[] = res.data || [];
        for (const tx of data) {
          if (tx.type === "income") incomeCents += Math.abs(tx.amountCents);
          else expenseCents += Math.abs(tx.amountCents);
        }

        // ✅ FIX: cursor from meta.nextCursor
        const nc: string | null = res?.meta?.nextCursor ?? null;
        if (!nc) break;
        cursor = nc;
      }

      setSummary({
        incomeCents,
        expenseCents,
        balanceCents: incomeCents - expenseCents,
        rangeLabel,
      });
    } catch (e: any) {
      setSummaryError(e?.message || "Failed to calculate totals.");
    } finally {
      setSummaryLoading(false);
    }
  }

  // refetch list on From/To
  useEffect(() => {
    fetchFirst();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.from, filters.to]);

  // refetch summary on From/To
  useEffect(() => {
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.from, filters.to]);

  // toast + refresh after redirect from form page
  useEffect(() => {
    const st = location.state as { refresh?: boolean; toast?: RedirectToast } | null;

    if (st?.toast) {
      push({ type: st.toast.type, title: st.toast.title, message: st.toast.message });
    }

    if (st?.refresh) {
      fetchFirst();
      fetchSummary();
    }

    if (st?.toast || st?.refresh) {
      navigate(".", { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  function goCreate() {
    navigate("/app/transactions/form-transaction", { state: { mode: "create" } });
  }

  function goEdit(tx: Transaction) {
    navigate("/app/transactions/form-transaction", { state: { mode: "edit", initial: tx } });
  }

  function askDelete(id: string) {
    setDeletingId(id);
    setConfirmOpen(true);
  }

  async function confirmDelete() {
    if (!deletingId) return;

    const token = await getAccessToken();
    if (!token) {
      push({ type: "error", title: "Session expired", message: "Please sign in again." });
      return;
    }

    setDeleteBusy(true);
    try {
      await deleteTransaction({ token, id: deletingId });

      push({ type: "success", title: "Deleted", message: "Transaction deleted successfully." });

      setConfirmOpen(false);
      setDeletingId(null);

      await fetchFirst();
      await fetchSummary();
    } catch (e: any) {
      push({ type: "error", title: "Failed", message: e?.message || "Failed to delete transaction." });
    } finally {
      setDeleteBusy(false);
    }
  }

  function onResetDates() {
    setFilters((f) => ({ ...f, from: "", to: "" }));
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.topbar}>
        <div className={styles.heading}>
          <h1 className={styles.title}>Transactions</h1>
          <p className={styles.subtitle}>
            Keep it simple. Add what happened—PlanSave will help you stay on track.
          </p>
        </div>

        <div className={styles.topActions} aria-label="Top actions">
          <button type="button" className="btn" onClick={fetchFirst} disabled={loading}>
            <FontAwesomeIcon icon={faRotateRight} />
            Refresh
          </button>

          <button type="button" className="btn btn-primary" onClick={goCreate}>
            <FontAwesomeIcon icon={faPlus} />
            Add
          </button>

          <button
            type="button"
            className={`btn ${styles.filterBtn}`}
            onClick={() => setFiltersOpen((v) => !v)}
            aria-expanded={filtersOpen}
            aria-controls="tx-filters"
          >
            <FontAwesomeIcon icon={faFilter} />
            Filter
            <FontAwesomeIcon icon={faChevronDown} className={filtersOpen ? styles.chevUp : ""} />
          </button>
        </div>
      </div>

      {/* Search row */}
      <div className={styles.searchRow}>
        <input
          className={styles.search}
          value={filters.q}
          onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
          placeholder="Live search…"
        />
      </div>

      {/* Summary always visible */}
      <section className={`card ${styles.summaryBox}`} aria-label="Summary totals">
        <div className={styles.summaryTop}>
          <div className={styles.summaryTitle}>Summary</div>
          <div className={styles.summaryRange}>{summary.rangeLabel}</div>
        </div>

        {summaryError ? (
          <div className={styles.summaryError}>{summaryError}</div>
        ) : (
          <div className={styles.summaryGrid}>
            <div className={`card ${styles.summaryCard}`}>
              <div className={styles.summaryLabel}>Expenses</div>
              <div className={styles.summaryValueExpense}>
                {summaryLoading ? "Loading…" : `-${formatMoney(summary.expenseCents, "USD")}`}
              </div>
            </div>

            <div className={`card ${styles.summaryCard}`}>
              <div className={styles.summaryLabel}>Income</div>
              <div className={styles.summaryValueIncome}>
                {summaryLoading ? "Loading…" : `+${formatMoney(summary.incomeCents, "USD")}`}
              </div>
            </div>

            <div className={`card ${styles.summaryCard}`}>
              <div className={styles.summaryLabel}>Balance</div>
              <div className={summary.balanceCents >= 0 ? styles.summaryValueIncome : styles.summaryValueExpense}>
                {summaryLoading
                  ? "Loading…"
                  : `${summary.balanceCents >= 0 ? "+" : "-"}${formatMoney(
                    Math.abs(summary.balanceCents),
                    "USD"
                  )}`}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Filters panel */}
      {filtersOpen ? (
        <section id="tx-filters" className={`card ${styles.filters}`} aria-label="Filters">
          <div className={styles.filtersGrid}>
            <div className="field">
              <label className="label">From</label>
              <input
                type="date"
                className={styles.input}
                value={filters.from}
                onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
              />
            </div>

            <div className="field">
              <label className="label">To</label>
              <input
                type="date"
                className={styles.input}
                value={filters.to}
                onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
              />
            </div>

            <div className={styles.resetSlot}>
              {hasDateFilter ? (
                <button type="button" className={`btn ${styles.resetBtn}`} onClick={onResetDates}>
                  <FontAwesomeIcon icon={faArrowRotateLeft} />
                  Reset
                </button>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {/* Table */}
      <section className={`card ${styles.tableCard}`} aria-label="Transactions table">
        <div className={styles.tableHead}>
          <h2 className={styles.tableTitle}>List</h2>
          <p className={styles.tableSub}>Showing {visibleItems.length} item(s).</p>
        </div>

        {error ? (
          <div className={styles.state}>
            <div className={styles.stateTitle}>Something went wrong</div>
            <div className={styles.stateText}>{error}</div>
            <button className="btn btn-primary" onClick={fetchFirst}>
              Try again
            </button>
          </div>
        ) : loading || searching ? (
          <div className={styles.skeletonWrap} aria-label="Loading">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={styles.skeletonRow} />
            ))}
          </div>
        ) : visibleItems.length === 0 ? (
          <div className={styles.state}>
            <div className={styles.stateTitle}>No transactions yet</div>
            <div className={styles.stateText}>Add your first transaction—small steps add up.</div>
            <button className="btn btn-primary" onClick={goCreate}>
              <FontAwesomeIcon icon={faPlus} />
              Add transaction
            </button>
          </div>
        ) : (
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Note</th>
                  <th className={styles.right}>Amount</th>
                  <th className={styles.actionsCol}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {visibleItems.map((tx) => {
                  const currency = (tx.currency || "USD") as "USD" | "IDR";
                  const isIncome = tx.type === "income";
                  const sign = isIncome ? "+" : "-";
                  const signedAmount = `${sign}${formatMoney(Math.abs(tx.amountCents), currency)}`;

                  return (
                    <tr key={tx.id}>
                      <td>{tx.date}</td>

                      <td className={isIncome ? styles.typeIncome : styles.typeExpense}>{tx.type}</td>

                      <td>{tx.category}</td>

                      <td className={styles.note}>{tx.note || "-"}</td>

                      <td className={`${styles.right} ${isIncome ? styles.amountIncome : styles.amountExpense}`}>
                        {signedAmount}
                      </td>

                      <td className={styles.actionsCol}>
                        <button className={`btn ${styles.rowBtn}`} onClick={() => goEdit(tx)}>
                          <FontAwesomeIcon icon={faPenToSquare} />
                        </button>
                        <button
                          className={`btn ${styles.rowBtn} ${styles.deleteBtn}`}
                          onClick={() => askDelete(tx.id)}
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Load more should now work because nextCursor is from meta */}
        {!loading && !error && items.length > 0 ? (
          <div className={styles.pagination}>
            <button
              type="button"
              className="btn"
              onClick={loadMore}
              disabled={!nextCursor || loadingMore}
            >
              {loadingMore ? "Loading..." : nextCursor ? "Load more" : "No more"}
            </button>
          </div>
        ) : null}
      </section>

      <ConfirmDeleteModal
        open={confirmOpen}
        onCancel={() => {
          if (deleteBusy) return;
          setConfirmOpen(false);
          setDeletingId(null);
        }}
        onConfirm={confirmDelete}
        busy={deleteBusy}
      />
    </div>
  );
}