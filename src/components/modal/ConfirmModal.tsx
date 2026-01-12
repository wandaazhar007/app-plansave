// src/components/modal/ConfirmModal.tsx
import Modal from "./Modal";
import styles from "./ConfirmModal.module.scss";

type Props = {
  open: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export default function ConfirmModal({
  open,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  danger = false,
  loading = false,
  onConfirm,
  onClose,
}: Props) {
  return (
    <Modal open={open} title={title} onClose={onClose} width="sm">
      <div className={styles.desc}>{description}</div>

      <div className={styles.actions}>
        <button type="button" className="btn" onClick={onClose} disabled={loading}>
          {cancelText}
        </button>
        <button
          type="button"
          className={`btn ${danger ? styles.dangerBtn : "btn-primary"}`}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? "Please wait…" : confirmText}
        </button>
      </div>
    </Modal>
  );
}