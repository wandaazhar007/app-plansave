// src/pages/transactions/FormTransactionPage.tsx
import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../lib/auth/useAuth";
import type { Transaction } from "../../types/transaction";
import { createTransaction, updateTransaction } from "../../services/transactionsService";
import { useToast } from "../../components/toast/ToastProvider";

import FormTransaction from "../../components/formTransaction/FormTransaction";
import styles from "./FormTransactionPage.module.scss";

type LocationState =
  | { mode: "create" }
  | { mode: "edit"; initial: Transaction };

type RedirectToast = {
  type: "success" | "error" | "info";
  title?: string;
  message: string;
};

export default function FormTransactionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { getAccessToken } = useAuth();
  const { push } = useToast();

  const state = (location.state || { mode: "create" }) as LocationState;

  const mode = state.mode;
  const initial = "initial" in state ? state.initial : null;

  const [busy, setBusy] = useState(false);

  const title = useMemo(() => {
    return mode === "create" ? "Add transaction" : "Edit transaction";
  }, [mode]);

  function goBack(opts?: { refresh?: boolean; toast?: RedirectToast }) {
    navigate("/app/transactions", {
      replace: true,
      state: opts?.refresh || opts?.toast ? { refresh: !!opts?.refresh, toast: opts?.toast } : null,
    });
  }

  async function onSubmit(payload: Partial<Transaction>) {
    const token = await getAccessToken();
    if (!token) {
      // auth error: tampilkan sekarang (di page ini) karena kita tidak akan redirect sukses
      push({ type: "error", title: "Session expired", message: "Please sign in again." });
      goBack({ refresh: false });
      return;
    }

    setBusy(true);
    try {
      if (mode === "create") {
        await createTransaction({ token, payload });

        // ✅ toast tampil di list page setelah redirect
        goBack({
          refresh: true,
          toast: {
            type: "success",
            title: "Saved",
            message: "Transaction added successfully.",
          },
        });
      } else {
        if (!initial?.id) {
          push({ type: "error", title: "Missing data", message: "Transaction id is missing." });
          return;
        }

        await updateTransaction({ token, id: initial.id, payload });

        // ✅ toast tampil di list page setelah redirect
        goBack({
          refresh: true,
          toast: {
            type: "success",
            title: "Updated",
            message: "Transaction updated successfully.",
          },
        });
      }
    } catch (e: any) {
      // error tetap tampil di page form (biar user tahu gagal)
      push({
        type: "error",
        title: "Failed",
        message: e?.message || "Failed to save transaction.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.wrap}>
      <FormTransaction
        mode={mode}
        initial={initial}
        onCancel={() => goBack({ refresh: false })}
        onSubmit={onSubmit}
        busy={busy}
        categorySuggestions={[]}
      />
    </div>
  );
}