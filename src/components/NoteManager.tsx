"use client";

import { Plus, Trash2, StickyNote } from "lucide-react";
import { addNote, deleteNote } from "@/lib/actions";
import { useRef, useState } from "react";
import styles from "./NoteManager.module.css";

interface Note {
  id: string;
  content: string;
  createdAt: Date;
}

export default function NoteManager({ projectId, notes, title }: { projectId: string, notes: Note[], title: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [showAddForm, setShowAddForm] = useState(false);

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
            <span>Nueva Nota</span>
          </button>
        )}
      </div>

      {showAddForm && (
        <form 
          ref={formRef}
          action={async (formData) => {
            await addNote(projectId, formData);
            formRef.current?.reset();
            setShowAddForm(false);
          }}
          className={styles.addForm}
          suppressHydrationWarning
        >
          <textarea 
            name="content" 
            required 
            placeholder="Escribe aquí tu nota o comentario..." 
            className={styles.textarea}
            rows={3}
            autoFocus
          />
          <div className={styles.formActions}>
            <button type="submit" className={styles.addBtn}>
              <Plus size={18} />
              <span>Guardar Nota</span>
            </button>
            <button 
              type="button" 
              onClick={() => setShowAddForm(false)} 
              className={styles.cancelBtn}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className={styles.noteList}>
        {notes.length === 0 ? (
          <p className={styles.emptyText}>Sin notas aún.</p>
        ) : (
          notes.map(note => (
            <div key={note.id} className={styles.noteItem}>
              <div className={styles.noteHeader}>
                <div className={styles.noteMeta}>
                  <StickyNote size={14} className={styles.noteIcon} />
                  <span>{new Date(note.createdAt).toLocaleString()}</span>
                </div>
                <button 
                  className={styles.deleteBtn}
                  onClick={() => deleteNote(note.id, projectId)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <p className={styles.noteContent}>{note.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
