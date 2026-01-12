// src/components/toast/ToastProvider.tsx
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import styles from "./ToastProvider.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck, faCircleExclamation, faXmark } from "@fortawesome/free-solid-svg-icons";

type ToastType = "success" | "error" | "info";

type Toast = {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  timeoutMs: number;
};

type ToastCtx = {
  push: (t: { type: ToastType; message: string; title?: string; timeoutMs?: number }) => void;
};

const Ctx = createContext<ToastCtx | null>(null);

function uid() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);

  const push = useCallback((t: { type: ToastType; message: string; title?: string; timeoutMs?: number }) => {
    const id = uid();
    const toast: Toast = {
      id,
      type: t.type,
      title: t.title,
      message: t.message,
      timeoutMs: t.timeoutMs ?? 3200,
    };
    setItems((prev) => [toast, ...prev]);

    window.setTimeout(() => {
      setItems((prev) => prev.filter((x) => x.id !== id));
    }, toast.timeoutMs);
  }, []);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className={styles.stack} aria-live="polite" aria-relevant="additions">
        {items.map((t) => (
          <div key={t.id} className={`${styles.toast} ${styles[t.type]}`} role="status">
            <div className={styles.icon} aria-hidden="true">
              <FontAwesomeIcon icon={t.type === "success" ? faCircleCheck : faCircleExclamation} />
            </div>
            <div className={styles.content}>
              {t.title ? <div className={styles.title}>{t.title}</div> : null}
              <div className={styles.message}>{t.message}</div>
            </div>
            <button
              type="button"
              className={styles.close}
              aria-label="Close notification"
              onClick={() => setItems((prev) => prev.filter((x) => x.id !== t.id))}
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}