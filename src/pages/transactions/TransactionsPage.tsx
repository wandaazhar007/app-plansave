
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faTrash,
  faPenToSquare,
  faFilter,
  faRotateRight,
  faChevronDown,
} from "@fortawesome/free-solid-svg-icons";

import useMediaQuery from "../../lib/hooks/useMediaQuery";
import { useAuth } from "../../lib/auth/useAuth";

// import type { Transaction } from "./types";
import type { Transaction } from "../../types/transaction";
// import {
//   createTransaction,
//   deleteTransaction,
//   listTransactions,
//   updateTransaction,
// } from "./services/transactionsService";

import { listTransactions, createTransaction, updateTransaction, deleteTransaction } from "../../services/transactionsService";

// import FormTransaction from "./components/FormTransaction";
import FormTransaction from "../../components/formTransaction/FormTransaction";
// import ConfirmDeleteModal from "./components/ConfirmDeleteModal";
import ConfirmDeleteModal from "../../components/confirmDeleteModal/ConfirmDeleteModal";

import styles from "./TransactionsPage.module.scss";

type Filters = {
  q: string; // live search (client-side)
  from: string;
  to: string;
  type: "" | "income" | "expense";
  category: string;
  dialysis: "" | "true" | "false";
};

function formatMoney(amount: number, currency: "USD" | "IDR") {
  try {
    return new Intl.NumberFormat(currency === "IDR" ? "id-ID" : "en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: currency === "IDR" ? 0 : 2,
    }).format(amount);
  } catch {
    return currency === "IDR" ? `Rp ${amount}` : `$${amount}`;
  }
}

export default function TransactionsPage() {
  const isDesktop = useMediaQuery("(min-width: 76.8rem)"); // md breakpoint
  // const { getIdToken } = useAuth() as any;
  const { getAccessToken } = useAuth();
  // UI state
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [mode, setMode] = useState<"idle" | "create" | "edit">("idle");
  const [editing, setEditing] = useState<Transaction | null>(null);

  // data state
  const [items, setItems] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null | undefined>(null);
  const [searching, setSearching] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    q: "",
    from: "",
    to: "",
    type: "",
    category: "",
    dialysis: "",
  });

  const [debouncedQ, setDebouncedQ] = useState(filters.q);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const [pageLimit] = useState(20);

  // live search debounce
  // useEffect(() => {
  //   const t = setTimeout(() => setDebouncedQ(filters.q), 250);
  //   return () => clearTimeout(t);
  // }, [filters.q]);
  useEffect(() => {
    setSearching(true);

    const t = setTimeout(() => {
      setDebouncedQ(filters.q);
      // kasih “agak lama” biar skeleton keliatan smooth
      setTimeout(() => setSearching(false), 450);
    }, 250);

    return () => clearTimeout(t);
  }, [filters.q]);

  // category suggestions
  const categorySuggestions = useMemo(() => {
    const s = new Set<string>();
    items.forEach((tx) => {
      if (tx.category) s.add(tx.category);
    });
    return Array.from(s).sort((a, b) => a.localeCompare(b)).slice(0, 30);
  }, [items]);

  // client-side live search over loaded items
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
      // const token = await getIdToken?.();
      const token = await getAccessToken();
      if (!token) throw new Error("Missing auth token.");

      const res = await listTransactions({
        token,
        limit: pageLimit,
        cursor: undefined,
        from: filters.from ? new Date(filters.from).toISOString() : undefined,
        to: filters.to ? new Date(filters.to).toISOString() : undefined,
        type: filters.type || undefined,
        category: filters.category || undefined,
        dialysis: filters.dialysis || undefined,
      });

      setItems(res.data || []);
      setNextCursor(res.nextCursor);
    } catch (e: any) {
      setError(e?.message || "Failed to load transactions.");
    } finally {
      setLoading(false);
    }
  }

  async function loadMore() {
    if (!nextCursor) return;
    setLoadingMore(true);

    try {
      // const token = await getIdToken?.();
      const token = await getAccessToken();
      if (!token) throw new Error("Missing auth token.");

      const res = await listTransactions({
        token,
        limit: pageLimit,
        cursor: nextCursor || undefined,
        from: filters.from ? new Date(filters.from).toISOString() : undefined,
        to: filters.to ? new Date(filters.to).toISOString() : undefined,
        type: filters.type || undefined,
        category: filters.category || undefined,
        dialysis: filters.dialysis || undefined,
      });

      setItems((prev) => [...prev, ...(res.data || [])]);
      setNextCursor(res.nextCursor);
    } catch (e: any) {
      toast.error(e?.message || "Failed to load more.");
    } finally {
      setLoadingMore(false);
    }
  }

  // refetch on server filters change (bukan q)
  useEffect(() => {
    fetchFirst();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.from, filters.to, filters.type, filters.category, filters.dialysis]);

  // mobile: default tutup filters
  useEffect(() => {
    if (isDesktop) setFiltersOpen(true);
    else setFiltersOpen(false);
  }, [isDesktop]);

  function openCreate() {
    setMode("create");
    setEditing(null);
    if (!isDesktop) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function openEdit(tx: Transaction) {
    setMode("edit");
    setEditing(tx);
    if (!isDesktop) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function closeForm() {
    setMode("idle");
    setEditing(null);
  }

  async function handleCreate(payload: Partial<Transaction>) {
    // const token = await getIdToken?.();
    const token = await getAccessToken();
    if (!token) {
      toast.error("You’re not signed in. Please log in again.");
      return;
    }

    try {
      await createTransaction({ token, payload });
      toast.success("Transaction added.");
      closeForm();
      await fetchFirst();
    } catch (e: any) {
      toast.error(e?.message || "Failed to create transaction.");
    }
  }

  async function handleUpdate(payload: Partial<Transaction>) {
    // const token = await getIdToken?.();
    const token = await getAccessToken();
    if (!token) {
      toast.error("You’re not signed in. Please log in again.");
      return;
    }
    if (!editing?.id) return;

    try {
      await updateTransaction({ token, id: editing.id, payload });
      toast.success("Transaction updated.");
      closeForm();
      await fetchFirst();
    } catch (e: any) {
      toast.error(e?.message || "Failed to update transaction.");
    }
  }

  function askDelete(id: string) {
    setDeletingId(id);
    setConfirmOpen(true);
  }

  async function confirmDelete() {
    if (!deletingId) return;

    // const token = await getIdToken?.();
    const token = await getAccessToken();
    if (!token) {
      toast.error("You’re not signed in. Please log in again.");
      return;
    }

    setDeleteBusy(true);
    try {
      await deleteTransaction({ token, id: deletingId });
      toast.success("Transaction deleted.");
      setConfirmOpen(false);
      setDeletingId(null);
      await fetchFirst();
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete transaction.");
    } finally {
      setDeleteBusy(false);
    }
  }

  const showFilters = isDesktop ? true : filtersOpen;

  return (
    <div className={styles.wrap}>
      <div className={styles.topbar}>
        <div>
          <h1 className={styles.title}>Transactions</h1>
          <p className={styles.subtitle}>
            Keep it simple. Add what happened—PlanSave will help you stay on track.
          </p>
        </div>

        <div className={styles.topActions}>
          <button type="button" className="btn" onClick={fetchFirst} disabled={loading}>
            <FontAwesomeIcon icon={faRotateRight} />
            Refresh
          </button>

          <button type="button" className="btn btn-primary" onClick={openCreate}>
            <FontAwesomeIcon icon={faPlus} />
            Add
          </button>
        </div>
      </div>

      {/* Mobile filter toggle */}
      {!isDesktop ? (
        <div className={styles.mobileFilterRow}>
          <button
            type="button"
            className={`btn ${styles.filterBtn}`}
            onClick={() => setFiltersOpen((v) => !v)}
          >
            <FontAwesomeIcon icon={faFilter} />
            Filter
            <FontAwesomeIcon icon={faChevronDown} className={filtersOpen ? styles.chevUp : ""} />
          </button>

          <div className={styles.searchWrap}>
            <input
              className={styles.search}
              value={filters.q}
              onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
              placeholder="Live search…"
            />
          </div>
        </div>
      ) : null}

      {/* Desktop search row */}
      {isDesktop ? (
        <div className={styles.desktopSearchRow}>
          <input
            className={styles.search}
            value={filters.q}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
            placeholder="Live search…"
          />
        </div>
      ) : null}

      {/* Filters */}
      {showFilters ? (
        <section className={`card ${styles.filters}`} aria-label="Filters">
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

            <div className="field">
              <label className="label">Type</label>
              <select
                className={styles.select}
                value={filters.type}
                onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value as any }))}
              >
                <option value="">All</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>

            <div className="field">
              <label className="label">Category</label>
              <input
                className={styles.input}
                value={filters.category}
                onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
                placeholder="e.g. Food"
              />
            </div>

            <div className="field">
              <label className="label">Dialysis</label>
              <select
                className={styles.select}
                value={filters.dialysis}
                onChange={(e) => setFilters((f) => ({ ...f, dialysis: e.target.value as any }))}
              >
                <option value="">All</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
          </div>
        </section>
      ) : null}

      {/* Form area (NOT modal) */}
      {mode !== "idle" ? (
        <FormTransaction
          mode={mode === "create" ? "create" : "edit"}
          initial={editing}
          onCancel={closeForm}
          onSubmit={mode === "create" ? handleCreate : handleUpdate}
          categorySuggestions={categorySuggestions}
        />
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
            <div className={styles.stateText}>
              Add your first transaction—small steps add up.
            </div>
            <button className="btn btn-primary" onClick={openCreate}>
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
                  return (
                    <tr key={tx.id}>
                      <td>{tx.date?.slice(0, 10)}</td>
                      <td className={tx.type === "income" ? styles.income : styles.expense}>
                        {tx.type}
                      </td>
                      <td>
                        {tx.category}
                        {tx.isDialysis ? <span className={styles.dialysisTag}>Dialysis</span> : null}
                      </td>
                      <td className={styles.note}>{tx.note || "-"}</td>
                      <td className={styles.right}>
                        {tx.type === "income" ? "+" : "-"}
                        {formatMoney(Math.abs(tx.amount), currency)}
                      </td>
                      <td className={styles.actionsCol}>
                        <button className={`btn ${styles.rowBtn}`} onClick={() => openEdit(tx)}>
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

        {/* Cursor pagination */}
        {!loading && !error ? (
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