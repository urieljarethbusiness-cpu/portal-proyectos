"use client";

import { useState } from "react";
import { FileText, Trash2 } from "lucide-react";
import styles from "./FileManager.module.css";
import { deleteAttachment } from "@/lib/actions";
import ConfirmModal from "./ConfirmModal";
import FileUploader from "./FileUploader";

interface Attachment {
  id: string;
  filename: string;
  filepath: string;
}

interface FileManagerProps {
  projectId: string;
  attachments: Attachment[];
}

export default function FileManager({ projectId, attachments }: FileManagerProps) {
  const [fileToDelete, setFileToDelete] = useState<Attachment | null>(null);

  return (
    <section className={`glass-panel ${styles.fileSection}`}>
      <h2 className={styles.sectionTitle}>Archivos</h2>
      <FileUploader projectId={projectId} />
      <div className={styles.attachmentList}>
        {attachments.map(file => (
          <div key={file.id} className={styles.fileItem}>
            <div className={styles.fileMain}>
              <FileText size={16} />
              <a 
                href={`/api/files/${projectId}/${file.filename}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.fileName}
              >
                {file.filename}
              </a>
            </div>
            <button 
              className={styles.deleteFileBtn}
              onClick={() => setFileToDelete(file)}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}

        {attachments.length === 0 && (
          <p className={styles.emptyTextSimple}>No hay archivos adjuntos.</p>
        )}
      </div>

      <ConfirmModal 
        isOpen={!!fileToDelete}
        title="Eliminar Archivo"
        message={`¿Estás seguro de que quieres eliminar "${fileToDelete?.filename}"?`}
        confirmText="Eliminar"
        type="danger"
        onConfirm={async () => {
          if (fileToDelete) await deleteAttachment(fileToDelete.id, projectId);
        }}
        onCancel={() => setFileToDelete(null)}
      />
    </section>
  );
}
