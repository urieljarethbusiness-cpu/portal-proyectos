"use client";

import { Plus, Trash2, Edit2, Check, X, CheckCircle2, Circle, Calendar } from "lucide-react";
import { addTask, deleteTask, updateTask, toggleTask } from "@/lib/actions";
import { useRef, useState } from "react";
import styles from "./TaskManager.module.css";

interface Task {
  id: string;
  title: string;
  isCompleted: boolean;
  priority: string;
  slaDate: string | Date | null;
}

export default function TaskManager({ projectId, tasks, title }: { projectId: string, tasks: Task[], title: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editPriority, setEditPriority] = useState("MEDIUM");
  const [editSla, setEditSla] = useState<string>("");
  const [showAddForm, setShowAddForm] = useState(false);

  const startEditing = (task: Task) => {
    setEditingId(task.id);
    setEditValue(task.title);
    setEditPriority(task.priority);
    setEditSla(task.slaDate ? new Date(task.slaDate).toISOString().split('T')[0] : "");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditValue("");
  };

  const handleUpdate = async (id: string, isCompleted: boolean) => {
    if (!editValue.trim()) return;
    const formData = new FormData();
    formData.append("title", editValue);
    formData.append("priority", editPriority);
    formData.append("slaDate", editSla);
    formData.append("isCompleted", isCompleted.toString());
    
    await updateTask(id, formData);
    setEditingId(null);
  };

  const formatPriority = (p: string) => {
    if (p === 'HIGH') return 'Alta';
    if (p === 'MEDIUM') return 'Media';
    return 'Baja';
  };

  const isOverdue = (date: string | Date | null) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.sectionTitle}>{title}</h2>
        {!showAddForm && (
          <button 
            onClick={() => setShowAddForm(true)} 
            className={styles.toggleAddBtn}
          >
            <Plus size={16} />
            <span>Nueva Tarea</span>
          </button>
        )}
      </div>

      {showAddForm && (
        <form 
          ref={formRef}
          action={async (formData) => {
            await addTask(projectId, formData);
            formRef.current?.reset();
            setShowAddForm(false);
          }}
          className={styles.addForm}
          suppressHydrationWarning
        >
          <input 
            name="title" 
            type="text" 
            required 
            placeholder="¿Qué hay que hacer?" 
            className={styles.input}
            autoFocus
          />
          <div className={styles.addFields}>
            <select name="priority" className={styles.prioritySelect} defaultValue="MEDIUM">
              <option value="HIGH">Prioridad Alta</option>
              <option value="MEDIUM">Prioridad Media</option>
              <option value="LOW">Prioridad Baja</option>
            </select>
            <div className={styles.dateInputWrapper}>
              <input type="date" name="slaDate" className={styles.dateInput} />
            </div>
            <div className={styles.addActions}>
              <button type="submit" className={styles.addBtn}>
                <Check size={18} />
              </button>
              <button 
                type="button" 
                onClick={() => setShowAddForm(false)} 
                className={styles.cancelAddBtn}
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </form>
      )}

      <div className={styles.taskList}>
        {tasks.map(task => (
          <div key={task.id} className={`${styles.taskItem} ${task.isCompleted ? styles.completed : ""}`}>
            {editingId === task.id ? (
              <div className={styles.editWrapper}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                  <input 
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className={styles.editInput}
                    autoFocus
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select 
                      value={editPriority} 
                      onChange={(e) => setEditPriority(e.target.value)} 
                      className={styles.prioritySelect}
                    >
                      <option value="HIGH">Alta</option>
                      <option value="MEDIUM">Media</option>
                      <option value="LOW">Baja</option>
                    </select>
                    <input 
                      type="date" 
                      value={editSla} 
                      onChange={(e) => setEditSla(e.target.value)} 
                      className={styles.dateInput}
                    />
                  </div>
                </div>
                <div className={styles.editActions}>
                  <button onClick={() => handleUpdate(task.id, task.isCompleted)} className={styles.saveBtn}>
                    <Check size={16} />
                  </button>
                  <button onClick={cancelEditing} className={styles.cancelBtn}>
                    <X size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.taskMain}>
                <button 
                  className={styles.checkBtn} 
                  onClick={() => toggleTask(task.id, task.isCompleted, projectId)}
                >
                  {task.isCompleted ? (
                    <CheckCircle2 size={18} className={styles.doneIcon} />
                  ) : (
                    <Circle size={18} className={styles.todoIcon} />
                  )}
                </button>
                <div style={{ flex: 1 }}>
                  <span className={styles.taskTitle}>{task.title}</span>
                  {!task.isCompleted && (
                    <div className={styles.taskMeta}>
                      <span className={`${styles.priorityBadge} ${styles['priority_' + task.priority.toLowerCase()]}`}>
                        {formatPriority(task.priority)}
                      </span>
                      {task.slaDate && (
                        <span className={`${styles.taskSla} ${isOverdue(task.slaDate) ? styles.overdue : ""}`}>
                          <Calendar size={12} />
                          {new Date(task.slaDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className={styles.actions}>
                  {!task.isCompleted && (
                    <button 
                      className={styles.actionBtn}
                      onClick={() => startEditing(task)}
                    >
                      <Edit2 size={16} />
                    </button>
                  )}
                  <button 
                    className={styles.deleteBtn}
                    onClick={() => deleteTask(task.id, projectId)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {tasks.length === 0 && !showAddForm && (
          <p className={styles.emptyTasks}>No hay tareas pendientes.</p>
        )}
      </div>
    </div>
  );
}
