"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, Calendar, Briefcase, Wallet, Check } from "lucide-react";
import styles from "./ProjectList.module.css";
import { updateProjectField, updateProjectPhase } from "@/lib/actions";

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

const PHASES = ["Nuevo", "Cotización Enviada", "En Proceso", "Terminado", "Perdido"];

const getStatusClass = (status: string) => {
  const s = status.toLowerCase();
  if (s.includes('abie')) return styles.abierto;
  if (s.includes('term')) return styles.terminado;
  if (s.includes('perd')) return styles.perdido;
  return "";
};

const getTypeLabel = (project: any) => {
  if (project.projectType === 'IGUALA') return "Iguala";
  if (project.projectType === 'CORPORATE') return "Corporativo";
  return project.isFreelance ? "Freelance" : "Recurrente";
};

export default function ProjectList({ projects: initialProjects }: { projects: Project[] }) {
  const [projects, setProjects] = useState(initialProjects);
  const [editing, setEditing] = useState<{ id: string, field: string } | null>(null);
  const [tempValue, setTempValue] = useState<string>("");

  const startEditing = (project: Project, field: string, value: string) => {
    setEditing({ id: project.id, field });
    setTempValue(value);
  };

  const handleSave = async () => {
    if (!editing) return;
    const { id, field } = editing;
    
    // Save locally
    const updated = projects.map(p => 
      p.id === id ? { ...p, [field]: field === 'basePrice' ? Number(tempValue) : tempValue } : p
    );
    setProjects(updated);
    
    // Sync with DB
    await updateProjectField(id, field, tempValue);
    setEditing(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') setEditing(null);
  };

  const handlePhaseChange = async (projectId: string, newPhase: string) => {
    // Optimistic UI update
    setProjects(projects.map(p => 
      p.id === projectId ? { ...p, phase: newPhase } : p
    ));
    
    // Sync with DB
    await updateProjectPhase(projectId, newPhase);
    setEditing(null);
  };

  return (
    <div className={`glass-panel ${styles.container}`}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Proyecto</th>
            <th>Fase</th>
            <th>Estado</th>
            <th>Tipo</th>
            <th>SLA</th>
            <th>Presupuesto</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <tr key={project.id}>
              <td>
                <div className={styles.projectInfo}>
                  {editing?.id === project.id && editing.field === 'title' ? (
                    <div className={styles.inlineEdit}>
                      <input 
                        type="text" 
                        value={tempValue} 
                        onChange={(e) => setTempValue(e.target.value)}
                        onBlur={handleSave}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        className={styles.editInput}
                      />
                    </div>
                  ) : (
                    <span 
                      className={`${styles.projectTitle} ${styles.editable}`}
                      onClick={() => startEditing(project, 'title', project.title)}
                    >
                      {project.title}
                    </span>
                  )}
                  <span className={styles.projectDesc}>{project.description.substring(0, 40)}...</span>
                </div>
              </td>
              <td>
                {editing?.id === project.id && editing.field === 'phase' ? (
                  <select 
                    className={styles.phaseSelect}
                    value={project.phase}
                    onChange={(e) => handlePhaseChange(project.id, e.target.value)}
                    onBlur={() => setEditing(null)}
                    autoFocus
                  >
                    {PHASES.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                ) : (
                  <span 
                    className={`${styles.phaseBadge} ${styles.editable}`}
                    onClick={() => startEditing(project, 'phase', project.phase)}
                  >
                    {project.phase}
                  </span>
                )}
              </td>
              <td>
                <span className={`${styles.statusBadge} ${getStatusClass(project.status)}`}>
                  {project.status}
                </span>
              </td>
              <td>
                <div className={styles.typeBadge}>
                  {project.projectType === 'FREELANCE' ? <Briefcase size={14} /> : <Wallet size={14} />}
                  <span>{getTypeLabel(project)}</span>
                </div>
              </td>
              <td>
                <div className={styles.slaCell}>
                  {editing?.id === project.id && editing.field === 'slaDate' ? (
                    <div className={styles.dateEditContainer}>
                      <input 
                        type="date" 
                        defaultValue={project.slaDate ? new Date(project.slaDate).toISOString().split('T')[0] : ""}
                        onChange={async (e) => {
                          const newVal = e.target.value || null;
                          // Optimistic local update
                          setProjects(projects.map(p => p.id === project.id ? { ...p, slaDate: newVal ? new Date(newVal).toISOString() : null } : p));
                          await updateProjectField(project.id, 'slaDate', e.target.value);
                          setEditing(null);
                        }}
                        onBlur={() => setEditing(null)}
                        autoFocus
                        className={styles.editInputDate}
                      />
                      <button 
                        className={styles.clearDateBtn}
                        onMouseDown={async (e) => {
                          e.preventDefault(); // Prevent input onBlur from firing first
                          e.stopPropagation();
                          setProjects(projects.map(p => p.id === project.id ? { ...p, slaDate: null } : p));
                          await updateProjectField(project.id, 'slaDate', "");
                          setEditing(null);
                        }}
                        title="Quitar fecha"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <span 
                      className={`${styles.slaText} ${styles.editable}`}
                      onClick={() => startEditing(project, 'slaDate', project.slaDate || "")}
                    >
                      {project.slaDate ? new Date(project.slaDate).toLocaleDateString() : 'Sin fecha'}
                    </span>
                  )}
                </div>
              </td>
              <td>
                {editing?.id === project.id && editing.field === 'basePrice' ? (
                  <div className={styles.inlineEdit}>
                    <input 
                      type="number" 
                      value={tempValue} 
                      onChange={(e) => setTempValue(e.target.value)}
                      onBlur={handleSave}
                      onKeyDown={handleKeyDown}
                      autoFocus
                      className={styles.editInputSmall}
                    />
                  </div>
                ) : (
                  <span 
                    className={`${styles.price} ${project.projectType === 'FREELANCE' ? styles.editable : ""}`}
                    onClick={() => {
                      if (project.projectType === 'FREELANCE') {
                        startEditing(project, 'basePrice', project.basePrice.toString());
                      }
                    }}
                  >
                    ${project.basePrice.toLocaleString()} {project.projectType === 'FREELANCE' ? "" : "/ mes"}
                  </span>
                )}
              </td>
              <td>
                <Link href={`/proyectos/${project.id}`} className={styles.viewBtn}>
                  <ExternalLink size={16} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {projects.length === 0 && (
        <div className={styles.empty}>No hay proyectos registrados.</div>
      )}
    </div>
  );
}
