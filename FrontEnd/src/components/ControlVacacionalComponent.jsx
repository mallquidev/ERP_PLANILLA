// src/components/ControlVacacionalComponent.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import API_BASE_URL from "../api";
import { useGlobal } from "../GlobalContext";

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

const card = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 16, boxShadow: "0 1px 2px rgba(0,0,0,.05)" };
const btn = {
  base: { border: "none", borderRadius: 6, padding: "8px 12px", cursor: "pointer", fontWeight: 600 },
  primary: { background: "#2563eb", color: "#fff" },
  neutral: { background: "#f3f4f6", color: "#111827" },
  danger: { background: "#ef4444", color: "#fff" },
  subtle: { background: "#e5e7eb", color: "#111827" },
};
const row2 = { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 };
const row3 = { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 };
const row4 = { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 };
const input = { width: "100%", padding: 8, borderRadius: 6, border: "1px solid #d1d5db" };
const label = { display: "block", fontSize: 12, color: "#374151", marginBottom: 4 };

function prettyError(err) {
  const d = err?.response?.data;
  if (!d) return err?.message || "Error";
  if (Array.isArray(d.detail)) {
    return d.detail.map((e) => `• ${(Array.isArray(e.loc) ? e.loc.join(".") : e.loc)}: ${e.msg}`).join("\n");
  }
  return String(d.detail || "Error");
}

const intFieldsCab = new Set(["PKIDTrabajador", "Ano", "Mes", "PKIDSituacionRegistro"]);
const floatFieldsCab = new Set(["SaldoVacaciones","DiasTruncosVacaciones","MesesTruncosVacaciones","SaldoImporteVacaciones"]);

const intFieldsDet = new Set(["PKIDControlVacacional","AnoServicio","TiempoServicioAno","TiempoServicioMes","TiempoServicioDia","Dias","PKIDSituacionRegistro"]);
const floatFieldsDet = new Set([
  "VacacionesGanadas","VacacionesGozadas","VacacionesVendidas","VacacionesAdelantadas","VacacionesIndeminzadas",
  "SaldoInicialVacaciones","SaldoAdelantoVacaciones","DiasTruncos","MesesTruncos","DevengadoTrunco","DiasSubsidiados"
]);

function normalize(obj, intFields, floatFields) {
  const out = {};
  for (const [k, v0] of Object.entries(obj)) {
    if (v0 === "" || v0 === null || typeof v0 === "undefined") { out[k] = null; continue; }
    const v = typeof v0 === "string" ? v0.trim() : v0;
    if (intFields.has(k)) out[k] = Number(v);
    else if (floatFields.has(k)) out[k] = Number(v);
    else out[k] = v;
  }
  return out;
}

export default function ControlVacacionalComponent() {
  const auth = useAuthAxios();
  const { empresaId, empresaNombre } = useGlobal() || {};

  const [activeTab, setActiveTab] = useState("control");

  const [controles, setControles] = useState([]);
  const [periodos, setPeriodos] = useState([]);

  const [trabajadores, setTrabajadores] = useState([]);
  const [situaciones, setSituaciones] = useState([]);

  const emptyCab = {
    PKID: null,
    PKIDTrabajador: "",
    Ano: "",
    Mes: "",
    FechaIngreso: "",
    SaldoVacaciones: "",
    DiasTruncosVacaciones: "",
    MesesTruncosVacaciones: "",
    SaldoImporteVacaciones: "",
    PKIDSituacionRegistro: "",
    FechaCese: "",
  };
  const [formCab, setFormCab] = useState(emptyCab);

  const emptyDet = {
    PKID: null,
    PKIDControlVacacional: null,
    AnoServicio: "",
    FechaInicio: "",
    FechaFin: "",
    VacacionesGanadas: "",
    VacacionesGozadas: "",
    VacacionesVendidas: "",
    VacacionesAdelantadas: "",
    VacacionesIndeminzadas: "",
    TiempoServicioAno: "",
    TiempoServicioMes: "",
    TiempoServicioDia: "",
    Dias: "",
    IndicadorInicialCheck: false,
    SaldoInicialVacaciones: "",
    SaldoAdelantoVacaciones: "",
    DiasTruncos: "",
    MesesTruncos: "",
    DevengadoTrunco: "",
    DiasSubsidiados: "",
    PKIDSituacionRegistro: "",
    IndicadorUltimoPeriodo: "",
  };
  const [formDet, setFormDet] = useState(emptyDet);

  const [loading, setLoading] = useState(false);
  const isEditingCab = formCab.PKID !== null;
  const isEditingDet = formDet.PKID !== null;

  // ------- Combos -------
  const loadCombos = async () => {
    if (!empresaId) { setTrabajadores([]); setSituaciones([]); return; }
    try {
      setLoading(true);
      const [t, s] = await Promise.all([
        auth.get(`/control-vacacional-combos/trabajador/?empresaId=${empresaId}`),
        auth.get(`/control-vacacional-combos/situacion/`),
      ]);
      setTrabajadores(t.data || []);
      setSituaciones(s.data || []);
    } catch (err) {
      console.error(err);
      alert("No se pudieron cargar los combos.");
    } finally {
      setLoading(false);
    }
  };

  // ------- Listas -------
  const loadCab = async () => {
    if (!empresaId) { setControles([]); return; }
    try {
      setLoading(true);
      const res = await auth.get(`/control-vacacional/?empresaId=${empresaId}`);
      setControles(res.data || []);
    } catch (err) {
      console.error(err);
      alert("No se pudo listar Control Vacacional.");
    } finally {
      setLoading(false);
    }
  };

  const loadDet = async (controlId) => {
    if (!controlId) { setPeriodos([]); return; }
    try {
      setLoading(true);
      const res = await auth.get(`/control-vacacional-periodo/?controlId=${controlId}`);
      setPeriodos(res.data || []);
    } catch (err) {
      console.error(err);
      alert("No se pudo listar periodos.");
    } finally {
      setLoading(false);
    }
  };

  // ------- Effects -------
  useEffect(() => {
    loadCombos();
    loadCab();
    setFormCab(emptyCab);
    setFormDet(emptyDet);
    setPeriodos([]);
    setActiveTab("control");
  }, [empresaId]);

  useEffect(() => {
    if (activeTab === "periodos") {
      const id = formCab.PKID || formDet.PKIDControlVacacional;
      if (id) loadDet(id);
    }
  }, [activeTab, formCab.PKID, formDet.PKIDControlVacacional]);

  // ------- Handlers Cabecera -------
  const handleCabChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormCab((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const handleCabNew = () => {
    setFormCab(emptyCab);
    setFormDet(emptyDet);
    setPeriodos([]);
    setActiveTab("control");
  };

  const handleCabEdit = (row) => {
    setFormCab({
      PKID: row.PKID,
      PKIDTrabajador: row.PKIDTrabajador ?? "",
      Ano: row.Ano ?? "",
      Mes: row.Mes ?? "",
      FechaIngreso: row.FechaIngreso ?? "",
      SaldoVacaciones: row.SaldoVacaciones ?? "",
      DiasTruncosVacaciones: row.DiasTruncosVacaciones ?? "",
      MesesTruncosVacaciones: row.MesesTruncosVacaciones ?? "",
      SaldoImporteVacaciones: row.SaldoImporteVacaciones ?? "",
      PKIDSituacionRegistro: row.PKIDSituacionRegistro ?? "",
      FechaCese: row.FechaCese ?? "",
    });
    setFormDet((d) => ({ ...d, PKIDControlVacacional: row.PKID }));
  };

  const handleCabDelete = async (id) => {
    if (!window.confirm("¿Eliminar el control vacacional (si no tiene periodos)?")) return;
    try {
      setLoading(true);
      await auth.delete(`/control-vacacional/${id}`);
      await loadCab();
      handleCabNew();
    } catch (err) {
      alert(prettyError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCabSave = async (e) => {
    e.preventDefault();
    if (!empresaId) { alert("Seleccione empresa en el Selector de Contexto."); return; }
    if (!formCab.PKIDTrabajador || !formCab.Ano || !formCab.Mes || !formCab.FechaIngreso || !formCab.PKIDSituacionRegistro) {
      alert("Complete los campos obligatorios (*)");
      return;
    }
    const payload = normalize(formCab, intFieldsCab, floatFieldsCab);
    try {
      setLoading(true);
      if (isEditingCab) {
        await auth.put(`/control-vacacional/${formCab.PKID}`, { ...payload, PKID: formCab.PKID });
        alert("Control actualizado.");
      } else {
        const res = await auth.post(`/control-vacacional/`, payload);
        alert("Control creado.");
        const newId = res?.data?.PKID;
        if (newId) {
          await loadCab();
          setFormCab((f) => ({ ...f, PKID: newId }));
          setFormDet((d) => ({ ...d, PKIDControlVacacional: newId }));
        }
      }
      await loadCab();
    } catch (err) {
      alert(prettyError(err));
    } finally {
      setLoading(false);
    }
  };

  // ------- Handlers Detalle -------
  const handleDetChange = (e) => {
    const { name, value, type, checked, maxLength } = e.target;
    let v = type === "checkbox" ? checked : value;
    if (name === "IndicadorUltimoPeriodo" && typeof v === "string" && maxLength) {
      v = v.slice(0, maxLength);
    }
    setFormDet((f) => ({ ...f, [name]: v }));
  };

  const handleDetNew = () => {
    setFormDet((d) => ({ ...emptyDet, PKIDControlVacacional: formCab.PKID || d.PKIDControlVacacional }));
  };

  const handleDetEdit = (row) => {
    setFormDet({
      PKID: row.PKID,
      PKIDControlVacacional: row.PKIDControlVacacional,
      AnoServicio: row.AnoServicio ?? "",
      FechaInicio: row.FechaInicio ?? "",
      FechaFin: row.FechaFin ?? "",
      VacacionesGanadas: row.VacacionesGanadas ?? "",
      VacacionesGozadas: row.VacacionesGozadas ?? "",
      VacacionesVendidas: row.VacacionesVendidas ?? "",
      VacacionesAdelantadas: row.VacacionesAdelantadas ?? "",
      VacacionesIndeminzadas: row.VacacionesIndeminzadas ?? "",
      TiempoServicioAno: row.TiempoServicioAno ?? "",
      TiempoServicioMes: row.TiempoServicioMes ?? "",
      TiempoServicioDia: row.TiempoServicioDia ?? "",
      Dias: row.Dias ?? "",
      IndicadorInicialCheck: !!row.IndicadorInicialCheck,
      SaldoInicialVacaciones: row.SaldoInicialVacaciones ?? "",
      SaldoAdelantoVacaciones: row.SaldoAdelantoVacaciones ?? "",
      DiasTruncos: row.DiasTruncos ?? "",
      MesesTruncos: row.MesesTruncos ?? "",
      DevengadoTrunco: row.DevengadoTrunco ?? "",
      DiasSubsidiados: row.DiasSubsidiados ?? "",
      PKIDSituacionRegistro: row.PKIDSituacionRegistro ?? "",
      IndicadorUltimoPeriodo: row.IndicadorUltimoPeriodo ?? "",
    });
  };

  const handleDetDelete = async (id) => {
    if (!window.confirm("¿Eliminar periodo?")) return;
    try {
      setLoading(true);
      await auth.delete(`/control-vacacional-periodo/${id}`);
      await loadDet(formDet.PKIDControlVacacional || formCab.PKID);
      handleDetNew();
    } catch (err) {
      alert(prettyError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDetSave = async (e) => {
    e.preventDefault();
    const ctrlId = formDet.PKIDControlVacacional || formCab.PKID;
    if (!ctrlId) { alert("Primero guarde la cabecera."); return; }
    if (!formDet.AnoServicio || !formDet.FechaInicio || !formDet.FechaFin || !formDet.PKIDSituacionRegistro) {
      alert("Complete los campos obligatorios del periodo (*)."); return;
    }
    const payload = normalize({ ...formDet, PKIDControlVacacional: ctrlId }, intFieldsDet, floatFieldsDet);
    try {
      setLoading(true);
      if (isEditingDet) {
        await auth.put(`/control-vacacional-periodo/${formDet.PKID}`, { ...payload, PKID: formDet.PKID });
        alert("Periodo actualizado.");
      } else {
        await auth.post(`/control-vacacional-periodo/`, payload);
        alert("Periodo creado.");
      }
      await loadDet(ctrlId);
      handleDetNew();
    } catch (err) {
      alert(prettyError(err));
    } finally {
      setLoading(false);
    }
  };

  // ------- UI helpers -------
  const trabajadorSel = trabajadores.find((t) => Number(t.PKID) === Number(formCab.PKIDTrabajador));
  const trabajadorNombre = trabajadorSel?.NombreCompleto || "";

  const tabs = [
    { id: "control", title: "Control" },
    { id: "periodos", title: trabajadorNombre ? `Periodos – ${trabajadorNombre} – ${formCab.Ano || "-"} / ${formCab.Mes || "-"}` : "Periodos" },
  ];
  const tabBtn = (t) => ({ ...btn.base, ...(activeTab === t ? btn.primary : btn.subtle), padding: "6px 10px" });

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ marginBottom: 16 }}>Control Vacacional</h2>

      {/* Tabs */}
      <div style={{ ...card, padding: 8, marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={tabBtn(t.id)}>
              {t.title}
            </button>
          ))}
        </div>
      </div>

      {/* CABECERA */}
      {activeTab === "control" && (
        <div style={{ ...card, marginBottom: 16 }}>
          <form onSubmit={handleCabSave}>
            <div style={row4}>
              <div>
                <label style={label}>Empresa (contexto) *</label>
                <input
                  value={
                    empresaNombre
                      ? `${empresaNombre} (ID ${empresaId ?? "-"})`
                      : empresaId
                      ? `Empresa ID ${empresaId}`
                      : "(sin empresa)"
                  }
                  disabled
                  style={{ ...input, background: "#f9fafb" }}
                />
              </div>
              <div>
                <label style={label}>Trabajador *</label>
                <select name="PKIDTrabajador" value={formCab.PKIDTrabajador} onChange={handleCabChange} style={input}>
                  <option value="">-- Seleccionar --</option>
                  {trabajadores.map((t) => (
                    <option key={t.PKID} value={t.PKID}>{t.NombreCompleto}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={label}>Año *</label>
                <input name="Ano" value={formCab.Ano} onChange={handleCabChange} style={input} />
              </div>
              <div>
                <label style={label}>Mes *</label>
                <input name="Mes" value={formCab.Mes} onChange={handleCabChange} style={input} />
              </div>
            </div>

            <div style={{ ...row4, marginTop: 12 }}>
              <div>
                <label style={label}>Fecha Ingreso *</label>
                <input type="date" name="FechaIngreso" value={formCab.FechaIngreso || ""} onChange={handleCabChange} style={input} />
              </div>
              <div>
                <label style={label}>Saldo Vacaciones</label>
                <input name="SaldoVacaciones" value={formCab.SaldoVacaciones} onChange={handleCabChange} style={input} />
              </div>
              <div>
                <label style={label}>Días Truncos</label>
                <input name="DiasTruncosVacaciones" value={formCab.DiasTruncosVacaciones} onChange={handleCabChange} style={input} />
              </div>
              <div>
                <label style={label}>Meses Truncos</label>
                <input name="MesesTruncosVacaciones" value={formCab.MesesTruncosVacaciones} onChange={handleCabChange} style={input} />
              </div>
            </div>

            <div style={{ ...row3, marginTop: 12 }}>
              <div>
                <label style={label}>Saldo Importe</label>
                <input name="SaldoImporteVacaciones" value={formCab.SaldoImporteVacaciones} onChange={handleCabChange} style={input} />
              </div>
              <div>
                <label style={label}>Situación *</label>
                <select name="PKIDSituacionRegistro" value={formCab.PKIDSituacionRegistro} onChange={handleCabChange} style={input}>
                  <option value="">-- Seleccionar --</option>
                  {situaciones.map((s) => (
                    <option key={s.PKID} value={s.PKID}>{s.SituacionRegistro}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={label}>Fecha Cese</label>
                <input type="date" name="FechaCese" value={formCab.FechaCese || ""} onChange={handleCabChange} style={input} />
              </div>
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
              <button type="submit" disabled={loading} style={{ ...btn.base, ...(btn.primary) }}>
                {isEditingCab ? "Actualizar" : "Agregar"}
              </button>
              <button type="button" disabled={loading} onClick={handleCabNew} style={{ ...btn.base, ...(btn.neutral) }}>
                Limpiar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* DETALLE (Periodos) */}
      {activeTab === "periodos" && (
        <div style={{ ...card, marginBottom: 16 }}>
          <form onSubmit={handleDetSave}>
            <div style={row4}>
              <div>
                <label style={label}>Control</label>
                <input
                  value={formCab.PKID ? `PKID ${formCab.PKID}` : formDet.PKIDControlVacacional ? `PKID ${formDet.PKIDControlVacacional}` : "(nuevo)"}
                  disabled
                  style={{ ...input, background: "#f9fafb" }}
                />
              </div>
              <div>
                <label style={label}>Año servicio *</label>
                <input name="AnoServicio" value={formDet.AnoServicio} onChange={handleDetChange} style={input} />
              </div>
              <div>
                <label style={label}>Fecha inicio *</label>
                <input type="date" name="FechaInicio" value={formDet.FechaInicio || ""} onChange={handleDetChange} style={input} />
              </div>
              <div>
                <label style={label}>Fecha fin *</label>
                <input type="date" name="FechaFin" value={formDet.FechaFin || ""} onChange={handleDetChange} style={input} />
              </div>
            </div>

            <div style={{ ...row4, marginTop: 12 }}>
              <div>
                <label style={label}>Vac. ganadas</label>
                <input name="VacacionesGanadas" value={formDet.VacacionesGanadas} onChange={handleDetChange} style={input} />
              </div>
              <div>
                <label style={label}>Vac. gozadas</label>
                <input name="VacacionesGozadas" value={formDet.VacacionesGozadas} onChange={handleDetChange} style={input} />
              </div>
              <div>
                <label style={label}>Vac. vendidas</label>
                <input name="VacacionesVendidas" value={formDet.VacacionesVendidas} onChange={handleDetChange} style={input} />
              </div>
              <div>
                <label style={label}>Vac. adelantadas</label>
                <input name="VacacionesAdelantadas" value={formDet.VacacionesAdelantadas} onChange={handleDetChange} style={input} />
              </div>
            </div>

            <div style={{ ...row4, marginTop: 12 }}>
              <div>
                <label style={label}>Vac. indemnizadas</label>
                <input name="VacacionesIndeminzadas" value={formDet.VacacionesIndeminzadas} onChange={handleDetChange} style={input} />
              </div>
              <div>
                <label style={label}>Tiempo Serv. (Año)</label>
                <input name="TiempoServicioAno" value={formDet.TiempoServicioAno} onChange={handleDetChange} style={input} />
              </div>
              <div>
                <label style={label}>Tiempo Serv. (Mes)</label>
                <input name="TiempoServicioMes" value={formDet.TiempoServicioMes} onChange={handleDetChange} style={input} />
              </div>
              <div>
                <label style={label}>Tiempo Serv. (Día)</label>
                <input name="TiempoServicioDia" value={formDet.TiempoServicioDia} onChange={handleDetChange} style={input} />
              </div>
            </div>

            <div style={{ ...row4, marginTop: 12 }}>
              <div>
                <label style={label}>Días</label>
                <input name="Dias" value={formDet.Dias} onChange={handleDetChange} style={input} />
              </div>
              <div>
                <label style={label}>Inicial (check)</label>
                <input type="checkbox" name="IndicadorInicialCheck" checked={!!formDet.IndicadorInicialCheck} onChange={handleDetChange} />
              </div>
              <div>
                <label style={label}>Saldo inicial</label>
                <input name="SaldoInicialVacaciones" value={formDet.SaldoInicialVacaciones} onChange={handleDetChange} style={input} />
              </div>
              <div>
                <label style={label}>Saldo adelanto</label>
                <input name="SaldoAdelantoVacaciones" value={formDet.SaldoAdelantoVacaciones} onChange={handleDetChange} style={input} />
              </div>
            </div>

            <div style={{ ...row4, marginTop: 12 }}>
              <div>
                <label style={label}>Días truncos</label>
                <input name="DiasTruncos" value={formDet.DiasTruncos} onChange={handleDetChange} style={input} />
              </div>
              <div>
                <label style={label}>Meses truncos</label>
                <input name="MesesTruncos" value={formDet.MesesTruncos} onChange={handleDetChange} style={input} />
              </div>
              <div>
                <label style={label}>Devengado trunco</label>
                <input name="DevengadoTrunco" value={formDet.DevengadoTrunco} onChange={handleDetChange} style={input} />
              </div>
              <div>
                <label style={label}>Días subsidiados</label>
                <input name="DiasSubsidiados" value={formDet.DiasSubsidiados} onChange={handleDetChange} style={input} />
              </div>
            </div>

            <div style={{ ...row3, marginTop: 12 }}>
              <div>
                <label style={label}>Situación *</label>
                <select name="PKIDSituacionRegistro" value={formDet.PKIDSituacionRegistro} onChange={handleDetChange} style={input}>
                  <option value="">-- Seleccionar --</option>
                  {situaciones.map((s) => (
                    <option key={s.PKID} value={s.PKID}>{s.SituacionRegistro}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={label}>Último Período (1 char)</label>
                <input name="IndicadorUltimoPeriodo" maxLength={1} value={formDet.IndicadorUltimoPeriodo} onChange={handleDetChange} style={input} />
              </div>
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
              <button type="submit" disabled={loading} style={{ ...btn.base, ...(btn.primary) }}>
                {isEditingDet ? "Actualizar" : "Agregar"}
              </button>
              <button type="button" disabled={loading} onClick={handleDetNew} style={{ ...btn.base, ...(btn.neutral) }}>
                Limpiar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* GRILLA CABECERA (solo en pestaña Control) */}
      {activeTab === "control" && (
        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <strong>Controles</strong>
            <span style={{ fontSize: 12, color: "#6b7280" }}>Total: {controles.length}</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Trabajador</th>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Año</th>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Mes</th>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>F. Ingreso</th>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Situación</th>
                  <th style={{ textAlign: "center", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {controles.map((r) => {
                  const isSelected = Number(r.PKID) === Number(formCab.PKID || 0);
                  const rowStyle = { background: isSelected ? "#fff7ed" : "transparent" };
                  return (
                    <tr key={r.PKID} style={rowStyle}>
                      <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{r.Trabajador}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{r.Ano}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{r.Mes}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{r.FechaIngreso}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{r.SituacionRegistro}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6", textAlign: "center" }}>
                        <button onClick={() => handleCabEdit(r)} style={{ ...btn.base, ...(btn.neutral), marginRight: 6 }}>✏️</button>
                        <button onClick={() => handleCabDelete(r.PKID)} style={{ ...btn.base, ...(btn.danger) }}>🗑️</button>
                      </td>
                    </tr>
                  );
                })}
                {controles.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", padding: 16, color: "#6b7280" }}>
                      No hay controles para la empresa seleccionada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* GRILLA DETALLE (solo en pestaña Periodos y con control seleccionado) */}
      {activeTab === "periodos" && (formCab.PKID || formDet.PKIDControlVacacional) && (
        <div style={{ ...card, marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <strong>Periodos</strong>
            <span style={{ fontSize: 12, color: "#6b7280" }}>Total: {periodos.length}</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Año Serv.</th>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Inicio</th>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Fin</th>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Gozadas</th>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Vendidas</th>
                  <th style={{ textAlign: "center", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {periodos.map((p) => (
                  <tr key={p.PKID}>
                    <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{p.AnoServicio}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{p.FechaInicio}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{p.FechaFin}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{p.VacacionesGozadas ?? ""}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{p.VacacionesVendidas ?? ""}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6", textAlign: "center" }}>
                      <button onClick={() => handleDetEdit(p)} style={{ ...btn.base, ...(btn.neutral), marginRight: 6 }}>✏️</button>
                      <button onClick={() => handleDetDelete(p.PKID)} style={{ ...btn.base, ...(btn.danger) }}>🗑️</button>
                    </td>
                  </tr>
                ))}
                {periodos.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", padding: 16, color: "#6b7280" }}>
                      No hay periodos para este control.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
