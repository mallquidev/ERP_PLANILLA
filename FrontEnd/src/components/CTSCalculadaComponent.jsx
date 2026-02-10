// src/components/CTSCalculadaComponent.jsx
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
  if (Array.isArray(d.detail)) return d.detail.map(e => `• ${(Array.isArray(e.loc)?e.loc.join("."):e.loc)}: ${e.msg}`).join("\n");
  return String(d.detail || "Error");
}

const intHeader = new Set([
  "PKIDPeriodoCTS","PKIDTrabajador","PKIDBanco","PKIDMoneda","AnoTiempoServicio","MesTiempoServicio","DiaTiempServicio",
  "DiasLiquidados","Regimen","DiasNoComputables","DiasIntereses","PKIDSituacionRegistro"
]);
const floatHeader = new Set([
  "BaseImponibleCTS","ImportesCTSSoles","ImporteCTSUSD","TipoCambioUSD","PorcentajeCTS","ImporteNoComputable",
  "DescuentoCTS","ImporteProvisionCTS","DiferenciaProvisionCalculoCTS","InteresesSoles"
]);

const intDetail = new Set(["PKIDCTSCalculada","PKIDConceptoPlanilla","PKIDSituacionRegistro"]);
const floatDetail = new Set(["BaseImponibleCTS","FactorCTS","ImporteCTS"]);

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

export default function CTSCalculadaComponent() {
  const auth = useAuthAxios();
  const { empresaId, empresaNombre } = useGlobal() || {};
  const [activeTab, setActiveTab] = useState("cts");

  // listas
  const [ctsList, setCtsList] = useState([]);
  const [conceptosList, setConceptosList] = useState([]);

  // combos
  const [periodos, setPeriodos] = useState([]);
  const [trabajadores, setTrabajadores] = useState([]);
  const [bancos, setBancos] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [situaciones, setSituaciones] = useState([]);
  const [conceptos, setConceptos] = useState([]);

  // forms
  const emptyHeader = {
    PKID: null,
    PKIDPeriodoCTS: "",
    PKIDTrabajador: "",
    PKIDBanco: "",
    CuentaBancariaCTS: "",
    BaseImponibleCTS: "",
    ImportesCTSSoles: "",
    ImporteCTSUSD: "",
    PKIDMoneda: "",
    TipoCambioUSD: "",
    FechaInicio: "",
    FechaTermino: "",
    AnoTiempoServicio: "",
    MesTiempoServicio: "",
    DiaTiempServicio: "",
    DiasLiquidados: "",
    Regimen: "", // 1 o 2
    PorcentajeCTS: "",
    ImporteNoComputable: "",
    FechaIngresoTrabajador: "",
    DescuentoCTS: "",
    ImporteProvisionCTS: "",
    DiferenciaProvisionCalculoCTS: "",
    InteresesSoles: "",
    DiasNoComputables: "",
    DiasIntereses: "",
    PKIDSituacionRegistro: "",
  };
  const [formHeader, setFormHeader] = useState(emptyHeader);

  const emptyDetail = {
    PKID: null,
    PKIDCTSCalculada: null,
    PKIDConceptoPlanilla: "",
    BaseImponibleCTS: "",
    FactorCTS: "",
    ImporteCTS: "",
    TipoCalculoCTS: "",
    PKIDSituacionRegistro: "",
  };
  const [formDetail, setFormDetail] = useState(emptyDetail);

  const isEditingHeader = formHeader.PKID !== null;
  const isEditingDetail = formDetail.PKID !== null;
  const [loading, setLoading] = useState(false);

  // ------ Combos ------
  const loadCombos = async () => {
    if (!empresaId) { setPeriodos([]); setTrabajadores([]); }
    try {
      setLoading(true);
      const [p, t, b, m, s, c] = await Promise.all([
        empresaId ? auth.get(`/cts-calculada-combos/periodocts/?empresaId=${empresaId}`) : Promise.resolve({ data: [] }),
        empresaId ? auth.get(`/cts-calculada-combos/trabajador/?empresaId=${empresaId}`) : Promise.resolve({ data: [] }),
        auth.get(`/cts-calculada-combos/banco/`),
        auth.get(`/cts-calculada-combos/moneda/`),
        auth.get(`/cts-calculada-combos/situacion/`),
        auth.get(`/cts-calculada-combos/concepto-planilla/`),
      ]);
      setPeriodos(p.data || []);
      setTrabajadores(t.data || []);
      setBancos(b.data || []);
      setMonedas(m.data || []);
      setSituaciones(s.data || []);
      setConceptos(c.data || []);
    } catch (err) {
      console.error(err);
      alert("No se pudieron cargar los combos.");
    } finally {
      setLoading(false);
    }
  };

  // ------ Listas ------
  const loadHeader = async () => {
    try {
      setLoading(true);
      const res = await auth.get(`/cts-calculada/${empresaId ? `?empresaId=${empresaId}` : ""}`);
      setCtsList(res.data || []);
    } catch (err) {
      console.error(err);
      alert("No se pudo listar CTS Calculada.");
    } finally {
      setLoading(false);
    }
  };

  const loadDetail = async (ctsId) => {
    if (!ctsId) { setConceptosList([]); return; }
    try {
      setLoading(true);
      const res = await auth.get(`/cts-calculada-concepto/?ctsId=${ctsId}`);
      setConceptosList(res.data || []);
    } catch (err) {
      console.error(err);
      alert("No se pudieron listar conceptos.");
    } finally {
      setLoading(false);
    }
  };

  // ------ Effects ------
  useEffect(() => {
    loadCombos();
    loadHeader();
    setFormHeader(emptyHeader);
    setFormDetail(emptyDetail);
    setConceptosList([]);
    setActiveTab("cts");
  }, [empresaId]);

  useEffect(() => {
    if (activeTab === "conceptos") {
      const id = formHeader.PKID || formDetail.PKIDCTSCalculada;
      if (id) loadDetail(id);
    }
  }, [activeTab, formHeader.PKID, formDetail.PKIDCTSCalculada]);

  // ------ Handlers Header ------
  const onHeaderChange = (e) => {
    const { name, value } = e.target;
    setFormHeader((f) => ({ ...f, [name]: value }));
  };

  const onHeaderNew = () => {
    setFormHeader(emptyHeader);
    setFormDetail(emptyDetail);
    setConceptosList([]);
    setActiveTab("cts");
  };

  const onHeaderEdit = (row) => {
    setFormHeader({
      PKID: row.PKID,
      PKIDPeriodoCTS: row.PKIDPeriodoCTS ?? "",
      PKIDTrabajador: row.PKIDTrabajador ?? "",
      PKIDBanco: row.PKIDBanco ?? "",
      CuentaBancariaCTS: row.CuentaBancariaCTS ?? "",
      BaseImponibleCTS: row.BaseImponibleCTS ?? "",
      ImportesCTSSoles: row.ImportesCTSSoles ?? "",
      ImporteCTSUSD: row.ImporteCTSUSD ?? "",
      PKIDMoneda: row.PKIDMoneda ?? "",
      TipoCambioUSD: row.TipoCambioUSD ?? "",
      FechaInicio: row.FechaInicio ?? "",
      FechaTermino: row.FechaTermino ?? "",
      AnoTiempoServicio: row.AnoTiempoServicio ?? "",
      MesTiempoServicio: row.MesTiempoServicio ?? "",
      DiaTiempServicio: row.DiaTiempServicio ?? "",
      DiasLiquidados: row.DiasLiquidados ?? "",
      Regimen: row.Regimen ?? "",
      PorcentajeCTS: row.PorcentajeCTS ?? "",
      ImporteNoComputable: row.ImporteNoComputable ?? "",
      FechaIngresoTrabajador: row.FechaIngresoTrabajador ?? "",
      DescuentoCTS: row.DescuentoCTS ?? "",
      ImporteProvisionCTS: row.ImporteProvisionCTS ?? "",
      DiferenciaProvisionCalculoCTS: row.DiferenciaProvisionCalculoCTS ?? "",
      InteresesSoles: row.InteresesSoles ?? "",
      DiasNoComputables: row.DiasNoComputables ?? "",
      DiasIntereses: row.DiasIntereses ?? "",
      PKIDSituacionRegistro: row.PKIDSituacionRegistro ?? "",
    });
    setFormDetail((d) => ({ ...d, PKIDCTSCalculada: row.PKID }));
  };

  const onHeaderDelete = async (id) => {
    if (!window.confirm("¿Eliminar CTS? (debe no tener conceptos)")) return;
    try {
      setLoading(true);
      await auth.delete(`/cts-calculada/${id}`);
      await loadHeader();
      onHeaderNew();
    } catch (err) {
      alert(prettyError(err));
    } finally {
      setLoading(false);
    }
  };

  const onHeaderSave = async (e) => {
    e.preventDefault();
    if (!empresaId) { alert("Seleccione empresa en el Selector de Contexto."); return; }
    if (!formHeader.PKIDPeriodoCTS || !formHeader.PKIDTrabajador || !formHeader.PKIDBanco || !formHeader.PKIDSituacionRegistro) {
      alert("Complete los campos obligatorios (*)."); return;
    }
    if (formHeader.Regimen && ![1, 2, "1", "2"].includes(formHeader.Regimen)) {
      alert("Regimen inválido: solo 1 (Regular) o 2 (Extraordinario)."); return;
    }
    const payload = normalize(formHeader, intHeader, floatHeader);
    try {
      setLoading(true);
      if (isEditingHeader) {
        await auth.put(`/cts-calculada/${formHeader.PKID}`, { ...payload, PKID: formHeader.PKID });
        alert("CTS actualizada.");
      } else {
        const res = await auth.post(`/cts-calculada/`, payload);
        alert("CTS creada.");
        const newId = res?.data?.PKID;
        if (newId) {
          await loadHeader();
          setFormHeader((f) => ({ ...f, PKID: newId }));
          setFormDetail((d) => ({ ...d, PKIDCTSCalculada: newId }));
        }
      }
      await loadHeader();
    } catch (err) {
      alert(prettyError(err));
    } finally {
      setLoading(false);
    }
  };

  // ------ Handlers Detail ------
  const onDetailChange = (e) => {
    const { name, value, maxLength } = e.target;
    let v = value;
    if (name === "TipoCalculoCTS" && typeof v === "string" && maxLength) v = v.slice(0, maxLength);
    setFormDetail((f) => ({ ...f, [name]: v }));
  };

  const onDetailNew = () => {
    setFormDetail((d) => ({ ...emptyDetail, PKIDCTSCalculada: formHeader.PKID || d.PKIDCTSCalculada }));
  };

  const onDetailEdit = (row) => {
    setFormDetail({
      PKID: row.PKID,
      PKIDCTSCalculada: row.PKIDCTSCalculada,
      PKIDConceptoPlanilla: row.PKIDConceptoPlanilla ?? "",
      BaseImponibleCTS: row.BaseImponibleCTS ?? "",
      FactorCTS: row.FactorCTS ?? "",
      ImporteCTS: row.ImporteCTS ?? "",
      TipoCalculoCTS: row.TipoCalculoCTS ?? "",
      PKIDSituacionRegistro: row.PKIDSituacionRegistro ?? "",
    });
  };

  const onDetailDelete = async (id) => {
    if (!window.confirm("¿Eliminar concepto?")) return;
    try {
      setLoading(true);
      await auth.delete(`/cts-calculada-concepto/${id}`);
      const ctsId = formDetail.PKIDCTSCalculada || formHeader.PKID;
      await loadDetail(ctsId);
      onDetailNew();
    } catch (err) {
      alert(prettyError(err));
    } finally {
      setLoading(false);
    }
  };

  const onDetailSave = async (e) => {
    e.preventDefault();
    const ctsId = formDetail.PKIDCTSCalculada || formHeader.PKID;
    if (!ctsId) { alert("Primero guarde la cabecera (CTS Calculada)."); return; }
    if (!formDetail.PKIDConceptoPlanilla || !formDetail.PKIDSituacionRegistro) {
      alert("Complete los campos obligatorios del concepto (*)."); return;
    }
    const payload = normalize({ ...formDetail, PKIDCTSCalculada: ctsId }, intDetail, floatDetail);
    try {
      setLoading(true);
      if (isEditingDetail) {
        await auth.put(`/cts-calculada-concepto/${formDetail.PKID}`, { ...payload, PKID: formDetail.PKID });
        alert("Concepto actualizado.");
      } else {
        await auth.post(`/cts-calculada-concepto/`, payload);
        alert("Concepto agregado.");
      }
      await loadDetail(ctsId);
      onDetailNew();
    } catch (err) {
      alert(prettyError(err));
    } finally {
      setLoading(false);
    }
  };

  // ------ UI helpers ------
  const periodoLabel = (p) => (p ? `${p.Ano}-${String(p.Mes).padStart(2, "0")}` : "");
  const selectedRow = ctsList.find((x) => Number(x.PKID) === Number(formHeader.PKID));
  const selectedPeriodo = selectedRow ? periodoLabel({ Ano: selectedRow.Ano, Mes: selectedRow.Mes }) : (
    (formHeader.PKIDPeriodoCTS && periodoLabel(periodos.find(p=>Number(p.PKID)===Number(formHeader.PKIDPeriodoCTS)))) || ""
  );
  const selectedTrabajador =
    selectedRow?.Trabajador ||
    (formHeader.PKIDTrabajador && (trabajadores.find(t=>Number(t.PKID)===Number(formHeader.PKIDTrabajador))?.NombreCompleto || ""));

  const tabs = [
    { id: "cts", title: "CTS Calculada" },
    { id: "conceptos", title: selectedTrabajador || selectedPeriodo ? `Conceptos – ${[selectedTrabajador, selectedPeriodo].filter(Boolean).join(" – ")}` : "Conceptos" },
  ];
  const tabBtn = (t) => ({ ...btn.base, ...(activeTab === t ? btn.primary : btn.subtle), padding: "6px 10px" });

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ marginBottom: 16 }}>CTS Calculada</h2>

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
      {activeTab === "cts" && (
        <div style={{ ...card, marginBottom: 16 }}>
          <form onSubmit={onHeaderSave}>
            <div style={row4}>
              <div>
                <label style={label}>Empresa (contexto) *</label>
                <input
                  value={
                    (empresaNombre ? `${empresaNombre} (ID ${empresaId ?? "-"})` : empresaId ? `Empresa ID ${empresaId}` : "(sin empresa)")
                  }
                  disabled
                  style={{ ...input, background: "#f9fafb" }}
                />
              </div>
              <div>
                <label style={label}>Periodo CTS *</label>
                <select name="PKIDPeriodoCTS" value={formHeader.PKIDPeriodoCTS} onChange={onHeaderChange} style={input}>
                  <option value="">-- Seleccionar --</option>
                  {periodos.map((p) => (
                    <option key={p.PKID} value={p.PKID}>{periodoLabel(p)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={label}>Trabajador *</label>
                <select name="PKIDTrabajador" value={formHeader.PKIDTrabajador} onChange={onHeaderChange} style={input}>
                  <option value="">-- Seleccionar --</option>
                  {trabajadores.map((t) => (
                    <option key={t.PKID} value={t.PKID}>{t.NombreCompleto}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={label}>Banco *</label>
                <select name="PKIDBanco" value={formHeader.PKIDBanco} onChange={onHeaderChange} style={input}>
                  <option value="">-- Seleccionar --</option>
                  {bancos.map((b) => (
                    <option key={b.PKID} value={b.PKID}>{b.Banco}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ ...row4, marginTop: 12 }}>
              <div>
                <label style={label}>Cuenta CTS</label>
                <input name="CuentaBancariaCTS" value={formHeader.CuentaBancariaCTS} onChange={onHeaderChange} style={input} />
              </div>
              <div>
                <label style={label}>Moneda</label>
                <select name="PKIDMoneda" value={formHeader.PKIDMoneda || ""} onChange={onHeaderChange} style={input}>
                  <option value="">-- Seleccionar --</option>
                  {monedas.map((m) => (
                    <option key={m.PKID} value={m.PKID}>{m.Moneda}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={label}>T/C USD</label>
                <input name="TipoCambioUSD" value={formHeader.TipoCambioUSD} onChange={onHeaderChange} style={input} />
              </div>
              <div>
                <label style={label}>Situación *</label>
                <select name="PKIDSituacionRegistro" value={formHeader.PKIDSituacionRegistro} onChange={onHeaderChange} style={input}>
                  <option value="">-- Seleccionar --</option>
                  {situaciones.map((s) => (
                    <option key={s.PKID} value={s.PKID}>{s.SituacionRegistro}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ ...row4, marginTop: 12 }}>
              <div>
                <label style={label}>F. Inicio</label>
                <input type="date" name="FechaInicio" value={formHeader.FechaInicio || ""} onChange={onHeaderChange} style={input} />
              </div>
              <div>
                <label style={label}>F. Término</label>
                <input type="date" name="FechaTermino" value={formHeader.FechaTermino || ""} onChange={onHeaderChange} style={input} />
              </div>
              <div>
                <label style={label}>Año TS</label>
                <input name="AnoTiempoServicio" value={formHeader.AnoTiempoServicio} onChange={onHeaderChange} style={input} />
              </div>
              <div>
                <label style={label}>Mes TS</label>
                <input name="MesTiempoServicio" value={formHeader.MesTiempoServicio} onChange={onHeaderChange} style={input} />
              </div>
            </div>

            <div style={{ ...row4, marginTop: 12 }}>
              <div>
                <label style={label}>Día TS</label>
                <input name="DiaTiempServicio" value={formHeader.DiaTiempServicio} onChange={onHeaderChange} style={input} />
              </div>
              <div>
                <label style={label}>Días liquidados</label>
                <input name="DiasLiquidados" value={formHeader.DiasLiquidados} onChange={onHeaderChange} style={input} />
              </div>
              <div>
                <label style={label}>Régimen</label>
                <select name="Regimen" value={formHeader.Regimen || ""} onChange={onHeaderChange} style={input}>
                  <option value="">-- Seleccionar --</option>
                  <option value="1">1 - Regular</option>
                  <option value="2">2 - Extraordinario</option>
                </select>
              </div>
              <div>
                <label style={label}>% CTS</label>
                <input name="PorcentajeCTS" value={formHeader.PorcentajeCTS} onChange={onHeaderChange} style={input} />
              </div>
            </div>

            <div style={{ ...row4, marginTop: 12 }}>
              <div>
                <label style={label}>Base imponible</label>
                <input name="BaseImponibleCTS" value={formHeader.BaseImponibleCTS} onChange={onHeaderChange} style={input} />
              </div>
              <div>
                <label style={label}>Importe CTS S/.</label>
                <input name="ImportesCTSSoles" value={formHeader.ImportesCTSSoles} onChange={onHeaderChange} style={input} />
              </div>
              <div>
                <label style={label}>Importe CTS US$</label>
                <input name="ImporteCTSUSD" value={formHeader.ImporteCTSUSD} onChange={onHeaderChange} style={input} />
              </div>
              <div>
                <label style={label}>No computable</label>
                <input name="ImporteNoComputable" value={formHeader.ImporteNoComputable} onChange={onHeaderChange} style={input} />
              </div>
            </div>

            <div style={{ ...row4, marginTop: 12 }}>
              <div>
                <label style={label}>F. Ingreso Trab.</label>
                <input type="date" name="FechaIngresoTrabajador" value={formHeader.FechaIngresoTrabajador || ""} onChange={onHeaderChange} style={input} />
              </div>
              <div>
                <label style={label}>Descuento CTS</label>
                <input name="DescuentoCTS" value={formHeader.DescuentoCTS} onChange={onHeaderChange} style={input} />
              </div>
              <div>
                <label style={label}>Prov. CTS</label>
                <input name="ImporteProvisionCTS" value={formHeader.ImporteProvisionCTS} onChange={onHeaderChange} style={input} />
              </div>
              <div>
                <label style={label}>Dif. Prov/Calc</label>
                <input name="DiferenciaProvisionCalculoCTS" value={formHeader.DiferenciaProvisionCalculoCTS} onChange={onHeaderChange} style={input} />
              </div>
            </div>

            <div style={{ ...row4, marginTop: 12 }}>
              <div>
                <label style={label}>Intereses S/.</label>
                <input name="InteresesSoles" value={formHeader.InteresesSoles} onChange={onHeaderChange} style={input} />
              </div>
              <div>
                <label style={label}>Días no computables</label>
                <input name="DiasNoComputables" value={formHeader.DiasNoComputables} onChange={onHeaderChange} style={input} />
              </div>
              <div>
                <label style={label}>Días intereses</label>
                <input name="DiasIntereses" value={formHeader.DiasIntereses} onChange={onHeaderChange} style={input} />
              </div>
              <div />
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
              <button type="submit" disabled={loading} style={{ ...btn.base, ...(btn.primary) }}>
                {isEditingHeader ? "Actualizar" : "Agregar"}
              </button>
              <button type="button" disabled={loading} onClick={onHeaderNew} style={{ ...btn.base, ...(btn.neutral) }}>
                Limpiar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* DETALLE: Conceptos */}
      {activeTab === "conceptos" && (
        <div style={{ ...card, marginBottom: 16 }}>
          <form onSubmit={onDetailSave}>
            <div style={row4}>
              <div>
                <label style={label}>CTS</label>
                <input
                  value={
                    formHeader.PKID
                      ? `PKID ${formHeader.PKID}`
                      : formDetail.PKIDCTSCalculada
                      ? `PKID ${formDetail.PKIDCTSCalculada}`
                      : "(nuevo)"
                  }
                  disabled
                  style={{ ...input, background: "#f9fafb" }}
                />
              </div>
              <div>
                <label style={label}>Concepto *</label>
                <select name="PKIDConceptoPlanilla" value={formDetail.PKIDConceptoPlanilla} onChange={onDetailChange} style={input}>
                  <option value="">-- Seleccionar --</option>
                  {conceptos.map((c) => (
                    <option key={c.PKID} value={c.PKID}>{c.ConceptoPlanilla}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={label}>Base imponible</label>
                <input name="BaseImponibleCTS" value={formDetail.BaseImponibleCTS} onChange={onDetailChange} style={input} />
              </div>
              <div>
                <label style={label}>Factor CTS</label>
                <input name="FactorCTS" value={formDetail.FactorCTS} onChange={onDetailChange} style={input} />
              </div>
            </div>

            <div style={{ ...row4, marginTop: 12 }}>
              <div>
                <label style={label}>Importe CTS</label>
                <input name="ImporteCTS" value={formDetail.ImporteCTS} onChange={onDetailChange} style={input} />
              </div>
              <div>
                <label style={label}>Tipo cálculo (1 char)</label>
                <input name="TipoCalculoCTS" maxLength={1} value={formDetail.TipoCalculoCTS || ""} onChange={onDetailChange} style={input} />
              </div>
              <div>
                <label style={label}>Situación *</label>
                <select name="PKIDSituacionRegistro" value={formDetail.PKIDSituacionRegistro} onChange={onDetailChange} style={input}>
                  <option value="">-- Seleccionar --</option>
                  {situaciones.map((s) => (
                    <option key={s.PKID} value={s.PKID}>{s.SituacionRegistro}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
              <button type="submit" disabled={loading} style={{ ...btn.base, ...(btn.primary) }}>
                {isEditingDetail ? "Actualizar" : "Agregar"}
              </button>
              <button type="button" disabled={loading} onClick={onDetailNew} style={{ ...btn.base, ...(btn.neutral) }}>
                Limpiar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* GRILLA CABECERA */}
      {activeTab === "cts" && (
        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <strong>Registros CTS</strong>
            <span style={{ fontSize: 12, color: "#6b7280" }}>Total: {ctsList.length}</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Periodo</th>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Trabajador</th>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Banco</th>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Moneda</th>
                  <th style={{ textAlign: "right", padding: 8, borderBottom: "1px solid #e5e7eb" }}>CTS S/.</th>
                  <th style={{ textAlign: "center", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ctsList.map((r) => {
                  const isSel = Number(r.PKID) === Number(formHeader.PKID || 0);
                  const rowStyle = { background: isSel ? "#fff7ed" : "transparent" };
                  return (
                    <tr key={r.PKID} style={rowStyle}>
                      <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{`${r.Ano}-${String(r.Mes).padStart(2, "0")}`}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{r.Trabajador}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{r.Banco || ""}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{r.Moneda || ""}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6", textAlign: "right" }}>
                        {r.ImportesCTSSoles != null ? r.ImportesCTSSoles : ""}
                      </td>
                      <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6", textAlign: "center" }}>
                        <button onClick={() => onHeaderEdit(r)} style={{ ...btn.base, ...(btn.neutral), marginRight: 6 }}>✏️</button>
                        <button onClick={() => onHeaderDelete(r.PKID)} style={{ ...btn.base, ...(btn.danger) }}>🗑️</button>
                      </td>
                    </tr>
                  );
                })}
                {ctsList.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", padding: 16, color: "#6b7280" }}>
                      No hay registros CTS para la empresa seleccionada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* GRILLA DETALLE */}
      {activeTab === "conceptos" && (formHeader.PKID || formDetail.PKIDCTSCalculada) && (
        <div style={{ ...card, marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <strong>Conceptos</strong>
            <span style={{ fontSize: 12, color: "#6b7280" }}>Total: {conceptosList.length}</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Concepto</th>
                  <th style={{ textAlign: "right", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Base</th>
                  <th style={{ textAlign: "right", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Factor</th>
                  <th style={{ textAlign: "right", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Importe</th>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Tipo</th>
                  <th style={{ textAlign: "center", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {conceptosList.map((r) => (
                  <tr key={r.PKID}>
                    <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{r.ConceptoPlanilla}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6", textAlign: "right" }}>{r.BaseImponibleCTS ?? ""}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6", textAlign: "right" }}>{r.FactorCTS ?? ""}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6", textAlign: "right" }}>{r.ImporteCTS ?? ""}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{r.TipoCalculoCTS ?? ""}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6", textAlign: "center" }}>
                      <button onClick={() => onDetailEdit(r)} style={{ ...btn.base, ...(btn.neutral), marginRight: 6 }}>✏️</button>
                      <button onClick={() => onDetailDelete(r.PKID)} style={{ ...btn.base, ...(btn.danger) }}>🗑️</button>
                    </td>
                  </tr>
                ))}
                {conceptosList.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", padding: 16, color: "#6b7280" }}>
                      No hay conceptos para esta CTS.
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
