"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { FileText, Loader2 } from "lucide-react";
import { uploadFile } from "@/lib/actions";
import styles from "./FileUploader.module.css";

export default function FileUploader({ projectId }: { projectId: string }) {
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    setIsUploading(true);
    try {
      for (const file of acceptedFiles) {
        const formData = new FormData();
        formData.append("file", file);
        await uploadFile(projectId, formData);
      }
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
    }
  }, [projectId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

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
