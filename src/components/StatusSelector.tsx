"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { updateProjectStatus } from "@/lib/actions";
import styles from "./StatusSelector.module.css";

const STATUS_OPTIONS = ["Abierto", "Terminado", "Perdido"];

export default function StatusSelector({ id, currentStatus }: { id: string, currentStatus: string }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    await updateProjectStatus(id, newStatus);
    setIsOpen(false);
  };

  return (
    <div className={styles.container}>
      <button 
        className={`${styles.currentBtn} ${styles[currentStatus.toLowerCase()]}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{currentStatus}</span>
        <ChevronDown size={14} className={isOpen ? styles.rotate : ""} />
      </button>

      {isOpen && (
        <>
          <div className={styles.overlay} onClick={() => setIsOpen(false)} />
          <div className={`glass-panel ${styles.menu}`}>
            {STATUS_OPTIONS.map((status) => (
              <button
                key={status}
                className={`${styles.option} ${status === currentStatus ? styles.active : ""}`}
                onClick={() => handleStatusChange(status)}
              >
                {status}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
