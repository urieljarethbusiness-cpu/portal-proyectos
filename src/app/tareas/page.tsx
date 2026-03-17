import { prisma } from "@/lib/prisma";
import styles from "./page.module.css";
import { AlertCircle } from "lucide-react";
import TaskManager from "@/components/TaskManager";

export default async function TareasPage() {
  const rawProjects = await prisma.project.findMany({
    include: {
      tasks: {
        orderBy: [
          { isCompleted: 'asc' },
          { createdAt: 'desc' }
        ]
      }
    }
  });

  // Sort: Projects with pending tasks first
  const projectsWithTasks = rawProjects.sort((a, b) => {
    const aPending = a.tasks.some(t => !t.isCompleted);
    const bPending = b.tasks.some(t => !t.isCompleted);
    if (aPending && !bPending) return -1;
    if (!aPending && bPending) return 1;
    return 0;
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Tareas Globales</h1>
          <p className={styles.subtitle}>Gestiona todas las tareas de tus proyectos desde un solo lugar</p>
        </div>
      </header>

      <div className={styles.content}>
        {projectsWithTasks.length === 0 ? (
          <div className={`glass-panel ${styles.emptyState}`}>
            <AlertCircle size={48} />
            <p>No hay proyectos ni tareas creadas aún.</p>
          </div>
        ) : (
          <div className={styles.projectsGrid}>
            {projectsWithTasks.map(project => (
              <div key={project.id} className={styles.projectWrapper}>
                <TaskManager 
                  projectId={project.id} 
                  tasks={project.tasks as any} 
                  title={project.title} 
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
