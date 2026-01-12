// src/pages/transactions/TransactionFormModal.tsx
import { useMemo, useState } from "react";
import Modal from "../../components/modal/Modal";
import type { Currency, Transaction, TransactionType } from "../../types/transaction";
import styles from "./TransactionsPage.module.scss";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

type Mode = "create" | "edit";

export type TransactionFormValues = {
  type: TransactionType;
  amount: string; // decimal string
  currency: Currency; // USD / IDR
  category: string;
  isDialysisRelated: boolean;
  date: string; // YYYY-MM-DD
  note: string;
};

function centsFromAmount(amount: string): number | null {
  const n = Number(amount);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

function amountFromCents(cents: number): string {
  return (cents / 100).toFixed(2);
}

function validate(v: TransactionFormValues) {
  const errors: Partial<Record<keyof TransactionFormValues, string>> = {};

  if (!v.type) errors.type = "Please choose a type.";
  if (!v.date) errors.date = "Please select a date.";
  if (!v.category.trim()) errors.category = "Category is required.";

  const cents = centsFromAmount(v.amount);
  if (v.amount.trim().length === 0) errors.amount = "Amount is required.";
  else if (cents === null) errors.amount = "Please enter a valid amount.";

  if (v.note && v.note.length > 500) errors.note = "Note must be 500 characters or less.";

  return errors;
}

export default function TransactionFormModal(props: {
  open: boolean;
  mode: Mode;
  initial?: Transaction | null;
  onClose: () => void;
  onSubmit: (payload: {
    type: TransactionType;
    amountCents: number;
    currency: Currency;
    category: string;
    isDialysisRelated: boolean;
    date: string;
    note?: string;
  }) => Promise<void>;
}) {
  const { open, mode, initial, onClose, onSubmit } = props;

  const initialValues: TransactionFormValues = useMemo(() => {
    if (mode === "edit" && initial) {
      return {
        type: initial.type,
        amount: amountFromCents(initial.amountCents),
        currency: initial.currency ?? "USD",
        category: initial.category ?? "",
        isDialysisRelated: !!initial.isDialysisRelated,
        date: initial.date ?? "",
        note: initial.note ?? "",
      };
    }
    return {
      type: "expense",
      amount: "",
      currency: "USD",
      category: "",
      isDialysisRelated: false,
      date: "",
      note: "",
    };
  }, [mode, initial]);

  const [values, setValues] = useState<TransactionFormValues>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof TransactionFormValues, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  // reset when opened
  if (open && values !== initialValues && mode === "edit" && initial) {
    // no-op; state handled via manual reset below to avoid re-render loops
  }

  function set<K extends keyof TransactionFormValues>(key: K, val: TransactionFormValues[K]) {
    setValues((p) => ({ ...p, [key]: val }));
    setErrors((p) => ({ ...p, [key]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const eMap = validate(values);
    setErrors(eMap);
    if (Object.keys(eMap).length > 0) return;

    const cents = centsFromAmount(values.amount);
    if (cents === null) return;

    setSubmitting(true);
    try {
      await onSubmit({
        type: values.type,
        amountCents: cents,
        currency: values.currency,
        category: values.category.trim(),
        isDialysisRelated: values.isDialysisRelated,
        date: values.date,
        note: values.note.trim() ? values.note.trim() : undefined,
      });
      onClose();
      // reset for next open
      setValues(initialValues);
      setErrors({});
    } finally {
      setSubmitting(false);
    }
  }

  // when modal opens, reset form based on mode
  // (simple approach: reset when open becomes true)
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useMemo(() => {
    if (open) {
      setValues(initialValues);
      setErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, initial?.id]);

  return (
    <Modal
      open={open}
      title={mode === "create" ? "Add transaction" : "Edit transaction"}
      onClose={() => !submitting && onClose()}
      width="md"
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGrid}>
          <div className="field">
            <label className="label">Type</label>
            <select
              className={`${styles.select} ${errors.type ? styles.inputError : ""}`}
              value={values.type}
              onChange={(e) => set("type", e.target.value as TransactionType)}
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
            {errors.type ? <div className="error">{errors.type}</div> : null}
          </div>

          <div className="field">
            <label className="label">Date</label>
            <input
              className={`input ${errors.date ? styles.inputError : ""}`}
              type="date"
              value={values.date}
              onChange={(e) => set("date", e.target.value)}
            />
            {errors.date ? <div className="error">{errors.date}</div> : null}
          </div>

          <div className="field">
            <label className="label">Currency</label>
            <select
              className={styles.select}
              value={values.currency}
              onChange={(e) => set("currency", e.target.value as Currency)}
            >
              <option value="USD">USD</option>
              <option value="IDR">IDR</option>
            </select>
          </div>

          <div className="field">
            <label className="label">Amount</label>
            <input
              className={`input ${errors.amount ? styles.inputError : ""}`}
              inputMode="decimal"
              placeholder={values.currency === "IDR" ? "e.g. 150000" : "e.g. 45.00"}
              value={values.amount}
              onChange={(e) => set("amount", e.target.value)}
            />
            {errors.amount ? <div className="error">{errors.amount}</div> : null}
            <div className="help">
              {values.currency === "IDR" ? "IDR typically uses whole numbers." : "USD supports decimals."}
            </div>
          </div>

          <div className="field">
            <label className="label">Category</label>
            <input
              className={`input ${errors.category ? styles.inputError : ""}`}
              placeholder="e.g. Groceries, Dialysis, Rent"
              value={values.category}
              onChange={(e) => set("category", e.target.value)}
              maxLength={60}
            />
            {errors.category ? <div className="error">{errors.category}</div> : null}
          </div>

          <div className={styles.checkboxField}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={values.isDialysisRelated}
                onChange={(e) => set("isDialysisRelated", e.target.checked)}
              />
              <span>Dialysis-related</span>
            </label>
          </div>

          <div className={`${styles.note} field`}>
            <label className="label">Note (optional)</label>
            <textarea
              className={`input ${errors.note ? styles.inputError : ""}`}
              rows={4}
              placeholder="Add a short note (optional)"
              value={values.note}
              onChange={(e) => set("note", e.target.value)}
              maxLength={500}
            />
            {errors.note ? <div className="error">{errors.note}</div> : null}
            <div className="help">{values.note.length}/500</div>
          </div>
        </div>

        <div className={styles.formActions}>
          <button type="button" className="btn" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "Saving…" : mode === "create" ? "Add transaction" : "Save changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}