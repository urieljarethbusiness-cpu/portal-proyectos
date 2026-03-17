import { prisma } from "@/lib/prisma";
import styles from "./page.module.css";
import { ArrowLeft, DollarSign, Wallet, TrendingUp, Calendar } from "lucide-react";
import Link from "next/link";

export default async function FinanzasPage() {
  const allProjects = await prisma.project.findMany({
    include: { payments: true, extras: true }
  });

  const allPayments = allProjects.flatMap(project => 
    project.payments.map(payment => ({
      ...payment,
      projectTitle: project.title
    }))
  ).sort((a, b) => {
    const dateA = a.expectedDate ? new Date(a.expectedDate).getTime() : 0;
    const dateB = b.expectedDate ? new Date(b.expectedDate).getTime() : 0;
    return dateB - dateA;
  });

  const totalReceived = allPayments
    .filter(p => p.isPaid)
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingCollection = allPayments
    .filter(p => !p.isPaid)
    .reduce((sum, p) => sum + p.amount, 0);

  const totalEarningsActual = allProjects.reduce((sum, p) => {
      const extras = p.extras.reduce((s, e) => s + e.cost, 0);
      return sum + p.basePrice + extras;
  }, 0);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href="/" className={styles.backBtn}>
            <ArrowLeft size={18} />
            <span>Volver al Dashboard</span>
          </Link>
          <h1 className={styles.title}>Listado Financiero</h1>
        </div>
      </header>

      <div className={styles.summaryGrid}>
        <div className={`glass-panel ${styles.summaryCard}`}>
          <div className={`${styles.iconBox} ${styles.received}`}>
            <Wallet size={24} />
          </div>
          <div className={styles.summaryInfo}>
            <span className={styles.summaryLabel}>Total Cobrado</span>
            <h2 className={styles.summaryValue}>${totalReceived.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</h2>
          </div>
        </div>

        <div className={`glass-panel ${styles.summaryCard}`}>
          <div className={`${styles.iconBox} ${styles.pending}`}>
            <TrendingUp size={24} />
          </div>
          <div className={styles.summaryInfo}>
            <span className={styles.summaryLabel}>Pendiente por Cobrar</span>
            <h2 className={styles.summaryValue}>${pendingCollection.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</h2>
          </div>
        </div>

        <div className={`glass-panel ${styles.summaryCard}`}>
          <div className={`${styles.iconBox} ${styles.total}`}>
            <DollarSign size={24} />
          </div>
          <div className={styles.summaryInfo}>
            <span className={styles.summaryLabel}>Ganancia Proyectada</span>
            <h2 className={styles.summaryValue}>${totalEarningsActual.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</h2>
          </div>
        </div>
      </div>

      <section className={`glass-panel ${styles.tableSection}`}>
        <h3 className={styles.tableTitle}>Historial de Pagos y Hitos</h3>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Proyecto</th>
                <th>Descripción</th>
                <th>Fecha</th>
                <th>Monto</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {allPayments.map((payment) => (
                <tr key={payment.id}>
                  <td className={styles.projectCell}>
                    <Link href={`/proyectos/${payment.projectId}`}>{payment.projectTitle}</Link>
                  </td>
                  <td>{payment.description || "Sin descripción"}</td>
                  <td>
                    <div className={styles.dateCell}>
                        <Calendar size={14} />
                        {payment.expectedDate ? new Date(payment.expectedDate).toLocaleDateString() : "S/F"}
                    </div>
                  </td>
                  <td className={styles.amountCell}>${payment.amount.toLocaleString()}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${payment.isPaid ? styles.statusPaid : styles.statusPending}`}>
                      {payment.isPaid ? "Cobrado" : "Pendiente"}
                    </span>
                  </td>
                </tr>
              ))}
              {allPayments.length === 0 && (
                <tr>
                  <td colSpan={5} className={styles.emptyTable}>No hay registros financieros.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
