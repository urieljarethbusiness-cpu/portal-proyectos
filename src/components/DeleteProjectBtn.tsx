"use client";

import { Trash2 } from "lucide-react";
import { deleteProject } from "@/lib/actions";
import { useRouter } from "next/navigation";
import styles from "./DeleteProjectBtn.module.css";
import ConfirmModal from "./ConfirmModal";
import { useState } from "react";

export default function DeleteProjectBtn({ id }: { id: string }) {
  const router = useRouter();

  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    await deleteProject(id);
    router.push("/proyectos");
  };
  return (
    <>
      <button className={styles.btn} onClick={() => setShowConfirm(true)} title="Eliminar Proyecto">
        <Trash2 size={20} />
        <span>Eliminar</span>
      </button>

      <ConfirmModal 
        isOpen={showConfirm}
        title="Eliminar Proyecto"
        message="¿Estás seguro de que quieres eliminar este proyecto? Esta acción no se puede deshacer y se perderán todos los datos asociados."
        confirmText="Eliminar permanentemente"
        type="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
}
