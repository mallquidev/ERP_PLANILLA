// src/store/Store.jsx
import React, { createContext, useContext, useMemo, useState } from "react";

const GlobalContext = createContext(null);

export function GlobalProvider({ children }) {
  // 1) Cargar estado inicial desde localStorage (si existe)
  const boot = (() => {
    try {
      const raw = localStorage.getItem("appContext");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  const [empresaId, setEmpresaId] = useState(boot?.empresaId ?? null);
  const [empresaNombre, setEmpresaNombre] = useState(boot?.empresaNombre ?? "");
  const [nominaId, setNominaId] = useState(boot?.nominaId ?? null);
  const [nominaNombre, setNominaNombre] = useState(boot?.nominaNombre ?? "");
  const [periodo, setPeriodo] = useState(
    boot?.periodo ?? { ano: null, mes: null, secuencia: null }
  );

  // 2) Limpia todo el contexto y borra del localStorage
  const clearContext = () => {
    setEmpresaId(null);
    setEmpresaNombre("");
    setNominaId(null);
    setNominaNombre("");
    setPeriodo({ ano: null, mes: null, secuencia: null });
    localStorage.removeItem("appContext");
  };

  // 3) Valor de contexto
  const value = useMemo(
    () => ({
      // estado
      empresaId,
      empresaNombre,
      nominaId,
      nominaNombre,
      periodo,
      // setters
      setEmpresaId,
      setEmpresaNombre,
      setNominaId,
      setNominaNombre,
      setPeriodo,
      // helpers
      clearContext,
    }),
    [
      empresaId,
      empresaNombre,
      nominaId,
      nominaNombre,
      periodo,
    ]
  );

  return <GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>;
}

export function useGlobal() {
  const ctx = useContext(GlobalContext);
  if (!ctx) {
    throw new Error("useGlobalStore debe usarse dentro de GlobalProvider");
  }
  return ctx;
}
