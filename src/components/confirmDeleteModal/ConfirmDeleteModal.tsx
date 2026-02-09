// src/components/confirmDeleteModal/ConfirmDeleteModal.tsx
import styles from "./ConfirmDeleteModal.module.scss";

type Props = {
  open: boolean;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
};

export default function ConfirmDeleteModal({
  open,
  title = "Delete transaction?",
  description = "This action can’t be undone. The transaction will be permanently removed.",
  confirmText = "Delete",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  busy = false,
}: Props) {
  if (!open) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.desc}>{description}</p>
        </div>

        <div className={styles.actions}>
          <button type="button" className="btn" onClick={onCancel} disabled={busy}>
            {cancelText}
          </button>
          <button
            type="button"
            className={`btn btn-primary ${styles.danger}`}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "Deleting..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}