import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import styles from "./layout.module.css";

export const metadata: Metadata = {
  title: "NovaPortal | Dashboard de Proyectos",
  description: "Portal de gestión de proyectos y finanzas freelance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <div className={styles.appContainer}>
          <Sidebar />
          <main className={styles.mainContent}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
