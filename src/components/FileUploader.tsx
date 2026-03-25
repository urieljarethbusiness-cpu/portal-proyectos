"use client";

import { useCallback, useState } from "react";
import { FileRejection, useDropzone } from "react-dropzone";
import { FileText, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import styles from "./FileUploader.module.css";

export default function FileUploader({ projectId }: { projectId: string }) {
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    console.info("[FileUploader] Accepted files", {
      projectId,
      files: acceptedFiles.map((file) => ({
        name: file.name,
        sizeBytes: file.size,
        sizeMB: Number((file.size / (1024 * 1024)).toFixed(3)),
        mimeType: file.type,
        lastModified: file.lastModified,
      })),
    });
    
    setIsUploading(true);
    try {
      for (const file of acceptedFiles) {
        const formData = new FormData();
        formData.append("file", file);
        console.info("[FileUploader] Uploading file", {
          projectId,
          filename: file.name,
          sizeBytes: file.size,
          mimeType: file.type,
        });
        const response = await fetch(`/api/files/${encodeURIComponent(projectId)}/upload`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const message = await response.text().catch(() => "Upload request failed");
          throw new Error(`[FileUploader] Upload failed (${response.status}): ${message}`);
        }
      }
      router.refresh();
      console.info("[FileUploader] Upload batch completed", {
        projectId,
        totalFiles: acceptedFiles.length,
      });
    } catch (error) {
      console.error("[FileUploader] Upload failed", {
        projectId,
        error,
      });
    } finally {
      setIsUploading(false);
    }
  }, [projectId, router]);

  const onDropRejected = useCallback((fileRejections: FileRejection[]) => {
    console.warn("[FileUploader] Rejected files", {
      projectId,
      rejections: fileRejections.map((rejection) => ({
        name: rejection.file.name,
        sizeBytes: rejection.file.size,
        mimeType: rejection.file.type,
        errors: rejection.errors.map((error) => ({
          code: error.code,
          message: error.message,
        })),
      })),
    });
  }, [projectId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
  });

  return (
    <div 
      {...getRootProps()} 
      className={`${styles.dropzone} ${isDragActive ? styles.active : ""} ${isUploading ? styles.uploading : ""}`}
    >
      <input {...getInputProps()} />
      {isUploading ? (
        <>
          <Loader2 size={32} className={styles.spinner} />
          <p>Subiendo archivos...</p>
        </>
      ) : (
        <>
          <FileText size={32} />
          {isDragActive ? (
            <p>Suelta los archivos aquí</p>
          ) : (
            <p>Arrastra archivos aquí o haz clic</p>
          )}
        </>
      )}
    </div>
  );
}
