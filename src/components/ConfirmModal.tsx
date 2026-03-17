"use client";

import { X, AlertTriangle } from "lucide-react";
import styles from "./ConfirmModal.module.css";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  type = "info"
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={`glass-panel ${styles.modal} ${styles[type]}`}>
        <div className={styles.header}>
          <div className={styles.titleWrapper}>
            {type === "danger" && <AlertTriangle size={20} className={styles.icon} />}
            <h3>{title}</h3>
          </div>
          <button onClick={onCancel} className={styles.closeBtn}>
            <X size={20} />
          </button>
        </div>
        
        <div className={styles.body}>
          <p>{message}</p>
        </div>
        
        <div className={styles.footer}>
          <button onClick={onCancel} className={styles.cancelBtn}>
            {cancelText}
          </button>
          <button 
            onClick={() => {
              onConfirm();
              onCancel();
            }} 
            className={`${styles.confirmBtn} ${styles[type + 'Btn']}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
