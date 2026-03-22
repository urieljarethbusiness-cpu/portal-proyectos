export const dynamic = 'force-dynamic';

import { prisma } from "@/lib/prisma";
import styles from "./page.module.css";
import { ArrowLeft, DollarSign, Plus, FileText, Calendar, Wallet, Trash2, CheckCircle2, Repeat } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import TaskManager from "@/components/TaskManager";
import DeleteProjectBtn from "@/components/DeleteProjectBtn";
import FileUploader from "@/components/FileUploader";
import NoteManager from "@/components/NoteManager";
import StatusSelector from "@/components/StatusSelector";
import PaymentManager from "@/components/PaymentManager";
import FileManager from "@/components/FileManager";
import ProjectSettings from "@/components/ProjectSettings";
import { addExtra, addPayment, deleteAttachment } from "@/lib/actions";

export default async function ProyectoDetalle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // Fetch project basic info
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      extras: true,
      payments: true,
      attachments: true,
      notes: {
        orderBy: { createdAt: 'desc' }
      },
      tasks: {
        orderBy: { createdAt: 'desc' }
      },
    }
  });

  if (!project) notFound();

  const notes = project.notes;
  const extrasTotal = project.extras.reduce((sum, extra) => sum + extra.cost, 0);
  const totalValue = project.basePrice + extrasTotal;
  const totalPaid = project.payments
    .filter(p => p.isPaid)
    .reduce((sum, p) => sum + p.amount, 0);
  const remainingBalance = totalValue - totalPaid;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link href="/proyectos" className={styles.backBtn}>
          <ArrowLeft size={20} />
          <span>Regresar al Kanban</span>
        </Link>
        <DeleteProjectBtn id={project.id} />
      </header>

      <div className={styles.mainContent}>
        <div className={styles.leftCol}>
          <section className={`glass-panel ${styles.headerCard}`}>
            <ProjectSettings
              project={{
                id: project.id,
                title: project.title,
                projectType: project.projectType,
                slaDate: project.slaDate,
                billingFrequency: project.billingFrequency,
                billingName: project.billingName
              }}
              statusSlot={<StatusSelector id={project.id} currentStatus={project.status} />}
            />
            <p className={styles.description}>{project.description}</p>
          </section>

          <section className={`glass-panel ${styles.section}`}>
            <TaskManager projectId={project.id} tasks={project.tasks} title="Tareas del Proyecto" />
          </section>

          <section className={`glass-panel ${styles.section}`}>
            <NoteManager projectId={project.id} notes={notes} title="Notas y Comentarios" />
          </section>

          <section className={`glass-panel ${styles.section}`}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Estado Financiero</h2>
            </div>
            
            <div className={styles.financesGrid}>
              <div className={styles.finCard}>
                <span className={styles.finLabel}>
                  {project.projectType === "FREELANCE" ? "Costo Total" : "Monto Recurrente"}
                </span>
                <span className={styles.finValue}>${totalValue.toLocaleString()}</span>
              </div>
              <div className={styles.finCard}>
                <span className={styles.finLabel}>Cobrado Total</span>
                <span className={`${styles.finValue} ${styles.successText}`}>${totalPaid.toLocaleString()}</span>
              </div>
              <div className={`${styles.finCardTotal} ${remainingBalance > 0 ? styles.alertCard : ""}`}>
                <span className={styles.finLabel}>Saldo Pendiente</span>
                <span className={styles.finValueTotal}>${remainingBalance.toLocaleString()}</span>
              </div>
            </div>

            {project.projectType !== "FREELANCE" && (
              <div className={styles.recurrenceOverview}>
                <div className={styles.recurrenceBadge}>
                  <Repeat size={16} />
                  <span>
                    {project.billingName || "Plan Recurrente"}: {project.billingFrequency}
                  </span>
                </div>
                <p className={styles.recurrenceHelp}>
                  Los pagos se generan automáticamente al marcar el hito actual como cobrado. 
                  Ref. Inicio: {project.slaDate ? new Date(project.slaDate).toLocaleDateString() : 'No definida'}
                </p>
              </div>
            )}

            <div className={styles.managementGrid}>
              <div className={styles.formCol}>
                <h3 className={styles.subTitle}>Conceptos Extras</h3>
                <form action={addExtra.bind(null, project.id)} className={styles.miniForm} suppressHydrationWarning>
                  <input name="title" placeholder="Concepto (ej. Hosting)" required suppressHydrationWarning />
                  <input name="cost" type="number" step="0.01" placeholder="Costo" required suppressHydrationWarning />
                  <button type="submit" suppressHydrationWarning><Plus size={16} /></button>
                </form>
                <div className={styles.extrasList}>
                  {project.extras.map(e => (
                    <div key={e.id} className={styles.extraItem}>
                      <span>{e.title}</span>
                      <span className={styles.extraCost}>+${e.cost}</span>
                    </div>
                  ))}
                  {project.extras.length === 0 && (
                    <p className={styles.emptyTextSimple}>Sin costos adicionales.</p>
                  )}
                </div>
              </div>

              <div className={styles.formCol}>
                <h3 className={styles.subTitle}>Plan de Pagos / Hitos</h3>
                <PaymentManager projectId={project.id} payments={project.payments} />
              </div>
            </div>
          </section>
        </div>

        <div className={styles.rightCol}>
          <section className={`glass-panel ${styles.sideSection}`}>
            <h2 className={styles.sectionTitle}>Resumen Financiero</h2>
            <div className={styles.progressSection}>
              <div className={styles.progressHeader}>
                <span className={styles.progressLabel}>Progreso de Cobro</span>
                <span className={styles.progressPercent}>{totalValue > 0 ? Math.round((totalPaid / totalValue) * 100) : 0}%</span>
              </div>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill} 
                  style={{ width: `${totalValue > 0 ? (totalPaid / totalValue) * 100 : 0}%` }}
                />
              </div>
              <div className={styles.progressFooter}>
                <span>${totalPaid.toLocaleString()} cobrados</span>
                <span>${totalValue.toLocaleString()} total</span>
              </div>
            </div>
            
            <div className={styles.debtAlert}>
              {remainingBalance > 0 ? (
                <div className={styles.alertPending}>
                  <DollarSign size={16} />
                  <span>Pendiente: ${remainingBalance.toLocaleString()}</span>
                </div>
              ) : (
                <div className={styles.alertPaid}>
                  <CheckCircle2 size={16} />
                  <span>Saldado</span>
                </div>
              )}
            </div>
          </section>

          <FileManager projectId={project.id} attachments={project.attachments} />
        </div>
      </div>
    </div>
  );
}
