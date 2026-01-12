// src/pages/transactions/TransactionsPage.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./TransactionsPage.module.scss";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faPen,
  faTrash,
  faArrowRotateRight,
  faMagnifyingGlass,
  faFilter,
  faCircleInfo,
} from "@fortawesome/free-solid-svg-icons";

import type { Transaction } from "../../types/transaction";
import { ApiError } from "../../types/api";
import { createTransaction, deleteTransaction, listTransactions, updateTransaction } from "../../services/transactionsService";
import TableSkeleton from "../../components/skeleton/TableSkeleton";
import ConfirmModal from "../../components/modal/ConfirmModal";
import TransactionFormModal from "./TransactionFormModal";
import { useToast } from "../../components/toast/ToastProvider";

function formatMoney(amountCents: number, currency: "USD" | "IDR") {
  const value = amountCents / 100;
  try {
    return new Intl.NumberFormat(currency === "IDR" ? "id-ID" : "en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: currency === "IDR" ? 0 : 2,
      maximumFractionDigits: currency === "IDR" ? 0 : 2,
    }).format(value);
  } catch {
    return currency === "IDR" ? `Rp ${value}` : `$${value.toFixed(2)}`;
  }
}

function debounce<T extends (...args: any[]) => void>(fn: T, ms: number) {
  let t: any;
  return (...args: Parameters<T>) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

export default function TransactionsPage() {
  const toast = useToast();

  // filters (API)
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [type, setType] = useState<"" | "income" | "expense">("");
  const [category, setCategory] = useState<string>("");
  const [dialysis, setDialysis] = useState<"" | "true" | "false">("");

  // live search (client-side, no button)
  const [search, setSearch] = useState("");

  const [items, setItems] = useState<Transaction[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);

  const [deleteTx, setDeleteTx] = useState<Transaction | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((t) => {
      const hay = `${t.category ?? ""} ${t.note ?? ""} ${t.type ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, search]);

  async function fetchPage(opts: { reset: boolean; cursor?: string | null }) {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setLoading(true);
    setErrorMsg(null);

    // skeleton dibuat "lebih lama"
    const MIN_SKELETON_MS = opts.reset ? 900 : 650;

    try {
      const res = await listTransactions({
        from: from || undefined,
        to: to || undefined,
        type: type || undefined,
        category: category.trim() || undefined,
        dialysis: dialysis === "" ? undefined : dialysis === "true",
        limit: 20,
        cursor: opts.cursor ?? undefined,
        signal: ac.signal,
        minDelayMs: MIN_SKELETON_MS,
      });

      const page = res.data ?? [];
      const meta = res.meta;

      setNextCursor(meta?.nextCursor ?? null);

      if (opts.reset) setItems(page);
      else setItems((prev) => [...prev, ...page]);

      setInitialLoading(false);
    } catch (err: any) {
      if (err?.name === "AbortError") return;

      setInitialLoading(false);

      const message =
        err instanceof ApiError
          ? err.message
          : "Something went wrong. Please try again.";

      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  }

  // initial load
  useEffect(() => {
    fetchPage({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // refetch on filter change (debounced)
  // NOTE: search tidak ikut (client-side)
  useEffect(() => {
    const run = debounce(() => {
      fetchPage({ reset: true });
    }, 350);

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, type, category, dialysis]);

  async function onCreate(payload: any) {
    try {
      await createTransaction(payload);
      toast.push({ type: "success", message: "Saved." });
      await fetchPage({ reset: true });
    } catch (err: any) {
      const msg = err instanceof ApiError ? err.message : "We couldn’t save that change. Check your connection and try again.";
      toast.push({ type: "error", message: msg });
      throw err;
    }
  }

  async function onEdit(id: string, payload: any) {
    try {
      await updateTransaction(id, payload);
      toast.push({ type: "success", message: "Saved." });
      await fetchPage({ reset: true });
    } catch (err: any) {
      const msg = err instanceof ApiError ? err.message : "We couldn’t save that change. Check your connection and try again.";
      toast.push({ type: "error", message: msg });
      throw err;
    }
  }

  async function onDeleteConfirm() {
    if (!deleteTx) return;
    setDeleteLoading(true);
    try {
      await deleteTransaction(deleteTx.id);
      toast.push({ type: "success", message: "Saved." });
      setDeleteTx(null);

      // update local list cepat + sync ringan
      setItems((prev) => prev.filter((x) => x.id !== deleteTx.id));
      // optional: refetch to ensure cursor list consistent
      await fetchPage({ reset: true });
    } catch (err: any) {
      const msg = err instanceof ApiError ? err.message : "Something went wrong. Please try again.";
      toast.push({ type: "error", message: msg });
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className={styles.wrap}>
      <header className={styles.top}>
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>Transactions</h1>
          <p className={styles.subtitle}>Track income and expenses with clarity.</p>
        </div>

        <div className={styles.topActions}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setCreateOpen(true)}
          >
            <FontAwesomeIcon icon={faPlus} />
            Add transaction
          </button>

          <button
            type="button"
            className="btn"
            onClick={() => fetchPage({ reset: true })}
            disabled={loading}
            aria-label="Refresh"
          >
            <FontAwesomeIcon icon={faArrowRotateRight} />
            Refresh
          </button>
        </div>
      </header>

      {/* Filters */}
      <section className={styles.filters} aria-label="Filters">
        <div className={styles.filtersRow}>
          <div className={styles.searchWrap}>
            <FontAwesomeIcon icon={faMagnifyingGlass} className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              placeholder="Search category or note…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className={styles.filterGroup}>
            <div className={styles.filterLabel}>
              <FontAwesomeIcon icon={faFilter} /> Filters
            </div>

            <div className={styles.controls}>
              <div className={styles.control}>
                <label>From</label>
                <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              </div>

              <div className={styles.control}>
                <label>To</label>
                <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
              </div>

              <div className={styles.control}>
                <label>Type</label>
                <select value={type} onChange={(e) => setType(e.target.value as any)}>
                  <option value="">All</option>
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>

              <div className={styles.control}>
                <label>Category</label>
                <input
                  placeholder="Any"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  maxLength={60}
                />
              </div>

              <div className={styles.control}>
                <label>Dialysis</label>
                <select value={dialysis} onChange={(e) => setDialysis(e.target.value as any)}>
                  <option value="">All</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
            </div>

            <div className={styles.hint}>
              <FontAwesomeIcon icon={faCircleInfo} />
              Live search filters the loaded results. Date/type/category/dialysis filters refetch from server.
            </div>
          </div>
        </div>
      </section>

      {/* States */}
      {initialLoading ? (
        <TableSkeleton rows={7} />
      ) : errorMsg ? (
        <div className={styles.stateCard} role="alert">
          <div className={styles.stateTitle}>Something went wrong.</div>
          <div className={styles.stateText}>{errorMsg}</div>
          <button type="button" className="btn btn-primary" onClick={() => fetchPage({ reset: true })}>
            Try again
          </button>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className={styles.stateCard}>
          <div className={styles.stateTitle}>No transactions yet</div>
          <div className={styles.stateText}>
            No transactions yet. Add your first one to start tracking your month.
          </div>
          <button type="button" className="btn btn-primary" onClick={() => setCreateOpen(true)}>
            <FontAwesomeIcon icon={faPlus} />
            Add transaction
          </button>
        </div>
      ) : (
        <>
          <section className={styles.tableWrap} aria-label="Transactions list">
            <div className={styles.tableHeader}>
              <div>Date</div>
              <div>Category</div>
              <div>Type</div>
              <div>Amount</div>
              <div className={styles.actionsCol}>Actions</div>
            </div>

            {loading ? (
              <div className={styles.inlineLoading}>Loading…</div>
            ) : null}

            <div className={styles.tableBody}>
              {filteredItems.map((t) => {
                const isExpense = t.type === "expense";
                const amount = formatMoney(t.amountCents, t.currency ?? "USD");

                return (
                  <div key={t.id} className={styles.row}>
                    <div className={styles.cell} data-label="Date">
                      {t.date}
                      {t.isDialysisRelated ? <span className={styles.badge}>Dialysis</span> : null}
                    </div>

                    <div className={styles.cell} data-label="Category">
                      <div className={styles.primary}>{t.category}</div>
                      {t.note ? <div className={styles.secondary}>{t.note}</div> : null}
                    </div>

                    <div className={styles.cell} data-label="Type">
                      <span className={`${styles.pill} ${isExpense ? styles.pillExpense : styles.pillIncome}`}>
                        {isExpense ? "Expense" : "Income"}
                      </span>
                    </div>

                    <div className={styles.cell} data-label="Amount">
                      <span className={isExpense ? styles.amountNeg : styles.amountPos}>
                        {isExpense ? `-${amount}` : `+${amount}`}
                      </span>
                    </div>

                    <div className={`${styles.cell} ${styles.actions}`} data-label="Actions">
                      <button
                        type="button"
                        className={styles.iconBtn}
                        aria-label="Edit"
                        onClick={() => setEditTx(t)}
                      >
                        <FontAwesomeIcon icon={faPen} />
                      </button>
                      <button
                        type="button"
                        className={`${styles.iconBtn} ${styles.danger}`}
                        aria-label="Delete"
                        onClick={() => setDeleteTx(t)}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Pagination */}
          <div className={styles.pagination}>
            <div className={styles.count}>
              Showing <b>{filteredItems.length}</b> {search.trim() ? "(filtered)" : ""} items
            </div>

            {nextCursor ? (
              <button
                type="button"
                className="btn"
                disabled={loading}
                onClick={() => fetchPage({ reset: false, cursor: nextCursor })}
              >
                Load more
              </button>
            ) : (
              <div className={styles.end}>You’re all caught up.</div>
            )}
          </div>
        </>
      )}

      {/* Modals */}
      <TransactionFormModal
        open={createOpen}
        mode="create"
        onClose={() => setCreateOpen(false)}
        onSubmit={onCreate}
      />

      <TransactionFormModal
        open={!!editTx}
        mode="edit"
        initial={editTx}
        onClose={() => setEditTx(null)}
        onSubmit={(payload) => onEdit(editTx!.id, payload)}
      />

      <ConfirmModal
        open={!!deleteTx}
        title="Delete transaction?"
        description={
          deleteTx
            ? `This will remove "${deleteTx.category}" on ${deleteTx.date}. You can’t undo this action.`
            : ""
        }
        confirmText="Delete"
        cancelText="Cancel"
        danger
        loading={deleteLoading}
        onConfirm={onDeleteConfirm}
        onClose={() => !deleteLoading && setDeleteTx(null)}
      />
    </div>
  );
}