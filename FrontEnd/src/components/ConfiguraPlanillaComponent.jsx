// src/components/ConfiguraPlanillaComponent.jsx
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

const card = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: 16,
  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
};
const btn = {
  base: { border: "none", borderRadius: 6, padding: "8px 12px", cursor: "pointer", fontWeight: 600 },
  primary: { background: "#2563eb", color: "#fff" },
  neutral: { background: "#f3f4f6", color: "#111827" },
  danger: { background: "#ef4444", color: "#fff" },
  subtle: { background: "#e5e7eb", color: "#111827" },
};

// pretty print de errores FastAPI
function prettyError(err) {
  const d = err?.response?.data;
  if (!d) return err?.message || "Error desconocido";
  if (Array.isArray(d.detail)) {
    return d.detail
      .map((e) => {
        const loc = Array.isArray(e.loc) ? e.loc.join(".") : e.loc;
        return `• ${loc}: ${e.msg}`;
      })
      .join("\n");
  }
  if (typeof d.detail === "object") return JSON.stringify(d.detail);
  return String(d.detail);
}

/* ======= Catálogos / etiquetas ======= */
const bitFields = [
  ["PlanillaIntegradaCheck","Planilla integrada"],
  ["IndicadorRemuneracionDolares","Remuneración en dólares"],
  ["IndicadorRedondeo","Redondeo"],
  ["IndicadorOtraCia","Otra compañía"],
  ["IndicadorDevolucionRenta","Devolución de renta"],
  ["IndicadorAfpEmpleador","AFP Empleador"],
  ["AplicaIGVDescuentoEPS","Aplicar IGV Descuento EPS"],
  ["IndicadorPymeCheck","Pyme"],
];
const bitFieldSet = new Set(bitFields.map(([n]) => n));

const numberFields = [
  "ConceptoVacaciones","ConceptoQuincena","ConceptoGratificacion","ConceptoOtraGratificacion1",
  "PorcentajeQuincena","PorcenjateGratificacion","ConceptoGratificacionTrunca","ConceptoOtraGratificacion2",
  "ConceptoCTS","ConceptoAsignacionFamiliar","ConceptoBasico","HoraAdelantoVacaciones",
  "ConceptoVacacionAdelantada","ConceptoAdelantoQuincena","ConceptoAdelantoGratificacion","ConceptoAdelantoVacaciones",
  "ConceptoVacacionesTrunca","ConceptoUtilidades","ConceptoAdelantoUtilidades","ModoControlVacacional",
  "ConceptoIndeminizable","IDOtraCia","ConceptoPromedioRemuneracionVariable","ConceptoCtsRIA",
  "HoraBasico","HoraSubsidio","CuentaContableNetoLBS","DiferenciaCambio",
  "CuentaContableAjusteDebe","CuentaContableAjusteHaber","CuentaContableNetoPlanillas","CentroCostoAjuste",
  "ConceptoVacacionesPromedio","ConceptoBonificacionVacaciones","TItmod","TTrnro","TItnrel","BonificacionGraciosa",
  "ConceptoDevolucionRenta","ConceptoPromedioHorasExtras","ConceptoBasicoIntegral","ImporteRemuneracionMinivaVital",
  "EdadJubilacion","TiempoServicioVidaLey","DiasMinimoSubsidioCtsVac","DiasMaximoSubsidioCtsVac",
  "LongitudCuentaContable","LongitudCodigoCorrelativo","ConceptoOtrosIngresos","ConceptoBonificacionNocturna",
  "JornalesPorMesDiciembre","JornalesPorMesJulio","NumeroJornales","ConceptoPrimaTextil",
  "ConceptoSobregiroOtorgado","ConceptoSobregiroPendiente","ConceptoEssaludVida","ConceptoEssaludVidaEmpleador",
  "ConceptoCtsIntegral","ConceptoGratificacionIntegral","ConceptoVacacionesIntegral","DiasMinimoUtilidades",
  "PorcentajeJornadaNocturna","ConceptoConsumoComedor","TopeRemuneracionUtilidades","ConceptoComision",
  "TasaIgv","ConceptoPromedioVacacionesAdelantadas","PKIDSituacionRegistro","ConceptoVacacionesAdelantadas",
  "ConceptoBonificacionNoche","ConceptoPromedioCompraVacaciones","ConceptoIngresoEPS","ConceptoDescuentoEPS",
  "ConceptoAporteEPS","PorcentajeGratificacionPyme","PorcentajeCtsPyme","PorcentajeVacacionPyme",
  "ConceptoVariableLiquidacion",
];
const numberFieldSet = new Set(numberFields);

const labelPairs = [
  ["OrigenContablePlanilla","Origen contable planilla"],
  ["OrigenContablePrestamos","Origen contable préstamos"],
  ["PeriodoInicioContable","Periodo inicio contable"],
  ["CuentaBancariaSoles","Cuenta bancaria soles"],
  ["CuentaBancariaDolares","Cuenta bancaria dólares"],
  ["PeriodoInicioControlVacacional","Periodo inicio control vacacional"],
  ["PeriodoInicioPlanilla","Periodo inicio planilla"],
  ["OrigenContableLBS","Origen contable LBS"],
  ["OrigenContableProvisionVacaciones","Origen prov. vacaciones"],
  ["OrigenContableProvisionGratificaciones","Origen prov. gratificaciones"],
  ["OrigenContableProvisionCTS","Origen prov. CTS"],
  ["PrefijoCodigo","Prefijo código"],
  ["OrigenContableUtilidades","Origen contable utilidades"],
  ["PeriodoInicioPlame","Periodo inicio PLAME"],
];
const labelMap = Object.fromEntries([...labelPairs, ...bitFields]);

/* ======= Estado inicial (para Limpiar) ======= */
const makeEmptyForm = (empresaId) => ({
  PKID: null,
  PKIDEmpresa: empresaId ? String(empresaId) : "",
  PKIDNomina: "",
  PlanillaIntegradaCheck: false,

  ConceptoVacaciones: "",
  ConceptoQuincena: "",
  ConceptoGratificacion: "",
  ConceptoOtraGratificacion1: "",
  PorcentajeQuincena: "",
  PorcenjateGratificacion: "",
  ConceptoGratificacionTrunca: "",
  ConceptoOtraGratificacion2: "",
  IndicadorRemuneracionDolares: false,
  ConceptoCTS: "",
  OrigenContablePlanilla: "",
  OrigenContablePrestamos: "",
  PeriodoInicioContable: "",
  ConceptoAsignacionFamiliar: "",
  ConceptoBasico: "",
  HoraAdelantoVacaciones: "",
  CuentaBancariaSoles: "",
  CuentaBancariaDolares: "",
  IndicadorRedondeo: false,
  ConceptoVacacionAdelantada: "",
  ConceptoAdelantoQuincena: "",
  ConceptoAdelantoGratificacion: "",
  ConceptoAdelantoVacaciones: "",
  ConceptoVacacionesTrunca: "",
  ConceptoUtilidades: "",
  ConceptoAdelantoUtilidades: "",
  PeriodoInicioControlVacacional: "",
  ModoControlVacacional: "",
  ConceptoIndeminizable: "",
  IndicadorOtraCia: false,
  IDOtraCia: "",
  ConceptoPromedioRemuneracionVariable: "",
  PeriodoInicioPlanilla: "",
  ConceptoCtsRIA: "",
  HoraBasico: "",
  HoraSubsidio: "",
  CuentaContableNetoLBS: "",
  OrigenContableLBS: "",
  DiferenciaCambio: "",
  CuentaContableAjusteDebe: "",
  CuentaContableAjusteHaber: "",
  CuentaContableNetoPlanillas: "",
  CentroCostoAjuste: "",
  ConceptoVacacionesPromedio: "",
  ConceptoBonificacionVacaciones: "",
  TItmod: "",
  TTrnro: "",
  TItnrel: "",
  BonificacionGraciosa: "",
  PeriodoInicioPlame: "",
  ConceptoDevolucionRenta: "",
  IndicadorDevolucionRenta: false,
  ConceptoPromedioHorasExtras: "",
  ConceptoBasicoIntegral: "",
  ImporteRemuneracionMinivaVital: "",
  EdadJubilacion: "",
  TiempoServicioVidaLey: "",
  DiasMinimoSubsidioCtsVac: "",
  DiasMaximoSubsidioCtsVac: "",
  LongitudCuentaContable: "",
  OrigenContableProvisionVacaciones: "",
  OrigenContableProvisionGratificaciones: "",
  OrigenContableProvisionCTS: "",
  LongitudCodigoCorrelativo: "",
  ConceptoOtrosIngresos: "",
  ConceptoBonificacionNocturna: "",
  JornalesPorMesDiciembre: "",
  JornalesPorMesJulio: "",
  NumeroJornales: "",
  ConceptoPrimaTextil: "",
  ConceptoSobregiroOtorgado: "",
  ConceptoSobregiroPendiente: "",
  ConceptoEssaludVida: "",
  ConceptoEssaludVidaEmpleador: "",
  ConceptoCtsIntegral: "",
  ConceptoGratificacionIntegral: "",
  ConceptoVacacionesIntegral: "",
  DiasMinimoUtilidades: "",
  IndicadorAfpEmpleador: false,
  PorcentajeJornadaNocturna: "",
  PrefijoCodigo: "",
  OrigenContableUtilidades: "",
  ConceptoConsumoComedor: "",
  TopeRemuneracionUtilidades: "",
  ConceptoComision: "",
  AplicaIGVDescuentoEPS: false,
  TasaIgv: "",
  ConceptoPromedioVacacionesAdelantadas: "",
  PKIDSituacionRegistro: "",
  ConceptoVacacionesAdelantadas: "",
  ConceptoBonificacionNoche: "",
  ConceptoPromedioCompraVacaciones: "",
  ConceptoIngresoEPS: "",
  ConceptoDescuentoEPS: "",
  ConceptoAporteEPS: "",
  IndicadorPymeCheck: false,
  PorcentajeGratificacionPyme: "",
  PorcentajeCtsPyme: "",
  PorcentajeVacacionPyme: "",
  ConceptoVariableLiquidacion: "",
});

export default function ConfiguraPlanillaComponent() {
  const auth = useAuthAxios();
  const { empresaId, empresaNombre } = useGlobal() || {};

  const [lista, setLista] = useState([]);
  const [nominas, setNominas] = useState([]);
  const [situaciones, setSituaciones] = useState([]);
  const [form, setForm] = useState(() => makeEmptyForm(empresaId));
  const [activeTab, setActiveTab] = useState("basicos");

  const isEditing = form.PKID !== null;
  const [loading, setLoading] = useState(false);

  // Combos / Listado
  const loadCombos = async () => {
    try {
      setLoading(true);
      const [nom, sit] = await Promise.all([
        auth.get("/configura-planilla-combos/nomina/"),
        auth.get("/configura-planilla-combos/situacion/"),
      ]);
      setNominas(nom.data || []);
      setSituaciones(sit.data || []);
    } catch (err) {
      console.error("Error combos:", err?.response || err);
      alert("No se pudieron cargar los combos.");
    } finally {
      setLoading(false);
    }
  };
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await auth.get("/configura-planilla/");
      setLista(res.data || []);
    } catch (err) {
      console.error("Error listando:", err?.response || err);
      alert("No se pudo listar la configuración.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadCombos();
    fetchData();
  }, []);

  // Forzar empresa desde contexto
  useEffect(() => {
    setForm((f) => ({ ...f, PKIDEmpresa: empresaId ? String(empresaId) : "" }));
  }, [empresaId]);

  // Handlers base
  const handleNew = () => {
    setForm(makeEmptyForm(empresaId));
    setActiveTab("basicos");
  };
  const handleEdit = (row) => {
    setForm({
      ...row,
      PKID: row.PKID,
      PKIDEmpresa: empresaId ? String(empresaId) : "",
    });
    setActiveTab("basicos");
  };
  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar configuración?")) return;
    try {
      setLoading(true);
      await auth.delete(`/configura-planilla/${id}`);
      await fetchData();
    } catch (err) {
      console.error("Error eliminando:", err?.response || err);
      alert("No se pudo eliminar.");
    } finally {
      setLoading(false);
    }
  };
  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  // Casting de payload
  const buildPayload = (obj) => {
    const out = {};
    for (const k of Object.keys(obj)) {
      if (k === "PKIDEmpresa") {
        out[k] = empresaId != null ? Number(empresaId) : null;
        continue;
      }
      const v = obj[k];
      if (v === "" || v === null || typeof v === "undefined") {
        out[k] = null;
      } else if (bitFieldSet.has(k)) {
        out[k] = Boolean(v);
      } else if (numberFieldSet.has(k)) {
        if (typeof v === "string" && /^-?\d+(\.\d+)?$/.test(v.trim())) out[k] = Number(v);
        else out[k] = v;
      } else {
        out[k] = v;
      }
    }
    return out;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!empresaId) {
      alert("Seleccione una empresa en el Selector de Contexto.");
      return;
    }
    if (!form.PKIDNomina) {
      alert("Completa Nómina.");
      return;
    }
    const payload = buildPayload({ ...form });
    try {
      setLoading(true);
      if (isEditing) {
        await auth.put(`/configura-planilla/${form.PKID}`, { ...payload, PKID: form.PKID });
        alert("Configuración actualizada.");
      } else {
        await auth.post(`/configura-planilla/`, payload);
        alert("Configuración creada.");
      }
      await fetchData();
      handleNew();
    } catch (err) {
      console.error("Error guardando:", err?.response || err);
      alert(`No se pudo guardar.\n\nDetalle:\n${prettyError(err)}`);
    } finally {
      setLoading(false);
    }
  };

  // Estilos UI
  const row4 = { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 };
  const row3 = { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 };
  const input = { width: "100%", padding: 8, borderRadius: 6, border: "1px solid #d1d5db" };
  const label = { display: "block", fontSize: 12, color: "#374151", marginBottom: 4 };

  // Helper de label
  const labelFor = (name) => labelMap[name] || name;

  // Renders
  const renderText = (name) => (
    <div key={name}>
      <label style={label}>{labelFor(name)}</label>
      <input name={name} value={form[name] ?? ""} onChange={handleChange} style={input} />
    </div>
  );
  const renderNumber = (name) => (
    <div key={name}>
      <label style={label}>{labelFor(name)}</label>
      <input type="text" name={name} value={form[name] ?? ""} onChange={handleChange} style={input} />
    </div>
  );
  const renderCheck = (name) => (
    <label key={name} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#374151" }}>
      <input type="checkbox" name={name} checked={!!form[name]} onChange={handleChange} />
      {labelFor(name)}
    </label>
  );

  // Tabs
  const tabs = [
    { id: "basicos", title: "Básicos" },
    { id: "conceptosA", title: "Conceptos A" },
    { id: "conceptosB", title: "Conceptos B" },
    { id: "parametros", title: "Parámetros" },
    { id: "cuentas", title: "Cuentas / Orígenes" },
    { id: "checks", title: "Checks & EPS" },
  ];
  const tabBtn = (t) => ({
    ...btn.base,
    ...(activeTab === t ? btn.primary : btn.subtle),
    padding: "6px 10px",
  });

  // Campos por pestaña
  const conceptosA = [
    "ConceptoVacaciones","ConceptoQuincena","ConceptoGratificacion","ConceptoOtraGratificacion1",
    "ConceptoGratificacionTrunca","ConceptoOtraGratificacion2","ConceptoVacacionAdelantada",
    "ConceptoAdelantoQuincena","ConceptoAdelantoGratificacion","ConceptoAdelantoVacaciones",
    "ConceptoVacacionesTrunca","ConceptoAsignacionFamiliar","ConceptoBasico",
  ];
  const conceptosB = [
    "ConceptoUtilidades","ConceptoAdelantoUtilidades","ConceptoPromedioRemuneracionVariable",
    "ConceptoCtsRIA","ConceptoPromedioHorasExtras","ConceptoBasicoIntegral",
    "ConceptoVacacionesPromedio","ConceptoBonificacionVacaciones","BonificacionGraciosa",
    "ConceptoPrimaTextil","ConceptoEssaludVida","ConceptoEssaludVidaEmpleador",
    "ConceptoCtsIntegral","ConceptoGratificacionIntegral","ConceptoVacacionesIntegral",
    "ConceptoBonificacionNoche","ConceptoPromedioCompraVacaciones",
  ];
  const parametros = [
    "PorcentajeQuincena","PorcenjateGratificacion","HoraAdelantoVacaciones",
    "HoraBasico","HoraSubsidio","EdadJubilacion","TiempoServicioVidaLey",
    "JornalesPorMesDiciembre","JornalesPorMesJulio","NumeroJornales",
    "DiferenciaCambio","DiasMinimoSubsidioCtsVac","DiasMaximoSubsidioCtsVac",
    "LongitudCuentaContable","LongitudCodigoCorrelativo","TopeRemuneracionUtilidades",
    "PorcentajeJornadaNocturna","TasaIgv",
  ];
  const cuentas = [
    "OrigenContablePlanilla","OrigenContablePrestamos","PeriodoInicioContable",
    "CuentaBancariaSoles","CuentaBancariaDolares",
    "OrigenContableLBS","PeriodoInicioPlanilla","PeriodoInicioControlVacacional","PeriodoInicioPlame",
    "OrigenContableProvisionVacaciones","OrigenContableProvisionGratificaciones","OrigenContableProvisionCTS",
    "PrefijoCodigo",
    // cuentas contables numéricas
    "CuentaContableNetoLBS","CuentaContableAjusteDebe","CuentaContableAjusteHaber","CuentaContableNetoPlanillas",
    "CentroCostoAjuste",
  ];
  const checksExtra = [
    // ya están en bitFields; los rendereamos aquí
    "PlanillaIntegradaCheck","IndicadorRemuneracionDolares","IndicadorRedondeo","IndicadorOtraCia",
    "IndicadorDevolucionRenta","IndicadorAfpEmpleador","AplicaIGVDescuentoEPS","IndicadorPymeCheck",
  ];
  const epsFields = ["ConceptoIngresoEPS","ConceptoDescuentoEPS","ConceptoAporteEPS"];

  // Filtrar listado por empresa
  const listaFiltrada = useMemo(
    () => (empresaId ? (lista || []).filter((r) => Number(r.PKIDEmpresa) === Number(empresaId)) : lista),
    [lista, empresaId]
  );

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ marginBottom: 16 }}>Configuración de Planilla</h2>

      {/* Tabs header */}
      <div style={{ ...card, padding: 8, marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={tabBtn(t.id)}>
              {t.title}
            </button>
          ))}
        </div>
      </div>

      {/* Form por pestañas */}
      <div style={{ ...card, marginBottom: 16 }}>
        <form onSubmit={handleSave}>
          {activeTab === "basicos" && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                <div>
                  <label style={label}>Empresa (contexto) *</label>
                  <input
                    value={
                      empresaNombre
                        ? `${empresaNombre} (ID ${empresaId ?? "-"})`
                        : empresaId
                        ? `Empresa ID ${empresaId}`
                        : "(sin empresa seleccionada)"
                    }
                    disabled
                    style={{ ...input, background: "#f9fafb" }}
                  />
                </div>
                <div>
                  <label style={label}>Nómina *</label>
                  <select name="PKIDNomina" value={form.PKIDNomina} onChange={handleChange} style={input}>
                    <option value="">-- Seleccionar --</option>
                    {nominas.map((n) => (
                      <option key={n.PKID} value={n.PKID}>
                        {n.Nomina}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={label}>Situación</label>
                  <select
                    name="PKIDSituacionRegistro"
                    value={form.PKIDSituacionRegistro}
                    onChange={handleChange}
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
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <label style={{ fontSize: 13 }}>
                    <input
                      type="checkbox"
                      name="PlanillaIntegradaCheck"
                      checked={!!form.PlanillaIntegradaCheck}
                      onChange={handleChange}
                    />{" "}
                    {labelFor("PlanillaIntegradaCheck")}
                  </label>
                </div>
              </div>
            </>
          )}

          {activeTab === "conceptosA" && (
            <div style={row4}>
              {conceptosA.map((f) => (numberFieldSet.has(f) ? renderNumber(f) : renderText(f)))}
            </div>
          )}

          {activeTab === "conceptosB" && (
            <div style={row4}>
              {conceptosB.map((f) => (numberFieldSet.has(f) ? renderNumber(f) : renderText(f)))}
            </div>
          )}

          {activeTab === "parametros" && (
            <div style={row4}>
              {parametros.map((f) => (numberFieldSet.has(f) ? renderNumber(f) : renderText(f)))}
            </div>
          )}

          {activeTab === "cuentas" && (
            <div style={row4}>
              {cuentas.map((f) =>
                bitFieldSet.has(f) ? renderCheck(f) : numberFieldSet.has(f) ? renderNumber(f) : renderText(f)
              )}
            </div>
          )}

          {activeTab === "checks" && (
            <>
              <div style={{ ...row3, marginBottom: 12 }}>
                {checksExtra.map((f) => renderCheck(f))}
              </div>
              <div style={row4}>
                {epsFields.map((f) => renderNumber(f))}
              </div>
            </>
          )}

          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <button type="submit" disabled={loading} style={{ ...btn.base, ...(btn.primary) }}>
              {isEditing ? "Actualizar" : "Agregar"}
            </button>
            <button type="button" disabled={loading} onClick={handleNew} style={{ ...btn.base, ...(btn.neutral) }}>
              Limpiar
            </button>
          </div>
        </form>
      </div>

      {/* Grilla (filtrada por empresa del contexto) */}
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <strong>Listado</strong>
          <span style={{ fontSize: 12, color: "#6b7280" }}>Total: {listaFiltrada.length}</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f9fafb" }}>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Empresa</th>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Nómina</th>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Situación</th>
                <th style={{ textAlign: "center", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {listaFiltrada.map((r) => (
                <tr key={r.PKID}>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{r.Empresa}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{r.Nomina}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{r.SituacionRegistro}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6", textAlign: "center" }}>
                    <button onClick={() => handleEdit(r)} title="Editar" style={{ ...btn.base, ...(btn.neutral), marginRight: 6 }}>
                      ✏️
                    </button>
                    <button onClick={() => handleDelete(r.PKID)} title="Eliminar" style={{ ...btn.base, ...(btn.danger) }}>
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
              {listaFiltrada.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ textAlign: "center", padding: 16, color: "#6b7280" }}>
                    No hay registros para la empresa seleccionada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
