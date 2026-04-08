// src/components/formTransaction/FormTransaction.tsx
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFloppyDisk, faXmark } from "@fortawesome/free-solid-svg-icons";

import type { Transaction, TransactionType } from "../../types/transaction";
import styles from "./FormTransaction.module.scss";

type Props = {
  mode: "create" | "edit";
  initial?: Transaction | null;
  onSubmit: (payload: Partial<Transaction>) => Promise<void>;
  onCancel: () => void;
  busy?: boolean;
  categorySuggestions?: string[];
};

const NOTE_MAX = 500;

function toInputDate(date?: string) {
  if (!date) return "";
  return date.slice(0, 10);
}

function amountToCents(amountStr: string) {
  const n = Number(amountStr);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}

export default function FormTransaction({
  mode,
  initial,
  onSubmit,
  onCancel,
  busy = false,
  categorySuggestions = [],
}: Props) {
  const [type, setType] = useState<TransactionType>(initial?.type || "expense");

  // tampilkan amount normal, simpan cents di payload
  const [amount, setAmount] = useState<string>(() => {
    if (initial?.amountCents != null) return (initial.amountCents / 100).toFixed(2);
    return "";
  });

  const [currency, setCurrency] = useState<"USD" | "IDR">(
    (initial?.currency as any) || "USD"
  );

  const [date, setDate] = useState<string>(toInputDate(initial?.date)); // YYYY-MM-DD
  const [category, setCategory] = useState<string>(initial?.category || "");
  const [isDialysisRelated, setIsDialysisRelated] = useState<boolean>(
    !!initial?.isDialysisRelated
  );
  const [note, setNote] = useState<string>(initial?.note || "");

  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    const cents = amountToCents(amount);

    if (!amount.trim()) e.amount = "Amount is required.";
    else if (cents === null) e.amount = "Amount must be a number greater than 0.";

    if (!date) e.date = "Date is required.";
    else if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) e.date = "Date must be YYYY-MM-DD.";

    if (!category.trim()) e.category = "Category is required.";

    if (note.length > NOTE_MAX) e.note = `Note must be ${NOTE_MAX} characters or less.`;

    return e;
  }, [amount, date, category, note]);

  const isValid = Object.keys(errors).length === 0;

  function showError(key: string) {
    return !!touched[key] && !!errors[key];
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setTouched({
      type: true,
      amount: true,
      currency: true,
      date: true,
      category: true,
      note: true,
    });

    if (!isValid) {
      toast.error("Please fix the highlighted fields.");
      return;
    }

    const amountCents = amountToCents(amount);
    if (amountCents === null) {
      toast.error("Please enter a valid amount.");
      return;
    }

    await onSubmit({
      type,
      amountCents,
      currency,
      date, // ✅ YYYY-MM-DD
      category: category.trim(),
      isDialysisRelated,
      note: note.trim() ? note.trim() : undefined,
    });
  }

  return (
    <section className={`card ${styles.card}`} aria-label="Transaction form">
      <div className={styles.top}>
        <div>
          <h2 className={styles.title}>
            {mode === "create" ? "Add transaction" : "Edit transaction"}
          </h2>
          <p className={styles.sub}>
            Small steps—keep going. Track it once, feel calmer all month.
          </p>
        </div>

        <button type="button" className="btn btn-ghost" onClick={onCancel} aria-label="Close form">
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.grid}>
          <div className="field">
            <label className="label">Type</label>
            <select
              className={styles.select}
              value={type}
              onChange={(e) => setType(e.target.value as TransactionType)}
              onBlur={() => setTouched((t) => ({ ...t, type: true }))}
              disabled={busy}
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>

          <div className="field">
            <label className="label">Currency</label>
            <select
              className={styles.select}
              value={currency}
              onChange={(e) => setCurrency(e.target.value as "USD" | "IDR")}
              disabled={busy}
            >
              <option value="USD">USD</option>
              <option value="IDR">IDR</option>
            </select>
            <div className="help">Default is USD. You can also select IDR.</div>
          </div>

          <div className="field">
            <label className="label">Amount</label>
            <input
              className={`${styles.input} ${showError("amount") ? styles.inputError : ""}`}
              value={amount}
              inputMode="decimal"
              placeholder="e.g. 25.50"
              onChange={(e) => setAmount(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, amount: true }))}
              disabled={busy}
            />
            {showError("amount") ? <div className={styles.error}>{errors.amount}</div> : null}
          </div>

          <div className="field">
            <label className="label">Date</label>
            <input
              type="date"
              className={`${styles.input} ${showError("date") ? styles.inputError : ""}`}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, date: true }))}
              disabled={busy}
            />
            {showError("date") ? <div className={styles.error}>{errors.date}</div> : null}
          </div>

          <div className={`field ${styles.full}`}>
            <label className="label">Category</label>
            <input
              list="category-suggestions"
              className={`${styles.input} ${showError("category") ? styles.inputError : ""}`}
              value={category}
              placeholder="e.g. Food, Rent, Dialysis, Salary"
              onChange={(e) => setCategory(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, category: true }))}
              disabled={busy}
              maxLength={60}
            />
            <datalist id="category-suggestions">
              {categorySuggestions.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            {showError("category") ? <div className={styles.error}>{errors.category}</div> : null}
          </div>

          <div className={`field ${styles.full}`}>
            <label className={styles.checkRow}>
              <input
                type="checkbox"
                checked={isDialysisRelated}
                onChange={(e) => setIsDialysisRelated(e.target.checked)}
                disabled={busy}
              />
              <span>Dialysis related</span>
            </label>
          </div>

          <div className={`field ${styles.full}`}>
            <label className="label">Note (optional)</label>
            <input
              className={`${styles.input} ${showError("note") ? styles.inputError : ""}`}
              value={note}
              placeholder="Short note (optional)"
              onChange={(e) => setNote(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, note: true }))}
              disabled={busy}
              maxLength={NOTE_MAX}
            />
            <div className="help">
              {note.length}/{NOTE_MAX}
            </div>
            {showError("note") ? <div className={styles.error}>{errors.note}</div> : null}
          </div>
        </div>

        <div className={styles.actions}>
          <button type="button" className="btn" onClick={onCancel} disabled={busy}>
            Cancel
          </button>

          <button type="submit" className="btn btn-primary" disabled={busy}>
            <FontAwesomeIcon icon={faFloppyDisk} />
            {busy ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </section>
  );
}