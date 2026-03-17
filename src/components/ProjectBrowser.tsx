"use client";

import { useState, useEffect } from "react";
import { LayoutGrid, List, Calendar } from "lucide-react";
import KanbanBoard from "./KanbanBoard";
import ProjectList from "./ProjectList";
import NewProjectModal from "./NewProjectModal";
import styles from "./ProjectBrowser.module.css";
import { updateProjectPhase } from "@/lib/actions";

interface Project {
  id: string;
  title: string;
  description: string;
  basePrice: number;
  phase: string;
  status: string;
  isFreelance: boolean;
  projectType: string;
  slaDate: string | null;
  createdAt: string;
}

const PHASE_MAP: Record<string, string> = {
  "Pendiente": "Nuevo",
  "En Progreso": "En Proceso",
  "En Revisión": "Cotización Enviada"
};

export default function ProjectBrowser({ initialProjects }: { initialProjects: Project[] }) {
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [projects, setProjects] = useState(initialProjects);

  // Auto-migrate old phases on the client side to ensure they show up
  useEffect(() => {
    const needsMigration = initialProjects.some(p => PHASE_MAP[p.phase]);
    if (needsMigration) {
      const migrated = initialProjects.map(p => {
        if (PHASE_MAP[p.phase]) {
          const newPhase = PHASE_MAP[p.phase];
          // We don't necessarily need to await here, it's a best-effort background sync
          updateProjectPhase(p.id, newPhase);
          return { ...p, phase: newPhase };
        }
        return p;
      });
      setProjects(migrated);
    } else {
      setProjects(initialProjects);
    }
  }, [initialProjects]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Proyectos</h1>
          <p className={styles.subtitle}>
            {viewMode === "kanban" 
              ? "Gestiona el flujo de trabajo de cada proyecto" 
              : "Listado detallado de todos los proyectos"}
          </p>
        </div>
        
        <div className={styles.actions}>
          <div className={styles.viewSwitch}>
            <button 
              className={`${styles.switchBtn} ${viewMode === "kanban" ? styles.active : ""}`}
              onClick={() => setViewMode("kanban")}
              title="Vista Kanban"
            >
              <LayoutGrid size={20} />
            </button>
            <button 
              className={`${styles.switchBtn} ${viewMode === "list" ? styles.active : ""}`}
              onClick={() => setViewMode("list")}
              title="Vista Lista"
            >
              <List size={20} />
            </button>
          </div>
          <NewProjectModal />
        </div>
      </header>

      {viewMode === "kanban" ? (
        <KanbanBoard initialProjects={projects} />
      ) : (
        <ProjectList projects={projects} />
      )}
    </div>
  );
}
