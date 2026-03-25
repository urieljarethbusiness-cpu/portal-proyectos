"use client";

import { FormEvent, ReactNode, useState, useSyncExternalStore } from "react";
import styles from "./PasswordGate.module.css";

const ACCESS_PASSWORD = "cee564F1.";
const SESSION_KEY = "portal-proyectos-authenticated";

type PasswordGateProps = {
  children: ReactNode;
};

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function getSnapshot() {
  return typeof window !== "undefined" && window.sessionStorage.getItem(SESSION_KEY) === "true";
}

export default function PasswordGate({ children }: PasswordGateProps) {
  const isAuthenticated = useSyncExternalStore(subscribe, getSnapshot, () => false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password !== ACCESS_PASSWORD) {
      setError("La contraseña ingresada no es válida.");
      return;
    }

    window.sessionStorage.setItem(SESSION_KEY, "true");
    window.dispatchEvent(new Event("storage"));
    setError("");
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <div className={styles.badge}>Acceso privado</div>
        <h1 className={styles.title}>Ingresa la contraseña para continuar</h1>
        <p className={styles.subtitle}>
          El portal solo permite acceso con una clave válida.
        </p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.label} htmlFor="portal-password">
            Contraseña
          </label>
          <input
            id="portal-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={styles.input}
            autoFocus
            autoComplete="current-password"
            required
          />

          {error ? <p className={styles.error}>{error}</p> : null}

          <button type="submit" className={styles.submitBtn}>
            Entrar al portal
          </button>
        </form>
      </div>
    </div>
  );
}
