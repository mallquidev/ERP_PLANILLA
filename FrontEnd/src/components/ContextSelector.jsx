// src/components/ContextSelector.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import API_BASE_URL from "../api";
import { useGlobal } from "../GlobalContext";
import { useNavigate } from "react-router-dom";

function useAuthAxios() {
  const token = localStorage.getItem("token");
  return useMemo(
    () =>
      axios.create({
        baseURL: API_BASE_URL,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }),
    [token]
  );
}

export default function ContextSelector({ open = true, onClose }) {
  const authAxios = useAuthAxios();
  const navigate = useNavigate();

  const {
    empresaId,
    setEmpresaId,
    nominaId,
    setNominaId,
    periodo,
    setPeriodo,
    setEmpresaNombre,
    setNominaNombre,
  } = useGlobal();

  const [empresas, setEmpresas] = useState([]);
  const [nominas, setNominas] = useState([]);
  const [periodos, setPeriodos] = useState([]);

  // Siempre strings en los selects
  const [localEmpresa, setLocalEmpresa] = useState(empresaId ? String(empresaId) : "");
  const [localNomina, setLocalNomina] = useState(nominaId ? String(nominaId) : "");
  const [localPeriodo, setLocalPeriodo] = useState(periodo?.id ? String(periodo.id) : "");

  const [loading, setLoading] = useState(false);

  // 1) Cargar empresas y nóminas una vez al abrir el modal
  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        setLoading(true);
        const [empRes, nomRes] = await Promise.all([
          authAxios.get("/empresa/"),
          authAxios.get("/lista-nomina"),
        ]);
        const emps = Array.isArray(empRes.data) ? empRes.data : [];
        const noms = Array.isArray(nomRes.data) ? nomRes.data : [];
        setEmpresas(emps);
        setNominas(noms);

        // Prefill SOLO si no hay algo previamente seleccionado
        if (!empresaId && emps.length > 0) setLocalEmpresa(String(emps[0].IDEmpresa));
        if (!nominaId && noms.length > 0) setLocalNomina(String(noms[0].IDNomina));
      } catch (err) {
        console.error("Error cargando empresas/nominas:", err);
        alert("No se pudieron cargar las empresas/ nóminas.");
      } finally {
        setLoading(false);
      }
    })();
  }, [open]); // Intencionalmente solo cuando se abre

  // 2) Cargar periodos cuando cambian empresa o nómina
  useEffect(() => {
    if (!open) return;
    if (localEmpresa === "" || localNomina === "") return;

    (async () => {
      try {
        setLoading(true);
        const perRes = await authAxios.get("/lista-periodo/", {
          params: {
            IDEmpresa: Number(localEmpresa),
            IDNomina: Number(localNomina),
          },
        });
        const pers = Array.isArray(perRes.data) ? perRes.data : [];
        setPeriodos(pers);

        // Verificar si la selección actual (localPeriodo) sigue siendo válida (ahora usamos PKID)
        const stillValid = pers.some((p) => String(p.PKID) === localPeriodo);

        // Solo si NO es válida, setear la primera como default
        if (!stillValid) {
          setLocalPeriodo(pers.length > 0 ? String(pers[0].PKID) : "");
        }
      } catch (err) {
        console.error("Error cargando periodos:", err);
        alert("No se pudieron cargar los periodos.");
      } finally {
        setLoading(false);
      }
    })();
  }, [open, localEmpresa, localNomina]);

  const handleGuardar = () => {
    if (localEmpresa === "" || localNomina === "" || localPeriodo === "") {
      alert("Seleccione empresa, nómina y periodo.");
      return;
    }

    const perObj = periodos.find((p) => String(p.PKID) === localPeriodo);
    if (!perObj) {
      alert("Periodo seleccionado inválido.");
      return;
    }

    const empObj = empresas.find((e) => String(e.IDEmpresa) === localEmpresa);
    const nomObj = nominas.find((n) => String(n.IDNomina) === localNomina);

    setEmpresaId(Number(localEmpresa));
    setNominaId(Number(localNomina));
    setPeriodo({
      id: Number(perObj.PKID),
      ano: Number(perObj.Ano),
      mes: Number(perObj.Mes),
      secuencia: Number(perObj.SecuenciaAnoMes),
      label: `${perObj.Ano}-${String(perObj.Mes).padStart(2, "0")} (Sec ${perObj.SecuenciaAnoMes})`,
    });
    setEmpresaNombre(empObj?.RazonSocial || "");
    setNominaNombre(nomObj?.Nomina || "");

    if (onClose) onClose();
    navigate("/menu", { replace: true });
  };

  if (!open) return null;

  return (
    <div style={backdropStyle}>
      <div style={modalStyle}>
        <h2 style={{ marginTop: 0 }}>Seleccionar Contexto</h2>

        <div style={fieldRow}>
          <label style={labelStyle}>Empresa:</label>
          <select
            value={localEmpresa}
            onChange={(e) => setLocalEmpresa(e.target.value)}
            disabled={loading || empresas.length === 0}
            style={selectStyle}
          >
            {empresas.map((e) => (
              <option key={`emp-${e.IDEmpresa}`} value={String(e.IDEmpresa)}>
                {e.RazonSocial}
              </option>
            ))}
          </select>
        </div>

        <div style={fieldRow}>
          <label style={labelStyle}>Nómina:</label>
          <select
            value={localNomina}
            onChange={(e) => setLocalNomina(e.target.value)}
            disabled={loading || nominas.length === 0}
            style={selectStyle}
          >
            {nominas.map((n) => (
              <option key={`nom-${n.IDNomina}`} value={String(n.IDNomina)}>
                {n.Nomina}
              </option>
            ))}
          </select>
        </div>

        <div style={fieldRow}>
          <label style={labelStyle}>Periodo:</label>
          <select
            value={localPeriodo}
            onChange={(e) => setLocalPeriodo(e.target.value)}
            disabled={loading || periodos.length === 0}
            style={selectStyle}
          >
            {periodos.map((p) => (
              <option
                key={`per-${p.PKID}-${p.Ano}-${p.Mes}-${p.SecuenciaAnoMes}`}
                value={String(p.PKID)}
              >
                {p.Ano}-{String(p.Mes).padStart(2, "0")} (Sec {p.SecuenciaAnoMes})
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
          <button onClick={handleGuardar} disabled={loading} style={primaryBtn}>
            {loading ? "Guardando..." : "Guardar Contexto"}
          </button>
          {onClose && (
            <button onClick={onClose} disabled={loading} style={ghostBtn}>
              Cancelar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ——— styles ——— */
const backdropStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};
const modalStyle = {
  width: 460,
  background: "#fff",
  borderRadius: 10,
  boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
  padding: 20,
  border: "1px solid #eee",
};
const fieldRow = { display: "flex", alignItems: "center", margin: "10px 0" };
const labelStyle = { width: 90, fontWeight: 600 };
const selectStyle = { flex: 1, padding: "6px 8px" };
const primaryBtn = {
  background: "#1976d2",
  color: "#fff",
  border: "none",
  padding: "8px 12px",
  borderRadius: 6,
  cursor: "pointer",
};
const ghostBtn = {
  background: "transparent",
  color: "#333",
  border: "1px solid #ccc",
  padding: "8px 12px",
  borderRadius: 6,
  cursor: "pointer",
};
