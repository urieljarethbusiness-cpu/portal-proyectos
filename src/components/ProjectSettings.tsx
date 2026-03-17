"use client";

import { useRef, useState } from "react";
import { Calendar, Wallet, Repeat, ChevronDown, Pencil, Check } from "lucide-react";
import { updateProjectField } from "@/lib/actions";
import styles from "./ProjectSettings.module.css";

interface ProjectSettingsProps {
  project: {
    id: string;
    title: string;
    projectType: string;
    slaDate: Date | null;
    billingFrequency: string;
    billingName: string | null;
  };
}

const FREQUENCIES = [
  { id: "NONE", label: "Único" },
  { id: "WEEKLY", label: "Semanal" },
  { id: "BIWEEKLY", label: "Quincenal" },
  { id: "MONTHLY", label: "Mensual" },
  { id: "ANNUAL", label: "Anual" }
];

const PROJECT_TYPES = [
  { id: "FREELANCE", label: "Freelance" },
  { id: "CORPORATE", label: "Trabajo Corporativo" },
  { id: "IGUALA", label: "Iguala" }
];

export default function ProjectSettings({ project }: ProjectSettingsProps) {
  const [isEditingSLA, setIsEditingSLA] = useState(false);
  const [isEditingBillingName, setIsEditingBillingName] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(project.title);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const saveTitle = () => {
    const trimmed = titleInputRef.current?.value.trim() || titleValue;
    if (trimmed && trimmed !== project.title) {
      setTitleValue(trimmed);
      updateProjectField(project.id, 'title', trimmed);
    }
    setIsEditingTitle(false);
  };

  return (
    <>
    {/* Editable Title */}
    <div className={styles.titleWrapper}>
      {isEditingTitle ? (
        <div className={styles.titleEditRow}>
          <input
            ref={titleInputRef}
            defaultValue={titleValue}
            className={styles.titleInput}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveTitle();
              if (e.key === 'Escape') setIsEditingTitle(false);
            }}
            onBlur={saveTitle}
          />
          <button className={styles.titleSaveBtn} onClick={saveTitle} type="button">
            <Check size={18} />
          </button>
        </div>
      ) : (
        <div className={styles.titleDisplayRow}>
          <h1 className={styles.titleDisplay}>{titleValue}</h1>
          <button
            className={styles.titleEditBtn}
            onClick={() => setIsEditingTitle(true)}
            type="button"
            title="Editar nombre del proyecto"
          >
            <Pencil size={15} />
          </button>
        </div>
      )}
    </div>
    <div className={styles.metaInfo}>
      {/* SLA Date */}
      <div className={styles.metaItem}>
        <Calendar size={18} className={styles.metaIcon} />
        <div className={styles.configBlock}>
          <span className={styles.configLabel}>SLA / Fecha Límite</span>
          {isEditingSLA ? (
            <input 
              type="date" 
              defaultValue={project.slaDate ? new Date(project.slaDate).toISOString().split('T')[0] : ""}
              onChange={(e) => {
                updateProjectField(project.id, 'slaDate', e.target.value);
                setIsEditingSLA(false);
              }}
              onBlur={() => setIsEditingSLA(false)}
              className={styles.dateInput}
              autoFocus
            />
          ) : (
            <span onClick={() => setIsEditingSLA(true)} className={styles.clickable}>
              {project.slaDate ? new Date(project.slaDate).toLocaleDateString() : 'Sin fecha'}
            </span>
          )}
        </div>
      </div>

      {/* Project Type */}
      <div className={styles.metaItem}>
        <Wallet size={18} className={styles.metaIcon} />
        <div className={styles.configBlock}>
          <span className={styles.configLabel}>Tipo de Proyecto</span>
          <div className={styles.selectWrapper}>
            <select 
              value={project.projectType}
              onChange={(e) => updateProjectField(project.id, 'projectType', e.target.value)}
              className={styles.select}
            >
              {PROJECT_TYPES.map(t => (
                <option key={t.id} value={t.id} className={styles.option}>{t.label}</option>
              ))}
            </select>
            <ChevronDown size={14} className={styles.selectIcon} />
          </div>
        </div>
      </div>

      {/* Recurrence Fields (Only for non-freelance) */}
      {project.projectType !== "FREELANCE" && (
        <>
          <div className={styles.metaItem}>
            <Repeat size={18} className={styles.metaIcon} />
            <div className={styles.configBlock}>
              <span className={styles.configLabel}>Plan de Pago</span>
              {isEditingBillingName ? (
                <input 
                  type="text"
                  defaultValue={project.billingName || ""}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      updateProjectField(project.id, 'billingName', (e.target as HTMLInputElement).value);
                      setIsEditingBillingName(false);
                    }
                  }}
                  onBlur={(e) => {
                    updateProjectField(project.id, 'billingName', e.target.value);
                    setIsEditingBillingName(false);
                  }}
                  className={styles.textInput}
                  autoFocus
                  placeholder="Ej. Fee Mensual"
                />
              ) : (
                <span onClick={() => setIsEditingBillingName(true)} className={styles.clickable}>
                  {project.billingName || "Sin nombre de plan"}
                </span>
              )}
            </div>
          </div>

          <div className={styles.metaItem}>
            <div className={styles.configBlock}>
              <span className={styles.configLabel}>Recurrencia</span>
              <div className={styles.selectWrapper}>
                <select 
                  value={project.billingFrequency}
                  onChange={(e) => updateProjectField(project.id, 'billingFrequency', e.target.value)}
                  className={styles.select}
                >
                  {FREQUENCIES.map(f => (
                    <option key={f.id} value={f.id} className={styles.option}>{f.label}</option>
                  ))}
                </select>
                <ChevronDown size={14} className={styles.selectIcon} />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
    </>
  );
}
