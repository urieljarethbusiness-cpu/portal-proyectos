"use client";

import { useState } from "react";
import { Download, FileArchive, FileImage, FileJson, FileText, Trash2 } from "lucide-react";
import styles from "./FileManager.module.css";
import { deleteAttachment } from "@/lib/actions";
import ConfirmModal from "./ConfirmModal";
import FileUploader from "./FileUploader";
import FilePreviewModal from "./FilePreviewModal";

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
  const [fileToPreview, setFileToPreview] = useState<Attachment | null>(null);

  const getExt = (filename: string) => filename.split(".").pop()?.toLowerCase() ?? "";

  const isArchive = (filename: string) => {
    const ext = getExt(filename);
    return ["zip", "rar", "7z", "tar", "gz"].includes(ext);
  };

  const isImage = (filename: string) => {
    const ext = getExt(filename);
    return ["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(ext);
  };

  const getFileIcon = (filename: string) => {
    const ext = getExt(filename);
    if (isImage(filename)) return <FileImage size={16} />;
    if (ext === "json") return <FileJson size={16} />;
    if (isArchive(filename)) return <FileArchive size={16} />;
    return <FileText size={16} />;
  };

  const openFile = (file: Attachment) => {
    const fileUrl = `/api/files/${projectId}/${encodeURIComponent(file.filename)}`;
    if (isArchive(file.filename)) {
      window.open(fileUrl, "_self");
      return;
    }
    setFileToPreview(file);
  };

  return (
    <section className={`glass-panel ${styles.fileSection}`}>
      <h2 className={styles.sectionTitle}>Archivos</h2>
      <FileUploader projectId={projectId} />
      <div className={styles.attachmentList}>
        {attachments.map(file => (
          <div key={file.id} className={styles.fileItem}>
            <div className={styles.fileMain}>
              <span className={styles.fileTypeIcon}>{getFileIcon(file.filename)}</span>
              {isImage(file.filename) ? (
                <img
                  src={`/api/files/${projectId}/${encodeURIComponent(file.filename)}?preview=1`}
                  alt={file.filename}
                  className={styles.thumbnail}
                />
              ) : (
                <span className={styles.placeholderThumb}>{getExt(file.filename).toUpperCase() || "FILE"}</span>
              )}

              <button
                type="button"
                className={styles.fileName}
                onClick={() => openFile(file)}
                title={isArchive(file.filename) ? "Archivo comprimido: se descargará directamente" : "Abrir previsualización"}
              >
                {file.filename}
              </button>
            </div>

            <div className={styles.actions}>
              <a
                href={`/api/files/${projectId}/${encodeURIComponent(file.filename)}`}
                download={file.filename}
                className={styles.downloadBtn}
                title="Descargar"
              >
                <Download size={14} />
              </a>
              <button
                type="button"
                className={styles.deleteFileBtn}
                onClick={() => setFileToDelete(file)}
              >
                <Trash2 size={14} />
              </button>
            </div>
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

      {fileToPreview && (
        <FilePreviewModal
          key={fileToPreview.id}
          isOpen={!!fileToPreview}
          projectId={projectId}
          filename={fileToPreview.filename}
          onClose={() => setFileToPreview(null)}
        />
      )}
    </section>
  );
}
