"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, FileText, X } from "lucide-react";
import styles from "./FilePreviewModal.module.css";

interface FilePreviewModalProps {
  isOpen: boolean;
  projectId: string;
  filename: string;
  onClose: () => void;
}

const TEXT_EXTENSIONS = new Set(["txt", "md", "json", "csv", "log", "xml", "js", "ts"]);
const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif", "svg", "webp"]);
const ARCHIVE_EXTENSIONS = new Set(["zip", "rar", "7z", "tar", "gz"]);

function getExtension(filename: string) {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

export default function FilePreviewModal({ isOpen, projectId, filename, onClose }: FilePreviewModalProps) {
  const [textContent, setTextContent] = useState<string>("");
  const [textError, setTextError] = useState<string | null>(null);

  const ext = getExtension(filename);
  const isImage = IMAGE_EXTENSIONS.has(ext);
  const isPdf = ext === "pdf";
  const isDocx = ext === "docx";
  const isText = TEXT_EXTENSIONS.has(ext);
  const isArchive = ARCHIVE_EXTENSIONS.has(ext);

  const fileUrl = `/api/files/${projectId}/${encodeURIComponent(filename)}`;
  const previewUrl = `${fileUrl}?preview=1`;
  const textPreviewUrl = `${fileUrl}?preview=1&text=1`;

  const officeViewerUrl = useMemo(() => {
    if (!isDocx || typeof window === "undefined") return "";
    const absoluteFileUrl = `${window.location.origin}${previewUrl}`;
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(absoluteFileUrl)}`;
  }, [isDocx, previewUrl]);

  useEffect(() => {
    if (!isOpen || !isDocx) return;
    console.info("[FilePreviewModal] DOCX preview bootstrap", {
      filename,
      origin: window.location.origin,
      previewUrl,
      officeViewerUrl,
    });
  }, [isOpen, isDocx, filename, previewUrl, officeViewerUrl]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !isText) return;

    const controller = new AbortController();

    fetch(textPreviewUrl, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("No se pudo cargar el contenido");
        const data = await response.text();
        setTextContent(data);
        setTextError(null);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setTextError("No se pudo previsualizar el archivo de texto.");
      })
      .finally(() => undefined);

    return () => {
      controller.abort();
    };
  }, [isOpen, isText, textPreviewUrl]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label={`Previsualización de ${filename}`}
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.header}>
          <div className={styles.titleWrap}>
            <FileText size={16} />
            <span className={styles.filename} title={filename}>{filename}</span>
          </div>
          <div className={styles.headerActions}>
            <a href={fileUrl} download={filename} className={styles.downloadBtn} title="Descargar archivo">
              <Download size={14} />
              <span>Descargar</span>
            </a>
            <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar previsualizador">
              <X size={16} />
            </button>
          </div>
        </header>

        <div className={styles.content}>
          {isArchive ? (
            <div className={styles.fallback}>
              <p>Este tipo de archivo comprimido no se previsualiza.</p>
              <p>Descárgalo para abrirlo localmente.</p>
            </div>
          ) : isImage ? (
            <img src={previewUrl} alt={filename} className={styles.previewImage} />
          ) : isPdf ? (
            <iframe title={filename} src={previewUrl} className={styles.previewFrame} />
          ) : isDocx ? (
            <iframe
              title={filename}
              src={officeViewerUrl}
              className={styles.previewFrame}
              onLoad={() => {
                console.info("[FilePreviewModal] DOCX iframe loaded", {
                  filename,
                  officeViewerUrl,
                });
              }}
              onError={() => {
                console.error("[FilePreviewModal] DOCX iframe failed", {
                  filename,
                  officeViewerUrl,
                });
              }}
            />
          ) : isText ? (
            !textContent && !textError ? (
              <div className={styles.fallback}>Cargando contenido...</div>
            ) : textError ? (
              <div className={styles.fallback}>{textError}</div>
            ) : (
              <pre className={styles.previewText}>{textContent}</pre>
            )
          ) : (
            <div className={styles.fallback}>
              <p>No hay previsualización para este tipo de archivo.</p>
              <p>Usa el botón de descarga.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

