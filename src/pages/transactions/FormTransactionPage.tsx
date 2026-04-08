// src/pages/transactions/FormTransactionPage.tsx
import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { useAuth } from "../../lib/auth/useAuth";
import type { Transaction } from "../../types/transaction";
import { createTransaction, updateTransaction } from "../../services/transactionsService";

import FormTransaction from "../../components/formTransaction/FormTransaction";
import styles from "./FormTransactionPage.module.scss";

type LocationState =
  | {
    mode: "create";
  }
  | {
    mode: "edit";
    initial: Transaction;
  };

export default function FormTransactionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { getAccessToken } = useAuth();

  const state = (location.state || { mode: "create" }) as LocationState;

  const mode = state.mode;
  const initial = "initial" in state ? state.initial : null;

  const [busy, setBusy] = useState(false);

  const title = useMemo(() => {
    return mode === "create" ? "Add transaction" : "Edit transaction";
  }, [mode]);

  function goBack(refresh?: boolean) {
    navigate("/app/transactions", { replace: true, state: refresh ? { refresh: true } : null });
  }

  async function onSubmit(payload: Partial<Transaction>) {
    const token = await getAccessToken();
    if (!token) {
      toast.error("You’re not signed in. Please log in again.");
      goBack(false);
      return;
    }

    setBusy(true);
    try {
      if (mode === "create") {
        await createTransaction({ token, payload });
        toast.success("Transaction added.");
      } else {
        if (!initial?.id) {
          toast.error("Missing transaction id.");
          return;
        }
        await updateTransaction({ token, id: initial.id, payload });
        toast.success("Transaction updated.");
      }

      goBack(true);
    } catch (e: any) {
      toast.error(e?.message || "Failed to save transaction.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>{title}</h1>
        <p className={styles.pageSub}>
          Keep it simple—one transaction at a time.
        </p>
      </div>

      <FormTransaction
        mode={mode}
        initial={initial}
        onCancel={() => goBack(false)}
        onSubmit={onSubmit}
        busy={busy}
        categorySuggestions={[]}
      />
    </div>
  );
}