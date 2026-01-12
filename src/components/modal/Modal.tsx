// src/components/modal/Modal.tsx
import { useEffect } from "react";
import styles from "./Modal.module.scss";

type Props = {
  open: boolean;
  title?: string;
  children: React.ReactNode;
  onClose: () => void;
  width?: "sm" | "md" | "lg";
};

export default function Modal({ open, title, children, onClose, width = "md" }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={title ?? "Dialog"}>
      <div className={`${styles.modal} ${styles[width]}`}>
        <div className={styles.header}>
          <div className={styles.title}>{title}</div>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close dialog">
            ✕
          </button>
        </div>

        <div className={styles.body}>{children}</div>
      </div>

      <button className={styles.backdropBtn} aria-label="Close" onClick={onClose} />
    </div>
  );
}