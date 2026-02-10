// src/GlobalContext.jsx
import React, { createContext, useContext, useMemo, useState } from "react";

const GlobalContext = createContext(null);

export function GlobalProvider({ children }) {
  // IDs efectivamente usados por el backend
  const [empresaId, setEmpresaId] = useState(null);
  const [nominaId, setNominaId] = useState(null);
  const [periodo, setPeriodo] = useState(null); // { id, ano, mes, secuencia, label }

  // 👇 NOMBRES visibles en el TopBar
  const [empresaNombre, setEmpresaNombre] = useState("");
  const [nominaNombre, setNominaNombre] = useState("");

  const value = useMemo(
    () => ({
      // ids
      empresaId,
      setEmpresaId,
      nominaId,
      setNominaId,
      periodo,
      setPeriodo,
      // nombres
      empresaNombre,
      setEmpresaNombre,
      nominaNombre,
      setNominaNombre,
      // derivados (solo lectura)
      ano: periodo?.ano ?? null,
      mes: periodo?.mes ?? null,
    }),
    [
      empresaId,
      nominaId,
      periodo,
      empresaNombre,
      nominaNombre,
    ]
  );

  return <GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>;
}

export function useGlobal() {
  return useContext(GlobalContext);
}
