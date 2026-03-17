"use client";

import { useState } from "react";
import { Plus, Trash2, CheckCircle2, Circle, Calendar as CalendarIcon, X } from "lucide-react";
import styles from "./PaymentManager.module.css";
import { addPayment, togglePaymentStatus, deletePayment, updatePaymentDate } from "@/lib/actions";
import ConfirmModal from "./ConfirmModal";

interface Payment {
  id: string;
  amount: number;
  isPaid: boolean;
  expectedDate: Date | null;
  description: string | null;
}

interface PaymentManagerProps {
  projectId: string;
  payments: Payment[];
}

export default function PaymentManager({ projectId, payments }: PaymentManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);
  const [editingDateId, setEditingDateId] = useState<string | null>(null);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button 
          className={styles.addBtn}
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? <X size={18} /> : <Plus size={18} />}
          <span>{showAddForm ? "Cancelar" : "Nuevo Hito"}</span>
        </button>
      </div>

      {showAddForm && (
        <form 
          action={async (formData) => {
            await addPayment(projectId, formData);
            setShowAddForm(false);
          }} 
          className={styles.addForm}
          suppressHydrationWarning
        >
          <div className={styles.formRow}>
            <input name="description" placeholder="Ej. Anticipo 50%" required />
            <input name="amount" type="number" step="0.01" placeholder="Monto" required />
            <input name="date" type="date" className={styles.dateInput} />
            <button type="submit" className={styles.submitBtn}>Añadir</button>
          </div>
        </form>
      )}

      <div className={styles.paymentList}>
        {payments.map((p) => (
          <div key={p.id} className={`${styles.paymentItem} ${p.isPaid ? styles.paid : ""}`}>
            <button 
              className={styles.toggleBtn}
              onClick={() => togglePaymentStatus(p.id, projectId)}
              title={p.isPaid ? "Marcar como pendiente" : "Marcar como pagado"}
            >
              {p.isPaid ? (
                <CheckCircle2 size={20} className={styles.paidIcon} />
              ) : (
                <Circle size={20} className={styles.pendingIcon} />
              )}
            </button>

            <div className={styles.paymentInfo}>
              <span className={styles.pDesc}>{p.description || "Sin descripción"}</span>
              <div className={styles.pMeta}>
                <div className={styles.pDate}>
                  <CalendarIcon size={14} />
                  {editingDateId === p.id ? (
                    <input 
                      type="date"
                      defaultValue={p.expectedDate ? new Date(p.expectedDate).toISOString().split('T')[0] : ""}
                      onChange={(e) => {
                        updatePaymentDate(p.id, projectId, e.target.value);
                        setEditingDateId(null);
                      }}
                      onBlur={() => setEditingDateId(null)}
                      className={styles.pDateInput}
                      autoFocus
                    />
                  ) : (
                    <span 
                      onClick={() => setEditingDateId(p.id)}
                      className={styles.pDateText}
                      title="Haz clic para cambiar la fecha"
                    >
                      {p.expectedDate ? new Date(p.expectedDate).toLocaleDateString() : "S/F"}
                    </span>
                  )}
                </div>
                <span className={styles.pAmount}>${p.amount.toLocaleString()}</span>
              </div>
            </div>

            <button 
              className={styles.deleteBtn}
              onClick={() => setPaymentToDelete(p.id)}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}

        {payments.length === 0 && !showAddForm && (
          <p className={styles.emptyText}>No hay hitos de pago definidos.</p>
        )}
      </div>
      <ConfirmModal 
        isOpen={!!paymentToDelete}
        title="Eliminar Pago"
        message="¿Estás seguro de que quieres eliminar este hito de pago? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        type="danger"
        onConfirm={() => {
          if (paymentToDelete) deletePayment(paymentToDelete, projectId);
        }}
        onCancel={() => setPaymentToDelete(null)}
      />
    </div>
  );
}
