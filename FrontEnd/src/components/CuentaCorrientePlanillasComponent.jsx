// src/components/CuentaCorrientePlanillasComponent.jsx
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

// ---------- UI base styles ----------
const card = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: 16,
  boxShadow: "0 1px 2px rgba(0,0,0,.05)",
};
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

// ---------- helpers ----------
function prettyError(err) {
  const d = err?.response?.data;
  if (!d) return err?.message || "Error";
  if (Array.isArray(d.detail))
    return d.detail.map((e) => `• ${(Array.isArray(e.loc) ? e.loc.join(".") : e.loc)}: ${e.msg}`).join("\n");
  return String(d.detail || "Error");
}

// Normaliza cualquier string de fecha a "YYYY-MM-DD"
function normalizeDateInput(v) {
  if (!v) return "";
  if (v instanceof Date && !isNaN(v)) return v.toISOString().slice(0, 10);
  if (typeof v === "string") {
    // Si viene con hora: "YYYY-MM-DDTHH:mm:ss..."
    if (v.length >= 10 && v[4] === "-" && v[7] === "-") return v.slice(0, 10);
    // Aceptar "YYYY-M-D", "YYYY-MM-D", "YYYY-M-DD", etc.
    const m = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (m) {
      const y = m[1];
      const mm = String(m[2]).padStart(2, "0");
      const dd = String(m[3]).padStart(2, "0");
      return `${y}-${mm}-${dd}`;
    }
    // Intento de parseo genérico
    const d = new Date(v);
    if (!isNaN(d)) return d.toISOString().slice(0, 10);
  }
  return ""; // si no cumple, mejor vacío para no romper el input date
}

const intCab = new Set([
  "IDCuentaCorrientePlanillas",
  "PKIDTrabajador",
  "PKIDMoneda",
  "NumeroCuotas",
  "PKIDSituacionRegistro",
  "PKIDConceptoPlanilla",
  "PKIDCuentaContable",
  "PKIDTipoComprobante",
]);
const floatCab = new Set(["ImporteDocumento", "ImporteAbono", "ImporteSaldo", "TasaInteres"]);

const intAp = new Set(["PKIDCuentaCorrientePlanillas", "PKIDTipoPlanilla", "PKIDSituacionRegistro"]);
const floatAp = new Set([]);

const intCuota = new Set([
  "PKIDCuentaCorrientePlanillas",
  "NumeroCuota",
  "ano",
  "mes",
  "PKIDTipoPlanilla",
  "Semana",
  "PKIDNomina",
  "anoaplicacion",
  "mesaplicacion",
  "semanaaplicacion",
  "SecuenciaAnoMesAplicacion",
  "IndicadorProceso",
  "PKIDSituacionRegistro",
]);
const floatCuota = new Set(["ImporteCuota", "ImporteAplicado"]);

function normalize(obj, intFields, floatFields) {
  const out = {};
  for (const [k, v0] of Object.entries(obj)) {
    if (v0 === "" || typeof v0 === "undefined") {
      out[k] = null;
      continue;
    }
    if (intFields.has(k)) out[k] = Number(v0);
    else if (floatFields.has(k)) out[k] = Number(v0);
    else out[k] = v0;
  }
  return out;
}

export default function CuentaCorrientePlanillasComponent() {
  const auth = useAuthAxios();
  const { empresaId, empresaNombre } = useGlobal() || {};
  const [activeTab, setActiveTab] = useState("cabecera");

  // listas
  const [ccList, setCcList] = useState([]);
  const [apList, setApList] = useState([]);
  const [cuotasList, setCuotasList] = useState([]);

  // combos
  const [trabajadores, setTrabajadores] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [situaciones, setSituaciones] = useState([]);
  const [conceptos, setConceptos] = useState([]);
  const [cuentas, setCuentas] = useState([]);
  const [tiposComprobante, setTiposComprobante] = useState([]);
  const [tiposPlanilla, setTiposPlanilla] = useState([]);
  const [nominas, setNominas] = useState([]);

  // forms
  const emptyCab = {
    PKID: null,
    IDCuentaCorrientePlanillas: "",
    PKIDTrabajador: "",
    DocumentoReferencia: "",
    GlosaReferencia: "",
    FechaEmision: "",
    FechaVencimiento: "",
    PKIDMoneda: "",
    ImporteDocumento: "",
    ImporteAbono: "",
    ImporteSaldo: "",
    NumeroCuotas: "",
    TasaInteres: "",
    IndicadorControlCheck: false,
    PKIDSituacionRegistro: "",
    PKIDConceptoPlanilla: "",
    PKIDCuentaContable: "",
    PKIDTipoComprobante: "",
  };
  const [formCab, setFormCab] = useState(emptyCab);

  const emptyAp = {
    PKID: null,
    PKIDCuentaCorrientePlanillas: null,
    PKIDTipoPlanilla: "",
    PKIDSituacionRegistro: "",
  };
  const [formAp, setFormAp] = useState(emptyAp);

  const emptyCuota = {
    PKID: null,
    PKIDCuentaCorrientePlanillas: null,
    NumeroCuota: "",
    ano: "",
    mes: "",
    PKIDTipoPlanilla: "",
    Semana: "",
    FechaCuotaEstimada: "",
    ImporteCuota: "",
    ImporteAplicado: "",
    PKIDNomina: "",
    anoaplicacion: "",
    mesaplicacion: "",
    semanaaplicacion: "",
    SecuenciaAnoMesAplicacion: "",
    TipoPago: "",
    IndicadorProceso: "",
    PKIDSituacionRegistro: "",
  };
  const [formCuota, setFormCuota] = useState(emptyCuota);

  const isEditingCab = formCab.PKID !== null;
  const isEditingAp = formAp.PKID !== null;
  const isEditingCuota = formCuota.PKID !== null;
  const [loading, setLoading] = useState(false);

  // Combos
  const loadCombos = async () => {
    try {
      setLoading(true);
      const [t, m, s, cp, cc, tc, tp, n] = await Promise.all([
        empresaId ? auth.get(`/ccp-combos/trabajador/?empresaId=${empresaId}`) : Promise.resolve({ data: [] }),
        auth.get(`/ccp-combos/moneda/`),
        auth.get(`/ccp-combos/situacion/`),
        auth.get(`/ccp-combos/concepto-planilla/`),
        auth.get(`/ccp-combos/cuenta-contable/`),
        auth.get(`/ccp-combos/tipo-comprobante/`),
        auth.get(`/ccp-combos/tipo-planilla/`),
        auth.get(`/ccp-combos/nomina/`),
      ]);
      setTrabajadores(t.data || []);
      setMonedas(m.data || []);
      setSituaciones(s.data || []);
      setConceptos(cp.data || []);
      setCuentas(cc.data || []);
      setTiposComprobante(tc.data || []);
      setTiposPlanilla(tp.data || []);
      setNominas(n.data || []);
    } catch (err) {
      console.error(err);
      alert("No se pudieron cargar los combos.");
    } finally {
      setLoading(false);
    }
  };

  // Listas
  const loadCab = async () => {
    try {
      setLoading(true);
    // Nota: no hace falta normalizar aquí; solo normalizamos al cargar en los inputs.
      const res = await auth.get(`/cuenta-corriente-planillas/${empresaId ? `?empresaId=${empresaId}` : ""}`);
      setCcList(res.data || []);
    } catch (err) {
      console.error(err);
      alert("No se pudo listar Cuenta Corriente.");
    } finally {
      setLoading(false);
    }
  };

  const loadAp = async (ccId) => {
    if (!ccId) {
      setApList([]);
      return;
    }
    try {
      setLoading(true);
      const res = await auth.get(`/ccp-aplicacion/?ccId=${ccId}`);
      setApList(res.data || []);
    } catch (err) {
      console.error(err);
      alert("No se pudo listar Aplicación.");
    } finally {
      setLoading(false);
    }
  };

  const loadCuotas = async (ccId) => {
    if (!ccId) {
      setCuotasList([]);
      return;
    }
    try {
      setLoading(true);
      const res = await auth.get(`/ccp-cuotas/?ccId=${ccId}`);
      setCuotasList(res.data || []);
    } catch (err) {
      console.error(err);
      alert("No se pudo listar Cuotas.");
    } finally {
      setLoading(false);
    }
  };

  // Effects
  useEffect(() => {
    loadCombos();
    loadCab();
    setFormCab(emptyCab);
    setFormAp(emptyAp);
    setFormCuota(emptyCuota);
    setApList([]);
    setCuotasList([]);
    setActiveTab("cabecera");
  }, [empresaId]);

  useEffect(() => {
    const ccId =
      formCab.PKID ||
      formAp.PKIDCuentaCorrientePlanillas ||
      formCuota.PKIDCuentaCorrientePlanillas;
    if (activeTab === "aplicacion" && ccId) loadAp(ccId);
    if (activeTab === "cuotas" && ccId) loadCuotas(ccId);
  }, [activeTab, formCab.PKID, formAp.PKIDCuentaCorrientePlanillas, formCuota.PKIDCuentaCorrientePlanillas]);

  // Handlers CABECERA
  const onCabChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormCab((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const onCabNew = () => {
    setFormCab(emptyCab);
    setFormAp((d) => ({ ...emptyAp, PKIDCuentaCorrientePlanillas: null }));
    setFormCuota((d) => ({ ...emptyCuota, PKIDCuentaCorrientePlanillas: null }));
    setApList([]);
    setCuotasList([]);
    setActiveTab("cabecera");
  };

  const onCabEdit = (row) => {
    setFormCab({
      PKID: row.PKID,
      IDCuentaCorrientePlanillas: row.IDCuentaCorrientePlanillas ?? "",
      PKIDTrabajador: row.PKIDTrabajador ?? "",
      DocumentoReferencia: row.DocumentoReferencia ?? "",
      GlosaReferencia: row.GlosaReferencia ?? "",
      // 🔧 Normalizamos las fechas para <input type="date">
      FechaEmision: normalizeDateInput(row.FechaEmision) ?? "",
      FechaVencimiento: normalizeDateInput(row.FechaVencimiento) ?? "",
      PKIDMoneda: row.PKIDMoneda ?? "",
      ImporteDocumento: row.ImporteDocumento ?? "",
      ImporteAbono: row.ImporteAbono ?? "",
      ImporteSaldo: row.ImporteSaldo ?? "",
      NumeroCuotas: row.NumeroCuotas ?? "",
      TasaInteres: row.TasaInteres ?? "",
      IndicadorControlCheck: !!row.IndicadorControlCheck,
      PKIDSituacionRegistro: row.PKIDSituacionRegistro ?? "",
      PKIDConceptoPlanilla: row.PKIDConceptoPlanilla ?? "",
      PKIDCuentaContable: row.PKIDCuentaContable ?? "",
      PKIDTipoComprobante: row.PKIDTipoComprobante ?? "",
    });
    setFormAp((d) => ({ ...d, PKIDCuentaCorrientePlanillas: row.PKID }));
    setFormCuota((d) => ({ ...d, PKIDCuentaCorrientePlanillas: row.PKID }));
  };

  const onCabDelete = async (id) => {
    if (!window.confirm("¿Eliminar cuenta? (no debe tener aplicaciones ni cuotas)")) return;
    try {
      setLoading(true);
      await auth.delete(`/cuenta-corriente-planillas/${id}`);
      await loadCab();
      onCabNew();
    } catch (err) {
      alert(prettyError(err));
    } finally {
      setLoading(false);
    }
  };

  const onCabSave = async (e) => {
    e.preventDefault();
    if (!empresaId) {
      alert("Seleccione una empresa en el Selector de Contexto.");
      return;
    }
    const required = [
      "IDCuentaCorrientePlanillas",
      "PKIDTrabajador",
      "DocumentoReferencia",
      "GlosaReferencia",
      "FechaEmision",
      "PKIDMoneda",
      "ImporteDocumento",
      "PKIDSituacionRegistro",
    ];
    for (const k of required) {
      if (!formCab[k] && formCab[k] !== 0) {
        alert(`Complete el campo: ${k}`);
        return;
      }
    }
    const payload = normalize(formCab, intCab, floatCab);
    try {
      setLoading(true);
      if (isEditingCab) {
        await auth.put(`/cuenta-corriente-planillas/${formCab.PKID}`, { ...payload, PKID: formCab.PKID });
        alert("Cuenta actualizada.");
      } else {
        const res = await auth.post(`/cuenta-corriente-planillas/`, payload);
        alert("Cuenta creada.");
        const newId = res?.data?.PKID;
        if (newId) {
          await loadCab();
          setFormCab((f) => ({ ...f, PKID: newId }));
          setFormAp((d) => ({ ...d, PKIDCuentaCorrientePlanillas: newId }));
          setFormCuota((d) => ({ ...d, PKIDCuentaCorrientePlanillas: newId }));
        }
      }
      await loadCab();
    } catch (err) {
      alert(prettyError(err));
    } finally {
      setLoading(false);
    }
  };

  // Handlers APLICACION
  const onApChange = (e) => {
    const { name, value } = e.target;
    setFormAp((f) => ({ ...f, [name]: value }));
  };
  const onApNew = () =>
    setFormAp((d) => ({ ...emptyAp, PKIDCuentaCorrientePlanillas: formCab.PKID || d.PKIDCuentaCorrientePlanillas }));
  const onApEdit = (row) =>
    setFormAp({
      PKID: row.PKID,
      PKIDCuentaCorrientePlanillas: row.PKIDCuentaCorrientePlanillas,
      PKIDTipoPlanilla: row.PKIDTipoPlanilla ?? "",
      PKIDSituacionRegistro: row.PKIDSituacionRegistro ?? "",
    });
  const onApDelete = async (id) => {
    if (!window.confirm("¿Eliminar aplicación?")) return;
    try {
      setLoading(true);
      await auth.delete(`/ccp-aplicacion/${id}`);
      const ccId = formCab.PKID || formAp.PKIDCuentaCorrientePlanillas;
      await loadAp(ccId);
      onApNew();
    } catch (err) {
      alert(prettyError(err));
    } finally {
      setLoading(false);
    }
  };
  const onApSave = async (e) => {
    e.preventDefault();
    const ccId = formCab.PKID || formAp.PKIDCuentaCorrientePlanillas;
    if (!ccId) {
      alert("Primero guarde la cabecera.");
      return;
    }
    if (!formAp.PKIDTipoPlanilla || !formAp.PKIDSituacionRegistro) {
      alert("Complete los campos de Aplicación (*).");
      return;
    }
    const payload = normalize({ ...formAp, PKIDCuentaCorrientePlanillas: ccId }, intAp, floatAp);
    try {
      setLoading(true);
      if (isEditingAp) {
        await auth.put(`/ccp-aplicacion/${formAp.PKID}`, { ...payload, PKID: formAp.PKID });
        alert("Aplicación actualizada.");
      } else {
        await auth.post(`/ccp-aplicacion/`, payload);
        alert("Aplicación agregada.");
      }
      await loadAp(ccId);
      onApNew();
    } catch (err) {
      alert(prettyError(err));
    } finally {
      setLoading(false);
    }
  };

  // Handlers CUOTAS
  const onCuotaChange = (e) => {
    const { name, value, maxLength } = e.target;
    // Para date inputs el valor YA viene 'YYYY-MM-DD'
    setFormCuota((f) => ({ ...f, [name]: maxLength ? String(value).slice(0, maxLength) : value }));
  };
  const onCuotaNew = () =>
    setFormCuota((d) => ({
      ...emptyCuota,
      PKIDCuentaCorrientePlanillas: formCab.PKID || d.PKIDCuentaCorrientePlanillas,
    }));
  const onCuotaEdit = (row) =>
    setFormCuota({
      PKID: row.PKID,
      PKIDCuentaCorrientePlanillas: row.PKIDCuentaCorrientePlanillas,
      NumeroCuota: row.NumeroCuota ?? "",
      ano: row.ano ?? "",
      mes: row.mes ?? "",
      PKIDTipoPlanilla: row.PKIDTipoPlanilla ?? "",
      Semana: row.Semana ?? "",
      // 🔧 Normalizamos para el input date
      FechaCuotaEstimada: normalizeDateInput(row.FechaCuotaEstimada) ?? "",
      ImporteCuota: row.ImporteCuota ?? "",
      ImporteAplicado: row.ImporteAplicado ?? "",
      PKIDNomina: row.PKIDNomina ?? "",
      anoaplicacion: row.anoaplicacion ?? "",
      mesaplicacion: row.mesaplicacion ?? "",
      semanaaplicacion: row.semanaaplicacion ?? "",
      SecuenciaAnoMesAplicacion: row.SecuenciaAnoMesAplicacion ?? "",
      TipoPago: row.TipoPago ?? "",
      IndicadorProceso: row.IndicadorProceso ?? "",
      PKIDSituacionRegistro: row.PKIDSituacionRegistro ?? "",
    });
  const onCuotaDelete = async (id) => {
    if (!window.confirm("¿Eliminar cuota?")) return;
    try {
      setLoading(true);
      await auth.delete(`/ccp-cuotas/${id}`);
      const ccId = formCab.PKID || formCuota.PKIDCuentaCorrientePlanillas;
      await loadCuotas(ccId);
      onCuotaNew();
    } catch (err) {
      alert(prettyError(err));
    } finally {
      setLoading(false);
    }
  };
  const onCuotaSave = async (e) => {
    e.preventDefault();
    const ccId = formCab.PKID || formCuota.PKIDCuentaCorrientePlanillas;
    if (!ccId) {
      alert("Primero guarde la cabecera.");
      return;
    }
    const required = [
      "NumeroCuota",
      "ano",
      "mes",
      "PKIDTipoPlanilla",
      "FechaCuotaEstimada",
      "ImporteCuota",
      "PKIDNomina",
      "PKIDSituacionRegistro",
    ];
    for (const k of required) {
      if (!formCuota[k] && formCuota[k] !== 0) {
        alert(`Complete el campo: ${k}`);
        return;
      }
    }
    const payload = normalize({ ...formCuota, PKIDCuentaCorrientePlanillas: ccId }, intCuota, floatCuota);
    try {
      setLoading(true);
      if (isEditingCuota) {
        await auth.put(`/ccp-cuotas/${formCuota.PKID}`, { ...payload, PKID: formCuota.PKID });
        alert("Cuota actualizada.");
      } else {
        await auth.post(`/ccp-cuotas/`, payload);
        alert("Cuota agregada.");
      }
      await loadCuotas(ccId);
      onCuotaNew();
    } catch (err) {
      alert(prettyError(err));
    } finally {
      setLoading(false);
    }
  };

  // UI helpers
  const selectedRow = ccList.find((x) => Number(x.PKID) === Number(formCab.PKID || 0));
  const selectedTrabajador =
    selectedRow?.Trabajador ||
    (trabajadores.find((t) => Number(t.PKID) === Number(formCab.PKIDTrabajador))?.NombreCompleto || "");
  const tabBtn = (id) => ({
    ...btn.base,
    ...(activeTab === id ? btn.primary : btn.subtle),
    padding: "6px 10px",
  });
  const tabs = [
    { id: "cabecera", title: "Cuenta Corriente" },
    { id: "aplicacion", title: selectedTrabajador ? `Aplicación – ${selectedTrabajador}` : "Aplicación" },
    { id: "cuotas", title: selectedTrabajador ? `Cuotas – ${selectedTrabajador}` : "Cuotas" },
  ];

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ marginBottom: 16 }}>Cuenta Corriente de Planillas</h2>

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
      {activeTab === "cabecera" && (
        <div style={{ ...card, marginBottom: 16 }}>
          <form onSubmit={onCabSave}>
            <div style={row4}>
              <div>
                <label style={label}>Empresa</label>
                <input
                  value={
                    empresaNombre ? `${empresaNombre} (ID ${empresaId ?? "-"})` : empresaId ? `Empresa ID ${empresaId}` : "(sin empresa)"
                  }
                  disabled
                  style={{ ...input, background: "#f9fafb" }}
                />
              </div>
              <div>
                <label style={label}>ID Cuenta Corriente *</label>
                <input
                  name="IDCuentaCorrientePlanillas"
                  value={formCab.IDCuentaCorrientePlanillas}
                  onChange={onCabChange}
                  style={input}
                />
              </div>
              <div>
                <label style={label}>Trabajador *</label>
                <select name="PKIDTrabajador" value={formCab.PKIDTrabajador} onChange={onCabChange} style={input}>
                  <option value="">-- Seleccionar --</option>
                  {trabajadores.map((t) => (
                    <option key={t.PKID} value={t.PKID}>
                      {t.NombreCompleto}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={label}>Moneda *</label>
                <select name="PKIDMoneda" value={formCab.PKIDMoneda} onChange={onCabChange} style={input}>
                  <option value="">-- Seleccionar --</option>
                  {monedas.map((m) => (
                    <option key={m.PKID} value={m.PKID}>
                      {m.Moneda}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ ...row4, marginTop: 12 }}>
              <div>
                <label style={label}>Documento Ref. *</label>
                <input name="DocumentoReferencia" value={formCab.DocumentoReferencia} onChange={onCabChange} style={input} />
              </div>
              <div>
                <label style={label}>Glosa Ref. *</label>
                <input name="GlosaReferencia" value={formCab.GlosaReferencia} onChange={onCabChange} style={input} />
              </div>
              <div>
                <label style={label}>F. Emisión *</label>
                <input
                  type="date"
                  name="FechaEmision"
                  value={formCab.FechaEmision || ""}
                  onChange={onCabChange}
                  style={input}
                />
              </div>
              <div>
                <label style={label}>F. Vencimiento</label>
                <input
                  type="date"
                  name="FechaVencimiento"
                  value={formCab.FechaVencimiento || ""}
                  onChange={onCabChange}
                  style={input}
                />
              </div>
            </div>

            <div style={{ ...row4, marginTop: 12 }}>
              <div>
                <label style={label}>Importe Doc. *</label>
                <input name="ImporteDocumento" value={formCab.ImporteDocumento} onChange={onCabChange} style={input} />
              </div>
              <div>
                <label style={label}>Abono</label>
                <input name="ImporteAbono" value={formCab.ImporteAbono} onChange={onCabChange} style={input} />
              </div>
              <div>
                <label style={label}>Saldo</label>
                <input name="ImporteSaldo" value={formCab.ImporteSaldo} onChange={onCabChange} style={input} />
              </div>
              <div>
                <label style={label}>Número Cuotas</label>
                <input name="NumeroCuotas" value={formCab.NumeroCuotas} onChange={onCabChange} style={input} />
              </div>
            </div>

            <div style={{ ...row4, marginTop: 12 }}>
              <div>
                <label style={label}>Tasa Interés</label>
                <input name="TasaInteres" value={formCab.TasaInteres} onChange={onCabChange} style={input} />
              </div>
              <div>
                <label style={label}>Situación *</label>
                <select
                  name="PKIDSituacionRegistro"
                  value={formCab.PKIDSituacionRegistro}
                  onChange={onCabChange}
                  style={input}
                >
                  <option value="">-- Seleccionar --</option>
                  {situaciones.map((s) => (
                    <option key={s.PKID} value={s.PKID}>
                      {s.SituacionRegistro}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={label}>Concepto Planilla</label>
                <select
                  name="PKIDConceptoPlanilla"
                  value={formCab.PKIDConceptoPlanilla || ""}
                  onChange={onCabChange}
                  style={input}
                >
                  <option value="">-- Seleccionar --</option>
                  {conceptos.map((c) => (
                    <option key={c.PKID} value={c.PKID}>
                      {c.ConceptoPlanilla}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={label}>Cuenta Contable</label>
                <select
                  name="PKIDCuentaContable"
                  value={formCab.PKIDCuentaContable || ""}
                  onChange={onCabChange}
                  style={input}
                >
                  <option value="">-- Seleccionar --</option>
                  {cuentas.map((c) => (
                    <option key={c.PKID} value={c.PKID}>
                      {c.CuentaContable}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ ...row4, marginTop: 12 }}>
              <div>
                <label style={label}>Tipo Comprobante</label>
                <select
                  name="PKIDTipoComprobante"
                  value={formCab.PKIDTipoComprobante || ""}
                  onChange={onCabChange}
                  style={input}
                >
                  <option value="">-- Seleccionar --</option>
                  {tiposComprobante.map((t) => (
                    <option key={t.PKID} value={t.PKID}>
                      {t.TipoComprobante}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 22 }}>
                <input
                  type="checkbox"
                  name="IndicadorControlCheck"
                  checked={!!formCab.IndicadorControlCheck}
                  onChange={onCabChange}
                />
                <span>Control</span>
              </div>
              <div />
              <div />
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
              <button type="submit" disabled={loading} style={{ ...btn.base, ...btn.primary }}>
                {isEditingCab ? "Actualizar" : "Agregar"}
              </button>
              <button type="button" disabled={loading} onClick={onCabNew} style={{ ...btn.base, ...btn.neutral }}>
                Limpiar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* APLICACION */}
      {activeTab === "aplicacion" && (
        <div style={{ ...card, marginBottom: 16 }}>
          <form onSubmit={onApSave}>
            <div style={row4}>
              <div>
                <label style={label}>Cuenta</label>
                <input
                  value={
                    formCab.PKID
                      ? `PKID ${formCab.PKID}`
                      : formAp.PKIDCuentaCorrientePlanillas
                      ? `PKID ${formAp.PKIDCuentaCorrientePlanillas}`
                      : "(nuevo)"
                  }
                  disabled
                  style={{ ...input, background: "#f9fafb" }}
                />
              </div>
              <div>
                <label style={label}>Tipo Planilla *</label>
                <select
                  name="PKIDTipoPlanilla"
                  value={formAp.PKIDTipoPlanilla}
                  onChange={onApChange}
                  style={input}
                >
                  <option value="">-- Seleccionar --</option>
                  {tiposPlanilla.map((t) => (
                    <option key={t.PKID} value={t.PKID}>
                      {t.TipoPlanilla}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={label}>Situación *</label>
                <select
                  name="PKIDSituacionRegistro"
                  value={formAp.PKIDSituacionRegistro}
                  onChange={onApChange}
                  style={input}
                >
                  <option value="">-- Seleccionar --</option>
                  {situaciones.map((s) => (
                    <option key={s.PKID} value={s.PKID}>
                      {s.SituacionRegistro}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
              <button type="submit" disabled={loading} style={{ ...btn.base, ...btn.primary }}>
                {isEditingAp ? "Actualizar" : "Agregar"}
              </button>
              <button type="button" disabled={loading} onClick={onApNew} style={{ ...btn.base, ...btn.neutral }}>
                Limpiar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CUOTAS */}
      {activeTab === "cuotas" && (
        <div style={{ ...card, marginBottom: 16 }}>
          <form onSubmit={onCuotaSave}>
            <div style={row4}>
              <div>
                <label style={label}>Cuenta</label>
                <input
                  value={
                    formCab.PKID
                      ? `PKID ${formCab.PKID}`
                      : formCuota.PKIDCuentaCorrientePlanillas
                      ? `PKID ${formCuota.PKIDCuentaCorrientePlanillas}`
                      : "(nuevo)"
                  }
                  disabled
                  style={{ ...input, background: "#f9fafb" }}
                />
              </div>

              {/* EDITABLES */}
              <div>
                <label style={label}>N° Cuota *</label>
                <input
                  name="NumeroCuota"
                  type="number"
                  value={formCuota.NumeroCuota}
                  onChange={onCuotaChange}
                  style={input}
                />
              </div>
              <div>
                <label style={label}>Año *</label>
                <input
                  name="ano"
                  type="number"
                  value={formCuota.ano}
                  onChange={onCuotaChange}
                  style={input}
                />
              </div>
              <div>
                <label style={label}>Mes *</label>
                <input
                  name="mes"
                  type="number"
                  value={formCuota.mes}
                  onChange={onCuotaChange}
                  style={input}
                />
              </div>
            </div>

            <div style={{ ...row4, marginTop: 12 }}>
              <div>
                <label style={label}>Tipo Planilla *</label>
                <select
                  name="PKIDTipoPlanilla"
                  value={formCuota.PKIDTipoPlanilla}
                  onChange={onCuotaChange}
                  style={input}
                >
                  <option value="">-- Seleccionar --</option>
                  {tiposPlanilla.map((t) => (
                    <option key={t.PKID} value={t.PKID}>
                      {t.TipoPlanilla}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={label}>Semana</label>
                <input
                  name="Semana"
                  type="number"
                  value={formCuota.Semana}
                  onChange={onCuotaChange}
                  style={input}
                />
              </div>

              {/* EDITABLES */}
              <div>
                <label style={label}>F. Cuota Estimada *</label>
                <input
                  type="date"
                  name="FechaCuotaEstimada"
                  value={formCuota.FechaCuotaEstimada || ""}
                  onChange={onCuotaChange}
                  style={input}
                />
              </div>
              <div>
                <label style={label}>Importe Cuota *</label>
                <input
                  name="ImporteCuota"
                  type="number"
                  step="0.01"
                  value={formCuota.ImporteCuota}
                  onChange={onCuotaChange}
                  style={input}
                />
              </div>
            </div>

            <div style={{ ...row4, marginTop: 12 }}>
              {/* BLOQUEADOS */}
              <div>
                <label style={label}>Importe Aplicado</label>
                <input
                  name="ImporteAplicado"
                  value={formCuota.ImporteAplicado || ""}
                  onChange={onCuotaChange}
                  disabled
                  style={{ ...input, background: "#f9fafb" }}
                />
              </div>

              {/* EDITABLE */}
              <div>
                <label style={label}>Nómina *</label>
                <select name="PKIDNomina" value={formCuota.PKIDNomina} onChange={onCuotaChange} style={input}>
                  <option value="">-- Seleccionar --</option>
                  {nominas.map((n) => (
                    <option key={n.PKID} value={n.PKID}>
                      {n.Nomina}
                    </option>
                  ))}
                </select>
              </div>

              {/* BLOQUEADOS */}
              <div>
                <label style={label}>Año Apl.</label>
                <input
                  name="anoaplicacion"
                  value={formCuota.anoaplicacion || ""}
                  onChange={onCuotaChange}
                  disabled
                  style={{ ...input, background: "#f9fafb" }}
                />
              </div>
              <div>
                <label style={label}>Mes Apl.</label>
                <input
                  name="mesaplicacion"
                  value={formCuota.mesaplicacion || ""}
                  onChange={onCuotaChange}
                  disabled
                  style={{ ...input, background: "#f9fafb" }}
                />
              </div>
            </div>

            <div style={{ ...row4, marginTop: 12 }}>
              {/* BLOQUEADOS */}
              <div>
                <label style={label}>Semana Apl.</label>
                <input
                  name="semanaaplicacion"
                  value={formCuota.semanaaplicacion || ""}
                  onChange={onCuotaChange}
                  disabled
                  style={{ ...input, background: "#f9fafb" }}
                />
              </div>
              <div>
                <label style={label}>Secuencia Año-Mes Apl.</label>
                <input
                  name="SecuenciaAnoMesAplicacion"
                  value={formCuota.SecuenciaAnoMesAplicacion || ""}
                  onChange={onCuotaChange}
                  disabled
                  style={{ ...input, background: "#f9fafb" }}
                />
              </div>
              <div>
                <label style={label}>Tipo Pago (3)</label>
                <input
                  name="TipoPago"
                  maxLength={3}
                  value={formCuota.TipoPago || ""}
                  onChange={onCuotaChange}
                  disabled
                  style={{ ...input, background: "#f9fafb" }}
                />
              </div>
              <div>
                <label style={label}>Indicador Proceso</label>
                <input
                  name="IndicadorProceso"
                  value={formCuota.IndicadorProceso || ""}
                  onChange={onCuotaChange}
                  disabled
                  style={{ ...input, background: "#f9fafb" }}
                />
              </div>
            </div>

            <div style={{ ...row4, marginTop: 12 }}>
              <div>
                <label style={label}>Situación *</label>
                <select
                  name="PKIDSituacionRegistro"
                  value={formCuota.PKIDSituacionRegistro}
                  onChange={onCuotaChange}
                  style={input}
                >
                  <option value="">-- Seleccionar --</option>
                  {situaciones.map((s) => (
                    <option key={s.PKID} value={s.PKID}>
                      {s.SituacionRegistro}
                    </option>
                  ))}
                </select>
              </div>
              <div />
              <div />
              <div />
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
              <button type="submit" disabled={loading} style={{ ...btn.base, ...btn.primary }}>
                {isEditingCuota ? "Actualizar" : "Agregar"}
              </button>
              <button type="button" disabled={loading} onClick={onCuotaNew} style={{ ...btn.base, ...btn.neutral }}>
                Limpiar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* GRILLA CABECERA */}
      {activeTab === "cabecera" && (
        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <strong>Registros</strong>
            <span style={{ fontSize: 12, color: "#6b7280" }}>Total: {ccList.length}</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>ID</th>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Trabajador</th>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Doc Ref</th>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Moneda</th>
                  <th style={{ textAlign: "right", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Saldo</th>
                  <th style={{ textAlign: "center", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ccList.map((r) => {
                  const isSel = Number(r.PKID) === Number(formCab.PKID || 0);
                  const rowStyle = { background: isSel ? "#fff7ed" : "transparent" };
                  return (
                    <tr key={r.PKID} style={rowStyle}>
                      <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>
                        {r.IDCuentaCorrientePlanillas}
                      </td>
                      <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{r.Trabajador}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{r.DocumentoReferencia}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{r.Moneda}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6", textAlign: "right" }}>
                        {r.ImporteSaldo != null ? r.ImporteSaldo : ""}
                      </td>
                      <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6", textAlign: "center" }}>
                        <button
                          onClick={() => onCabEdit(r)}
                          style={{ ...btn.base, ...btn.neutral, marginRight: 6 }}
                        >
                          ✏️
                        </button>
                        <button onClick={() => onCabDelete(r.PKID)} style={{ ...btn.base, ...btn.danger }}>
                          🗑️
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {ccList.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", padding: 16, color: "#6b7280" }}>
                      No hay registros para la empresa seleccionada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* GRILLA APLICACION */}
      {activeTab === "aplicacion" && (formCab.PKID || formAp.PKIDCuentaCorrientePlanillas) && (
        <div style={{ ...card, marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <strong>Aplicación</strong>
            <span style={{ fontSize: 12, color: "#6b7280" }}>Total: {apList.length}</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Tipo Planilla</th>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Situación</th>
                  <th style={{ textAlign: "center", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {apList.map((r) => (
                  <tr key={r.PKID}>
                    <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{r.TipoPlanilla}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{r.SituacionRegistro}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6", textAlign: "center" }}>
                      <button
                        onClick={() => onApEdit(r)}
                        style={{ ...btn.base, ...btn.neutral, marginRight: 6 }}
                      >
                        ✏️
                      </button>
                      <button onClick={() => onApDelete(r.PKID)} style={{ ...btn.base, ...btn.danger }}>
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
                {apList.length === 0 && (
                  <tr>
                    <td colSpan="3" style={{ textAlign: "center", padding: 16, color: "#6b7280" }}>
                      No hay aplicaciones para esta cuenta.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* GRILLA CUOTAS */}
      {activeTab === "cuotas" && (formCab.PKID || formCuota.PKIDCuentaCorrientePlanillas) && (
        <div style={{ ...card, marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <strong>Cuotas</strong>
            <span style={{ fontSize: 12, color: "#6b7280" }}>Total: {cuotasList.length}</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  <th style={{ textAlign: "right", padding: 8, borderBottom: "1px solid #e5e7eb" }}>N°</th>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Fecha</th>
                  <th style={{ textAlign: "right", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Importe</th>
                  <th style={{ textAlign: "right", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Aplicado</th>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Tipo Planilla</th>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Nómina</th>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Situación</th>
                  <th style={{ textAlign: "center", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cuotasList.map((r) => (
                  <tr key={r.PKID}>
                    <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6", textAlign: "right" }}>{r.NumeroCuota}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{normalizeDateInput(r.FechaCuotaEstimada) || ""}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6", textAlign: "right" }}>
                      {r.ImporteCuota ?? ""}
                    </td>
                    <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6", textAlign: "right" }}>
                      {r.ImporteAplicado ?? ""}
                    </td>
                    <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{r.TipoPlanilla}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{r.Nomina}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{r.SituacionRegistro}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6", textAlign: "center" }}>
                      <button
                        onClick={() => onCuotaEdit(r)}
                        style={{ ...btn.base, ...btn.neutral, marginRight: 6 }}
                      >
                        ✏️
                      </button>
                      <button onClick={() => onCuotaDelete(r.PKID)} style={{ ...btn.base, ...btn.danger }}>
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
                {cuotasList.length === 0 && (
                  <tr>
                    <td colSpan="8" style={{ textAlign: "center", padding: 16, color: "#6b7280" }}>
                      No hay cuotas para esta cuenta.
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
