import { Activity, Clock, DollarSign, Briefcase } from "lucide-react";
import styles from "./page.module.css";
import { prisma } from "@/lib/prisma";
import FinanceChart from "@/components/FinanceChart";
import Link from "next/link";

export default async function Dashboard() {
  // Fetch overall statistics
  const totalProjects = await prisma.project.count();
  const activeProjects = await prisma.project.count({ where: { status: "Abierto" }});
  const totalTasks = await prisma.task.count();
  const completedTasks = await prisma.task.count({ where: { isCompleted: true }});

  // Calculate estimated earnings (Base price + Extras)
  const allProjects = await prisma.project.findMany({
    include: { extras: true, payments: true }
  });

  const estimatedEarnings = allProjects.reduce((sum, project) => {
    const extrasTotal = project.extras.reduce((extraSum, extra) => extraSum + extra.cost, 0);
    return sum + project.basePrice + extrasTotal;
  }, 0);

  const mrr = allProjects
    .filter(p => !p.isFreelance && p.status === "Abierto")
    .reduce((sum, p) => sum + p.basePrice, 0);

  // Chart Data: Sum payments by month
  const chartDataRaw = allProjects.flatMap(p => p.payments)
    .filter(pay => pay.isPaid)
    .reduce((acc: any, pay) => {
      const month = pay.expectedDate ? new Date(pay.expectedDate).toLocaleString('es-ES', { month: 'short' }) : 'S/F';
      acc[month] = (acc[month] || 0) + pay.amount;
      return acc;
    }, {});

  const chartData = Object.keys(chartDataRaw).map(month => ({
    name: month,
    ingresos: chartDataRaw[month]
  }));

  // Mock data if empty for visualization
  const finalChartData = chartData.length > 0 ? chartData : [
    { name: 'Ene', ingresos: 1200 },
    { name: 'Feb', ingresos: 3400 },
    { name: 'Mar', ingresos: estimatedEarnings / 2 },
  ];

  // Projects with upcoming SLA (next 7 days)
  const upcomingSLA = await prisma.project.findMany({
    where: {
      status: "Abierto",
      slaDate: {
        lte: new Date(new Date().setDate(new Date().getDate() + 7)),
        gte: new Date(),
      }
    }
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Dashboard General</h1>
          <p className={styles.subtitle}>Resumen de tus proyectos y finanzas</p>
        </div>
      </header>

      <section className={styles.statsGrid}>
        <Link href="/proyectos" className={`glass-panel ${styles.statCard}`}>
          <div className={styles.statIconWrapper} style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <Briefcase size={24} style={{ color: '#fff' }} />
          </div>
          <div className={styles.statInfo}>
            <p className={styles.statLabel}>Proyectos Totales</p>
            <h3 className={styles.statValue}>{totalProjects}</h3>
          </div>
        </Link>

        <Link href="/proyectos" className={`glass-panel ${styles.statCard}`}>
          <div className={styles.statIconWrapper} style={{ background: 'rgba(59, 226, 135, 0.1)', border: '1px solid rgba(59, 226, 135, 0.3)' }}>
            <Activity size={24} style={{ color: 'var(--success)' }} />
          </div>
          <div className={styles.statInfo}>
            <p className={styles.statLabel}>Proyectos Activos</p>
            <h3 className={styles.statValue}>{activeProjects}</h3>
          </div>
        </Link>

        <Link href="/tareas" className={`glass-panel ${styles.statCard}`}>
          <div className={styles.statIconWrapper} style={{ background: 'rgba(255, 184, 77, 0.1)', border: '1px solid rgba(255, 184, 77, 0.3)' }}>
            <Clock size={24} style={{ color: 'var(--warning)' }} />
          </div>
          <div className={styles.statInfo}>
            <p className={styles.statLabel}>Tareas Pendientes</p>
            <h3 className={styles.statValue}>{totalTasks - completedTasks}</h3>
          </div>
        </Link>

        <Link href="/finanzas" className={`glass-panel ${styles.statCard}`}>
          <div className={styles.statIconWrapper} style={{ background: 'rgba(89, 220, 201, 0.1)', border: '1px solid rgba(89, 220, 201, 0.3)' }}>
            <DollarSign size={24} style={{ color: 'var(--primary)' }} />
          </div>
          <div className={styles.statInfo}>
            <div className={styles.statHeader}>
              <p className={styles.statLabel}>Ingr. Proyectados</p>
              {mrr > 0 && <span className={styles.mrrBadge}>MRR: ${mrr.toLocaleString()}</span>}
            </div>
            <h3 className={styles.statValue}>${estimatedEarnings.toLocaleString('es-MX', { minimumFractionDigits: 0 })}</h3>
          </div>
        </Link>
      </section>

      <div className={styles.mainGrid}>
        <section className={`glass-panel ${styles.chartSection}`}>
          <Link href="/finanzas" style={{ textDecoration: 'none', color: 'inherit' }}>
            <h2 className={styles.sectionTitle}>Progreso Financiero</h2>
          </Link>
          <div className={styles.chartContainer}>
            <FinanceChart data={finalChartData} />
          </div>
        </section>

        <section className={`glass-panel ${styles.alertsSection}`}>
          <h2 className={styles.sectionTitle}>Atención Requerida (SLA)</h2>
          <div className={styles.alertsList}>
            {upcomingSLA.length === 0 ? (
              <p className={styles.placeholderText}>No hay proyectos en riesgo actualmente.</p>
            ) : (
              <ul className={styles.alertItems}>
                {upcomingSLA.map(project => (
                  <Link key={project.id} href={`/proyectos/${project.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <li className={styles.alertItem}>
                      <div className={styles.alertDot}></div>
                      <div className={styles.alertInfo}>
                        <span className={styles.alertProject}>{project.title}</span>
                        <span className={styles.alertDate}>
                          Vence el {project.slaDate?.toLocaleDateString('es-ES')}
                        </span>
                      </div>
                    </li>
                  </Link>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
