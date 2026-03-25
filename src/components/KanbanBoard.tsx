"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { updateProjectPhase, updateProjectStatus } from "@/lib/actions";
import { Calendar } from "lucide-react";
import styles from "./KanbanBoard.module.css";

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

const COLUMNS = ["Nuevo", "Cotización Enviada", "En Proceso", "Terminado", "Perdido"];

export default function KanbanBoard({ initialProjects }: { initialProjects: Project[] }) {
  const [projects, setProjects] = useState(initialProjects);
  const [hoveredColumn, setHoveredColumn] = useState<string | null>(null);
  const columnRefs = useRef<(HTMLDivElement | null)[]>([]);
  const boardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setProjects(initialProjects);
  }, [initialProjects]);

  // Sorting Logic: 
  // 1. Recurrent first, then by price descending
  // 2. Freelance by completion date / created date (as requested: date of creation)
  const getSortedProjectsInColumn = (col: string) => {
    return projects
      .filter(p => p.phase === col)
      .sort((a, b) => {
        // Priority 1: Recurrent (!isFreelance) first
        if (a.isFreelance !== b.isFreelance) {
          return a.isFreelance ? 1 : -1;
        }
        
        if (!a.isFreelance) {
          // Recurrent: Budget descending
          return b.basePrice - a.basePrice;
        } else {
          // Freelance: Creation date descending (newest first)
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
      });
  };

  const calculateColumn = (pointX: number) => {
    let colName = null;
    columnRefs.current.forEach((ref, index) => {
      if (ref) {
        const rect = ref.getBoundingClientRect();
        if (pointX >= rect.left && pointX <= rect.right) {
          colName = COLUMNS[index];
        }
      }
    });
    return colName;
  };

  const handleDragUpdate = (pointX: number) => {
    const col = calculateColumn(pointX);
    if (col !== hoveredColumn) {
      setHoveredColumn(col);
    }
  };

  const handleDragEnd = async (projectId: string, pointX: number, currentPhase: string) => {
    const newPhase = calculateColumn(pointX) || currentPhase;
    setHoveredColumn(null);

    if (newPhase !== currentPhase) {
      // Sync status based on phase
      let newStatus = projects.find(p => p.id === projectId)?.status || "Abierto";
      if (newPhase === "Perdido") newStatus = "Perdido";
      else if (newPhase === "Terminado") newStatus = "Terminado";
      else if (currentPhase === "Perdido" || currentPhase === "Terminado") newStatus = "Abierto";

      // Optimistic UI update
      const updatedProjects = projects.map(p => 
        p.id === projectId ? { ...p, phase: newPhase, status: newStatus } : p
      );
      setProjects(updatedProjects);

      // Sync with DB
      try {
        await updateProjectPhase(projectId, newPhase);
        if (newStatus !== projects.find(p => p.id === projectId)?.status) {
          await updateProjectStatus(projectId, newStatus);
        }
      } catch (error) {
        setProjects(projects);
        console.error("Failed to update phase:", error);
      }
    }
  };

  const moveDirectly = async (projectId: string, newPhase: string) => {
    let newStatus = projects.find(p => p.id === projectId)?.status || "Abierto";
    if (newPhase === "Perdido") newStatus = "Perdido";
    else if (newPhase === "Terminado") newStatus = "Terminado";
    
    const updatedProjects = projects.map(p => 
      p.id === projectId ? { ...p, phase: newPhase, status: newStatus } : p
    );
    setProjects(updatedProjects);
    await updateProjectPhase(projectId, newPhase);
    if (newPhase === "Perdido" || newPhase === "Terminado") {
      await updateProjectStatus(projectId, newStatus);
    }
  };

  const updateStatus = async (projectId: string, newStatus: string) => {
    let newPhase = projects.find(p => p.id === projectId)?.phase || "Nuevo";
    if (newStatus === "Perdido") newPhase = "Perdido";
    else if (newStatus === "Terminado") newPhase = "Terminado";
    else if (newStatus === "Abierto" && (newPhase === "Perdido" || newPhase === "Terminado")) newPhase = "En Proceso";

    const updatedProjects = projects.map(p => 
      p.id === projectId ? { ...p, status: newStatus, phase: newPhase } : p
    );
    setProjects(updatedProjects);
    await updateProjectStatus(projectId, newStatus);
    if (newStatus === "Perdido" || newStatus === "Terminado") {
      await updateProjectPhase(projectId, newPhase);
    }
  };

  return (
    <div className={styles.kanbanBoard} ref={boardRef}>
      {COLUMNS.map((column, index) => (
        <div 
          key={column} 
          ref={(el) => { columnRefs.current[index] = el; }}
          className={`${styles.column} ${hoveredColumn === column ? styles.highlightColumn : ""}`}
        >
          <div className={styles.columnHeader}>
            <h3 className={styles.columnTitle}>{column}</h3>
            <span className={styles.columnCount}>
              {getSortedProjectsInColumn(column).length}
            </span>
          </div>
          
          <div className={styles.columnBody}>
            <AnimatePresence mode="popLayout">
              {getSortedProjectsInColumn(column).map((project) => (
                <motion.div
                  key={project.id}
                  layoutId={project.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ scale: 1.03, zIndex: 50 }}
                  whileDrag={{ 
                    scale: 1.1, 
                    zIndex: 1000, 
                    boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
                    cursor: "grabbing",
                    opacity: 0.9
                  }}
                  drag
                  dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                  dragElastic={1}
                  dragMomentum={false}
                  onDrag={(e, info) => handleDragUpdate(info.point.x)}
                  onDragEnd={(e, info) => handleDragEnd(project.id, info.point.x, project.phase)}
                  className={`glass-panel ${styles.projectCard}`}
                >
                  <div className={styles.cardContent}>
                    <div className={styles.cardHeader}>
                      {project.isFreelance && project.slaDate && (
                        <span className={styles.slaBadge}>
                          <Calendar size={10} />
                          {new Date(project.slaDate).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' })}
                        </span>
                      )}
                      <span className={`${styles.statusBadge} ${styles[project.status.toLowerCase()]}`}>
                        {project.status}
                      </span>
                      {project.isFreelance ? (
                        <span className={styles.freelanceBadge}>Freelance</span>
                      ) : (
                        <span className={styles.recurrentBadge}>Recurrente</span>
                      )}
                    </div>
                    
                    <Link 
                      href={`/proyectos/${project.id}`} 
                      className={styles.projectTitle}
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      {project.title}
                    </Link>
                    
                    <p className={styles.projectDesc}>
                      {project.description.substring(0, 60)}...
                    </p>
                    
                    <div className={styles.cardFooter}>
                      <div className={styles.statusToggle} onPointerDown={(e) => e.stopPropagation()}>
                        <button 
                          className={`${styles.statusDot} ${
                            project.status === 'Abierto' ? styles.statusOpen : 
                            project.status === 'Terminado' ? styles.statusDone : 
                            styles.statusLost
                          }`}
                          onClick={() => {
                            let nextStatus = 'Abierto';
                            if (project.status === 'Abierto') nextStatus = 'Perdido';
                            else if (project.status === 'Perdido') nextStatus = 'Terminado';
                            updateStatus(project.id, nextStatus);
                          }}
                          title={`Estado: ${project.status}. Haz clic para cambiar.`}
                        />
                        <span className={styles.price}>
                          ${project.basePrice.toLocaleString()} {project.isFreelance ? '' : '/ mes'}
                        </span>
                      </div>
                      
                      <div className={styles.phaseDots} onPointerDown={(e) => e.stopPropagation()}>
                        {COLUMNS.map(c => (
                          <button
                            key={c}
                            className={`${styles.dot} ${project.phase === c ? styles.activeDot : ""}`}
                            onClick={() => moveDirectly(project.id, c)}
                            title={`Mover a ${c}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {getSortedProjectsInColumn(column).length === 0 && (
              <div className={styles.emptyColumn}>Sin proyectos</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
