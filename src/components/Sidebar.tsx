"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, KanbanSquare, CheckSquare, FolderOpen, ArrowRightFromLine } from "lucide-react";
import styles from "./Sidebar.module.css";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Proyectos (Kanban)", href: "/proyectos", icon: KanbanSquare },
  { name: "Tareas Globales", href: "/tareas", icon: CheckSquare },
  { name: "Archivos", href: "/archivos", icon: FolderOpen },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <div className={styles.logoBadge}>
          <div className={styles.glowPoint}></div>
        </div>
        <h1 className={styles.brand}>
          Nova<span className="text-gradient">Portal</span>
        </h1>
      </div>

      <nav className={styles.nav}>
        <ul className={styles.navList}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <li key={item.name} className={styles.navItem}>
                <Link
                  href={item.href}
                  className={`${styles.navLink} ${isActive ? styles.active : ""}`}
                >
                  <Icon className={styles.icon} size={20} strokeWidth={isActive ? 2.5 : 2} />
                  <span>{item.name}</span>
                  {isActive && <div className={styles.activeIndicator}></div>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className={styles.footer}>
        <button className={styles.logoutBtn}>
          <ArrowRightFromLine size={18} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}
