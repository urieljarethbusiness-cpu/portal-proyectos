import { prisma } from "@/lib/prisma";
import styles from "./page.module.css";
import {
  FileText, FolderOpen, ExternalLink, AlertTriangle,
  Trash2, CheckCircle2, Download, Archive, FileJson,
  FileImage
} from "lucide-react";

import Link from "next/link";
import { getFilesInventory, deleteResidualFile, registerFileToProject } from "@/lib/file-inventory";

// Returns an icon based on file extension
function getFileIcon(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg","jpeg","png","gif","svg","webp"].includes(ext)) return <FileImage size={16} />;
  if (["json"].includes(ext)) return <FileJson size={16} />;
  return <FileText size={16} />;
}

export default async function ArchivosPage() {
  const projectsWithAttachments = await prisma.project.findMany({
    include: { attachments: true },
    where: { attachments: { some: {} } },
    orderBy: { updatedAt: "desc" }
  });

  const residualFiles = await getFilesInventory();

  const totalFiles = projectsWithAttachments.reduce((s, p) => s + p.attachments.length, 0);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Repositorio de Archivos</h1>
          <p className={styles.subtitle}>
            {totalFiles} {totalFiles === 1 ? "archivo" : "archivos"} en {projectsWithAttachments.length} {projectsWithAttachments.length === 1 ? "proyecto" : "proyectos"}
          </p>
        </div>

        {residualFiles.length > 0 && (
          <div className={styles.residualWarningBadge}>
            <AlertTriangle size={14} />
            {residualFiles.length} residual{residualFiles.length > 1 ? "es" : ""}
          </div>
        )}
      </header>

      {projectsWithAttachments.length === 0 && residualFiles.length === 0 ? (
        <div className={`glass-panel ${styles.emptyState}`}>
          <FolderOpen size={56} />
          <p className={styles.emptyTitle}>Sin archivos por ahora</p>
          <p className={styles.emptySubtitle}>Los archivos que subas a tus proyectos aparecerán aquí.</p>
        </div>
      ) : (
        <>
          {projectsWithAttachments.length > 0 && (
            <div className={styles.grid}>
              {projectsWithAttachments.map(project => (
                <div key={project.id} className={`glass-panel ${styles.projectFolder}`}>
                  {/* Folder Header */}
                  <div className={styles.folderHeader}>
                    <div className={styles.folderMeta}>
                      <h2 className={styles.projectName}>{project.title}</h2>
                      <span className={styles.fileCount}>
                        {project.attachments.length} {project.attachments.length === 1 ? "archivo" : "archivos"}
                      </span>
                    </div>
                    <div className={styles.folderActions}>
                      {/* ZIP download — always visible */}
                      <a
                        href={`/api/files/${project.id}/download-zip`}
                        className={styles.btnZip}
                        title="Descargar todo en ZIP"
                      >
                        <Archive size={14} />
                        <span>Descargar ZIP</span>
                      </a>
                      <Link href={`/proyectos/${project.id}`} className={styles.linkBtn} title="Ver proyecto">
                        <ExternalLink size={15} />
                      </Link>
                    </div>
                  </div>

                  {/* File List */}
                  <div className={styles.fileList}>
                    {project.attachments.map(file => (
                      <div key={file.id} className={styles.fileItem}>
                        <span className={styles.fileIcon}>
                          {getFileIcon(file.filename)}
                        </span>
                        <div className={styles.fileInfo}>
                          <span className={styles.fileName} title={file.filename}>
                            {file.filename}
                          </span>
                          <span className={styles.fileDate}>
                            {file.uploadedAt.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
                          </span>
                        </div>
                        {/* Download button — always visible on the right */}
                        <a
                          href={`/api/files/${project.id}/${encodeURIComponent(file.filename)}`}
                          download={file.filename}
                          className={styles.downloadBtn}
                          title="Descargar archivo"
                        >
                          <Download size={14} />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Residual files section */}
      {residualFiles.length > 0 && (
        <div className={styles.residualSection}>
          <div className={styles.residualSectionHeader}>
            <div className={styles.residualTitle}>
              <AlertTriangle size={20} />
              Archivos Residuales
            </div>
            <p className={styles.residualSubtitle}>
              Archivos en disco sin vinculación a la base de datos.
              Puedes eliminarlos o vincularlos de vuelta al proyecto correspondiente.
            </p>
          </div>

          <div className={styles.residualGrid}>
            {residualFiles.map((file, idx) => (
              <div
                key={`${file.projectId}-${file.filename}-${idx}`}
                className={styles.residualCard}
              >
                <div className={styles.residualCardTop}>
                  <span className={`${styles.residualBadge} ${file.reason === "orphan_folder" ? styles.badgeOrphan : styles.badgeMissing}`}>
                    {file.reason === "orphan_folder" ? "Carpeta Huérfana" : "No vinculado"}
                  </span>
                  <span className={styles.residualProject}>{file.projectName || file.projectId}</span>
                </div>

                {/* File row with download button */}
                <div className={styles.residualFile}>
                  <span className={styles.residualFileIcon}>
                    {getFileIcon(file.filename)}
                  </span>
                  <span className={styles.residualFileName} title={file.filename}>
                    {file.filename}
                  </span>
                  <a
                    href={`/api/files/${file.projectId}/${encodeURIComponent(file.filename)}`}
                    download={file.filename}
                    className={styles.downloadBtnResidual}
                    title="Descargar archivo residual"
                  >
                    <Download size={13} />
                  </a>
                </div>

                <div className={styles.residualActions}>
                  {file.reason === "missing_db_record" && (
                    <form action={async () => {
                      "use server";
                      await registerFileToProject(file.projectId, file.filename);
                    }}>
                      <button type="submit" className={`${styles.btnResidual} ${styles.btnVincular}`}>
                        <CheckCircle2 size={13} />
                        Vincular
                      </button>
                    </form>
                  )}
                  {/* ZIP download — works for both linked and orphan folders */}
                  <a
                    href={`/api/files/${file.projectId}/download-zip`}
                    className={`${styles.btnResidual} ${styles.btnZipResidual}`}
                    title="Descargar en ZIP"
                  >
                    <Archive size={13} />
                    ZIP
                  </a>
                  <form action={async () => {
                    "use server";
                    await deleteResidualFile(file.projectId, file.filename);
                  }}>
                    <button type="submit" className={`${styles.btnResidual} ${styles.btnEliminar}`}>
                      <Trash2 size={13} />
                      Eliminar
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
