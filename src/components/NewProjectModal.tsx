"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import styles from "./NewProjectModal.module.css";
import { createProject } from "@/lib/actions";

export default function NewProjectModal() {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button className={styles.addBtn} onClick={() => setIsOpen(true)}>
        <Plus size={20} />
        <span>Nuevo Proyecto</span>
      </button>
    );
  }

  return (
    <div className={styles.overlay}>
      <div className={`glass-panel ${styles.modal}`}>
        <div className={styles.header}>
          <h2>Nuevo Proyecto</h2>
          <button className={styles.closeBtn} onClick={() => setIsOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <form 
          action={async (formData) => {
            await createProject(formData);
            setIsOpen(false);
          }} 
          className={styles.form}
          suppressHydrationWarning
        >
          <div className={styles.field}>
            <label>Título del Proyecto</label>
            <input name="title" type="text" required placeholder="Ej. Rediseño Web Corporativa" />
          </div>

          <div className={styles.field}>
            <label>Descripción</label>
            <textarea name="description" required placeholder="Describe brevemente el alcance..." rows={3} />
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label>Presupuesto Base</label>
              <input name="basePrice" type="number" step="0.01" required placeholder="0.00" />
            </div>
            <div className={styles.field}>
              <label>Fecha Límite (SLA)</label>
              <input name="slaDate" type="date" />
            </div>
          </div>

          <div className={styles.checkbox}>
            <input name="isFreelance" type="checkbox" id="freelance" />
            <label htmlFor="freelance">¿Es un proyecto Freelance?</label>
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={() => setIsOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className={styles.submitBtn}>
              Crear Proyecto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
