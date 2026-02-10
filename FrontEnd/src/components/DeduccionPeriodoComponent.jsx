// archivo: src/components/DeduccionPeriodoComponent.jsx
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
const input = { width: "100%", padding: 8, borderRadius: 6, border: "1px solid #d1d5db" };
const label = { display: "block", fontSize: 12, color: "#374151", marginBottom: 4 };
const row4 = { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 };
const btn = {
  base: { border: "none", borderRadius: 6, padding: "8px 12px", cursor: "pointer", fontWeight: 600 },
  primary: { background: "#2563eb", color: "#fff" },
  neutral: { background: "#f3f4f6", color: "#111827" },
  danger: { background: "#ef4444", color: "#fff" },
  tab: (active) => ({
    border: "none",
    borderRadius: 6,
    padding: "8px 12px",
    cursor: "pointer",
    fontWeight: 600,
    background: active ? "#2563eb" : "#f3f4f6",
    color: active ? "#fff" : "#111827",
  }),
};

const Tabs = ({ value, onChange, items }) => (
  <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
    {items.map((t, i) => (
      <button key={t} onClick={() => onChange(i)} style={btn.tab(value === i)}>
        {t}
      </button>
    ))}
  </div>
);

function prettyError(err) {
  const d = err?.response?.data;
  if (!d) return err?.message || "Error";
  if (Array.isArray(d.detail))
    return d.detail.map((e) => `• ${(Array.isArray(e.loc) ? e.loc.join(".") : e.loc)}: ${e.msg}`).join("\n");
  return String(d.detail || "Error");
}

function toNumberOrNull(v) {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export default function DeduccionPeriodoComponent() {
  const auth = useAuthAxios();
  const { empresaId, empresaNombre, nominaId, nominaNombre, ano, mes } = useGlobal() || {};

  // -------- Filtro de grilla (solo concepto) --------
  const [fConceptoId, setFConceptoId] = useState("");

  // combos
  const [conceptos, setConceptos] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [horas, setHoras] = useState([]);
  const [situaciones, setSituaciones] = useState([]);
  const [familias, setFamilias] = useState([]);
  const [nminas, setNminas] = useState([]);
  const [cuentas, setCuentas] = useState([]);

  // grilla cabecera
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  // form cabecera
  const empty = {
    PKID: null,
    PKIDConceptoPlanilla: "",
    Ano: "",
    Mes: "",
    IndicadorBaseImponibleCheck: false,
    IndicadorAfpCheck: false,
    IndicadorPeriodoCheck: false,
    IndicadorCuotaCheck: false,
    IndicadorPorcentajeCheck: false,
    IndicadorONPCheck: false,
    IndicadorRentaCheck: 0,
    PKIDMoneda: "",
    PKIDHoraPlanillaEnlace: "",
    ImporteEnlaceTrabajador: "",
    PorcentajeTrabajador: "",
    PorcentajeEmpleador: "",
    MinimoTrabajador: "",
    MaximoTrabajador: "",
    MinimoEmpleador: "",
    MaximoEmpleador: "",
    MontoCreditoDeduccion: "",
    MontoRedondeo: "",
    ImporteEnlaceEmpleador: "",
    AsignaMontoTrabajador: "",
    IndicadorSubsidioCheck: false,
    IndicadorExcluirReintegrosCheck: false,
    PKIDSituacionRegistro: "",
    ImporteHoraEnlace: "",
  };
  const [form, setForm] = useState(empty);
  const isEditing = form.PKID !== null;

  // tabs & selección
  const [activeTab, setActiveTab] = useState(0); // 0 Cabecera, 1 Familias, 2 Cuentas x Nómina
  const [selected, setSelected] = useState(null);

  // hijo1: familias
  const [famRows, setFamRows] = useState([]);
  const famEmpty = { PKID: null, PKIDFamilia: "", FactorPago: "", FactorDivision: "", PKIDSituacionregistro: "", IndicadorFijoCheck: 0 };
  const [famForm, setFamForm] = useState(famEmpty);
  const famEditing = famForm.PKID !== null;

  // hijo2: cuentas por nómina
  const [ctaRows, setCtaRows] = useState([]);
  const ctaEmpty = { PKID: null, PKIDNomina: "", PKIDCuentaContableMN: "", PKIDCuentaContableME: "", PKIDSituacionRegistro: "" };
  const [ctaForm, setCtaForm] = useState(ctaEmpty);
  const ctaEditing = ctaForm.PKID !== null;

  const empresaLabel =
    empresaNombre ? `${empresaNombre} (ID ${empresaId ?? "-"})` : empresaId ? `Empresa ID ${empresaId}` : "(sin empresa)";
  const nominaLabel =
    nominaNombre ? `${nominaNombre} (ID ${nominaId ?? "-"})` : nominaId ? `Nómina ID ${nominaId}` : "(sin nómina)";

  // -------- Combos --------
  const loadCombos = async () => {
    try {
      const [c1, c2, c3, c4, c5, c6, c7] = await Promise.all([
        auth.get(`/deduccion-periodo-combos/concepto/`),
        auth.get(`/deduccion-periodo-combos/moneda/`),
        auth.get(`/deduccion-periodo-combos/hora/`),
        auth.get(`/deduccion-periodo-combos/situacion/`),
        auth.get(`/deduccion-periodo-combos/familia/`),
        auth.get(`/deduccion-periodo-combos/nomina/`),
        auth.get(`/deduccion-periodo-combos/cuenta-contable${empresaId ? `?empresaId=${empresaId}` : ""}`),
      ]);
      setConceptos(c1.data || []);
      setMonedas(c2.data || []);
      setHoras(c3.data || []);
      setSituaciones(c4.data || []);
      setFamilias(c5.data || []);
      setNminas(c6.data || []);
      setCuentas(c7.data || []);
    } catch (err) {
      console.error(err);
      alert("No se pudieron cargar los combos.");
    }
  };

  // -------- Listado cabecera (filtrado por empresa + ano/mes de contexto) --------
  const loadRows = async () => {
    if (!empresaId) {
      setRows([]);
      return;
    }
    try {
      setLoading(true);
      const qs = new URLSearchParams();
      qs.append("empresaId", empresaId);
      if (ano != null) qs.append("ano", ano);
      if (mes != null) qs.append("mes", mes);
      if (fConceptoId) qs.append("conceptoId", fConceptoId);

      const res = await auth.get(`/deduccion-periodo/?${qs.toString()}`); // acepta ano/mes en query
      setRows(res.data || []);
    } catch (err) {
      console.error(err);
      alert("No se pudo listar.");
    } finally {
      setLoading(false);
    }
  };

  // -------- Listados hijos --------
  const loadFamRows = async () => {
    if (!selected?.PKID) {
      setFamRows([]);
      return;
    }
    try {
      const res = await auth.get(`/deduccion-periodo-familia/?pkid_deduccion_periodo=${selected.PKID}`);
      setFamRows(res.data || []);
    } catch (err) {
      console.error(err);
      alert("No se pudo listar Familias.");
    }
  };

  const loadCtaRows = async () => {
    if (!selected?.PKID) {
      setCtaRows([]);
      return;
    }
    try {
      const res = await auth.get(`/deducciones-periodo-nomina-ctacont/?pkid_deduccion_periodo=${selected.PKID}`);
      setCtaRows(res.data || []);
    } catch (err) {
      console.error(err);
      alert("No se pudo listar Cuentas por Nómina.");
    }
  };

  // -------- Effects --------
  useEffect(() => {
    loadCombos();
  }, [empresaId]);

  // siempre que cambie empresa / ano / mes, recarga grilla con esos filtros
  useEffect(() => {
    loadRows();
  }, [empresaId, ano, mes]);

  useEffect(() => {
    if (selected?.PKID) {
      loadFamRows();
      loadCtaRows();
    } else {
      setFamRows([]);
      setCtaRows([]);
    }
  }, [selected?.PKID]);

  // si estoy en "nuevo", sincroniza Año/Mes con el contexto global
  useEffect(() => {
    if (!isEditing) {
      setForm((f) => ({ ...f, Ano: ano ?? "", Mes: mes ?? "" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ano, mes]);

  // -------- Handlers cabecera --------
  const onBuscar = (e) => {
    e?.preventDefault();
    loadRows();
  };
  const onClearFilters = () => {
    setFConceptoId("");
    loadRows();
  };

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      if (name === "IndicadorRentaCheck") {
        setForm((f) => ({ ...f, [name]: checked ? 1 : 0 }));
      } else {
        setForm((f) => ({ ...f, [name]: checked }));
      }
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const onNew = () => {
    setForm({
      ...empty,
      Ano: ano ?? "",
      Mes: mes ?? "",
    });
    // quedarse en pestaña Cabecera
  };

  const onEdit = (r) => {
    setSelected(r);
    setForm({
      PKID: r.PKID,
      PKIDConceptoPlanilla: r.PKIDConceptoPlanilla ?? "",
      Ano: r.Ano ?? "",
      Mes: r.Mes ?? "",
      IndicadorBaseImponibleCheck: !!r.IndicadorBaseImponibleCheck,
      IndicadorAfpCheck: !!r.IndicadorAfpCheck,
      IndicadorPeriodoCheck: !!r.IndicadorPeriodoCheck,
      IndicadorCuotaCheck: !!r.IndicadorCuotaCheck,
      IndicadorPorcentajeCheck: !!r.IndicadorPorcentajeCheck,
      IndicadorONPCheck: !!r.IndicadorONPCheck,
      IndicadorRentaCheck: r.IndicadorRentaCheck ? 1 : 0,
      PKIDMoneda: r.PKIDMoneda ?? "",
      PKIDHoraPlanillaEnlace: r.PKIDHoraPlanillaEnlace ?? "",
      ImporteEnlaceTrabajador: r.ImporteEnlaceTrabajador ?? "",
      PorcentajeTrabajador: r.PorcentajeTrabajador ?? "",
      PorcentajeEmpleador: r.PorcentajeEmpleador ?? "",
      MinimoTrabajador: r.MinimoTrabajador ?? "",
      MaximoTrabajador: r.MaximoTrabajador ?? "",
      MinimoEmpleador: r.MinimoEmpleador ?? "",
      MaximoEmpleador: r.MaximoEmpleador ?? "",
      MontoCreditoDeduccion: r.MontoCreditoDeduccion ?? "",
      MontoRedondeo: r.MontoRedondeo ?? "",
      ImporteEnlaceEmpleador: r.ImporteEnlaceEmpleador ?? "",
      AsignaMontoTrabajador: r.AsignaMontoTrabajador ?? "",
      IndicadorSubsidioCheck: !!r.IndicadorSubsidioCheck,
      IndicadorExcluirReintegrosCheck: !!r.IndicadorExcluirReintegrosCheck,
      PKIDSituacionRegistro: r.PKIDSituacionRegistro ?? "",
      ImporteHoraEnlace: r.ImporteHoraEnlace ?? "",
    });
    setActiveTab(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onDelete = async (id) => {
    if (!window.confirm("¿Eliminar deducción del periodo?")) return;
    try {
      setLoading(true);
      await auth.delete(`/deduccion-periodo/${id}`);
      await loadRows();
      if (selected?.PKID === id) setSelected(null);
      onNew();
    } catch (err) {
      alert(prettyError(err));
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!empresaId) {
      alert("Seleccione empresa en el Selector de Contexto.");
      return;
    }
    if (!form.PKIDConceptoPlanilla || !form.Ano || !form.Mes || !form.PKIDSituacionRegistro) {
      alert("Complete Concepto, Año, Mes y Situación.");
      return;
    }
    const payloadCreate = {
      PKIDEmpresa: Number(empresaId),
      PKIDConceptoPlanilla: Number(form.PKIDConceptoPlanilla),
      Ano: Number(form.Ano),
      Mes: Number(form.Mes),
      IndicadorBaseImponibleCheck: !!form.IndicadorBaseImponibleCheck,
      IndicadorAfpCheck: !!form.IndicadorAfpCheck,
      IndicadorPeriodoCheck: !!form.IndicadorPeriodoCheck,
      IndicadorCuotaCheck: !!form.IndicadorCuotaCheck,
      IndicadorPorcentajeCheck: !!form.IndicadorPorcentajeCheck,
      IndicadorONPCheck: !!form.IndicadorONPCheck,
      IndicadorRentaCheck: form.IndicadorRentaCheck ? 1 : 0,
      PKIDMoneda: form.PKIDMoneda ? Number(form.PKIDMoneda) : null,
      PKIDHoraPlanillaEnlace: form.PKIDHoraPlanillaEnlace ? Number(form.PKIDHoraPlanillaEnlace) : null,
      ImporteEnlaceTrabajador: toNumberOrNull(form.ImporteEnlaceTrabajador),
      PorcentajeTrabajador: toNumberOrNull(form.PorcentajeTrabajador),
      PorcentajeEmpleador: toNumberOrNull(form.PorcentajeEmpleador),
      MinimoTrabajador: toNumberOrNull(form.MinimoTrabajador),
      MaximoTrabajador: toNumberOrNull(form.MaximoTrabajador),
      MinimoEmpleador: toNumberOrNull(form.MinimoEmpleador),
      MaximoEmpleador: toNumberOrNull(form.MaximoEmpleador),
      MontoCreditoDeduccion: toNumberOrNull(form.MontoCreditoDeduccion),
      MontoRedondeo: form.MontoRedondeo === "" ? null : Number(form.MontoRedondeo),
      ImporteEnlaceEmpleador: toNumberOrNull(form.ImporteEnlaceEmpleador),
      AsignaMontoTrabajador: toNumberOrNull(form.AsignaMontoTrabajador),
      IndicadorSubsidioCheck: !!form.IndicadorSubsidioCheck,
      IndicadorExcluirReintegrosCheck: !!form.IndicadorExcluirReintegrosCheck,
      PKIDSituacionRegistro: Number(form.PKIDSituacionRegistro),
      ImporteHoraEnlace: toNumberOrNull(form.ImporteHoraEnlace),
    };
    const payloadUpdate = { ...payloadCreate };
    delete payloadUpdate.PKIDEmpresa;

    try {
      setLoading(true);
      if (isEditing) {
        await auth.put(`/deduccion-periodo/${form.PKID}`, payloadUpdate);
        alert("Actualizado.");
      } else {
        await auth.post(`/deduccion-periodo/`, payloadCreate);
        alert("Agregado.");
      }
      await loadRows();
      onNew();
    } catch (err) {
      alert(prettyError(err));
    } finally {
      setLoading(false);
    }
  };

  // -------- Handlers Hijos --------
  // Familias
  const famOnChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setFamForm((f) => ({ ...f, [name]: checked ? 1 : 0 }));
    } else {
      setFamForm((f) => ({ ...f, [name]: value }));
    }
  };
  const famNew = () => setFamForm(famEmpty);
  const famEdit = (r) => {
    setActiveTab(1);
    setFamForm({
      PKID: r.PKID,
      PKIDFamilia: r.PKIDFamilia ?? "",
      FactorPago: r.FactorPago ?? "",
      FactorDivision: r.FactorDivision ?? "",
      PKIDSituacionregistro: r.PKIDSituacionregistro ?? "",
      IndicadorFijoCheck: r.IndicadorFijoCheck ? 1 : 0,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const famDelete = async (id) => {
    if (!window.confirm("¿Eliminar familia?")) return;
    try {
      await auth.delete(`/deduccion-periodo-familia/${id}`);
      await loadFamRows();
      famNew();
    } catch (err) {
      alert(prettyError(err));
    }
  };
  const famSubmit = async (e) => {
    e.preventDefault();
    if (!selected?.PKID) {
      alert("Seleccione primero una Deducción (cabecera).");
      return;
    }
    const payload = {
      PKIDDeduccionPeriodo: selected.PKID,
      PKIDFamilia: Number(famForm.PKIDFamilia),
      FactorPago: toNumberOrNull(famForm.FactorPago),
      FactorDivision: toNumberOrNull(famForm.FactorDivision),
      PKIDSituacionregistro: Number(famForm.PKIDSituacionregistro),
      IndicadorFijoCheck: famForm.IndicadorFijoCheck ? 1 : 0,
    };
    try {
      if (famEditing) {
        const pay = { ...payload };
        delete pay.PKIDDeduccionPeriodo;
        await auth.put(`/deduccion-periodo-familia/${famForm.PKID}`, pay);
      } else {
        await auth.post(`/deduccion-periodo-familia/`, payload);
      }
      await loadFamRows();
      famNew();
      alert("OK");
    } catch (err) {
      alert(prettyError(err));
    }
  };

  // Cuentas x Nómina
  const ctaOnChange = (e) => {
    const { name, value } = e.target;
    setCtaForm((f) => ({ ...f, [name]: value }));
  };
  const ctaNew = () => setCtaForm(ctaEmpty);
  const ctaEdit = (r) => {
    setActiveTab(2);
    setCtaForm({
      PKID: r.PKID,
      PKIDNomina: r.PKIDNomina ?? "",
      PKIDCuentaContableMN: r.PKIDCuentaContableMN ?? "",
      PKIDCuentaContableME: r.PKIDCuentaContableME ?? "",
      PKIDSituacionRegistro: r.PKIDSituacionRegistro ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const ctaDelete = async (id) => {
    if (!window.confirm("¿Eliminar cuenta por nómina?")) return;
    try {
      await auth.delete(`/deducciones-periodo-nomina-ctacont/${id}`);
      await loadCtaRows();
      ctaNew();
    } catch (err) {
      alert(prettyError(err));
    }
  };
  const ctaSubmit = async (e) => {
    e.preventDefault();
    if (!selected?.PKID) {
      alert("Seleccione primero una Deducción (cabecera).");
      return;
    }
    const _nominaId = nominaId || ctaForm.PKIDNomina;
    if (!_nominaId) {
      alert("Falta la Nómina (tomada del contexto).");
      return;
    }
    const payload = {
      PKIDDeduccionPeriodo: selected.PKID,
      PKIDNomina: Number(_nominaId),
      PKIDCuentaContableMN: Number(ctaForm.PKIDCuentaContableMN),
      PKIDCuentaContableME: ctaForm.PKIDCuentaContableME ? Number(ctaForm.PKIDCuentaContableME) : null,
      PKIDSituacionRegistro: Number(ctaForm.PKIDSituacionRegistro),
    };
    try {
      if (ctaEditing) {
        const pay = { ...payload };
        delete pay.PKIDDeduccionPeriodo;
        await auth.put(`/deducciones-periodo-nomina-ctacont/${ctaForm.PKID}`, pay);
      } else {
        await auth.post(`/deducciones-periodo-nomina-ctacont/`, payload);
      }
      await loadCtaRows();
      ctaNew();
      alert("OK");
    } catch (err) {
      alert(prettyError(err));
    }
  };

  // -------- UI --------
  const tituloHijo = selected
    ? `Familias — ${selected.ConceptoPlanilla} (${selected.Ano}-${String(selected.Mes).padStart(2, "0")})`
    : "Familias";

  const tituloHijo2 = selected
    ? `Cuentas por Nómina — ${selected.ConceptoPlanilla} (${selected.Ano}-${String(selected.Mes).padStart(2, "0")})`
    : "Cuentas por Nómina";

  const selectedBg = "#fef3c7";

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ marginBottom: 12 }}>Deducción por Periodo</h2>

      {/* Tabs */}
      <Tabs value={activeTab} onChange={setActiveTab} items={["Deducción", "Familias", "Cuentas por Nómina"]} />

      {/* -------- Cabecera (form) -------- */}
      {activeTab === 0 && (
        <div style={{ ...card, marginBottom: 16 }}>
          <form onSubmit={onSubmit}>
            <div style={row4}>
              <div>
                <label style={label}>Empresa</label>
                <input value={empresaLabel} disabled style={{ ...input, background: "#f9fafb" }} />
              </div>
              <div>
                <label style={label}>Concepto *</label>
                <select name="PKIDConceptoPlanilla" value={form.PKIDConceptoPlanilla} onChange={onChange} style={input}>
                  <option value="">-- Seleccionar --</option>
                  {conceptos.map((c) => (
                    <option key={c.PKID} value={c.PKID}>
                      {c.ConceptoPlanilla}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={label}>Año *</label>
                <input
                  name="Ano"
                  value={form.Ano}
                  onChange={onChange}
                  disabled={!isEditing}
                  style={{ ...input, ...(isEditing ? {} : { background: "#f9fafb" }) }}
                  title={!isEditing ? "Toma el valor del contexto" : ""}
                />
              </div>
              <div>
                <label style={label}>Mes *</label>
                <input
                  name="Mes"
                  value={form.Mes}
                  onChange={onChange}
                  disabled={!isEditing}
                  style={{ ...input, ...(isEditing ? {} : { background: "#f9fafb" }) }}
                  title={!isEditing ? "Toma el valor del contexto" : ""}
                />
              </div>
            </div>

            <div style={{ ...row4, marginTop: 12 }}>
              <div>
                <label style={label}>Moneda</label>
                <select name="PKIDMoneda" value={form.PKIDMoneda} onChange={onChange} style={input}>
                  <option value="">-- Seleccionar --</option>
                  {monedas.map((m) => (
                    <option key={m.PKID} value={m.PKID}>
                      {m.Moneda}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={label}>Hora Planilla enlace</label>
                <select name="PKIDHoraPlanillaEnlace" value={form.PKIDHoraPlanillaEnlace} onChange={onChange} style={input}>
                  <option value="">-- Seleccionar --</option>
                  {horas.map((h) => (
                    <option key={h.PKID} value={h.PKID}>
                      {h.HoraPlanilla}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={label}>Situación *</label>
                <select name="PKIDSituacionRegistro" value={form.PKIDSituacionRegistro} onChange={onChange} style={input}>
                  <option value="">-- Seleccionar --</option>
                  {situaciones.map((s) => (
                    <option key={s.PKID} value={s.PKID}>
                      {s.SituacionRegistro}
                    </option>
                  ))}
                </select>
              </div>
              <div />
            </div>

            {/* Checks */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 12 }}>
              {[
                ["IndicadorBaseImponibleCheck", "Base Imponible"],
                ["IndicadorAfpCheck", "AFP"],
                ["IndicadorPeriodoCheck", "Periodo"],
                ["IndicadorCuotaCheck", "Cuota"],
                ["IndicadorPorcentajeCheck", "Porcentaje"],
                ["IndicadorONPCheck", "ONP"],
                ["IndicadorSubsidioCheck", "Subsidio"],
                ["IndicadorExcluirReintegrosCheck", "Excluir Reintegros"],
              ].map(([name, labelTxt]) => (
                <label key={name} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                  <input type="checkbox" name={name} checked={!!form[name]} onChange={onChange} />
                  <span>{labelTxt}</span>
                </label>
              ))}
              <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                <input type="checkbox" name="IndicadorRentaCheck" checked={!!form.IndicadorRentaCheck} onChange={onChange} />
                <span>Renta</span>
              </label>
            </div>

            {/* Números */}
            <div style={{ ...row4, marginTop: 12 }}>
              {[
                ["ImporteEnlaceTrabajador", "Importe Enlace Trabajador"],
                ["ImporteEnlaceEmpleador", "Importe Enlace Empleador"],
                ["ImporteHoraEnlace", "Importe Hora Enlace"],
                ["AsignaMontoTrabajador", "Asigna Monto Trabajador"],
                ["PorcentajeTrabajador", "% Trabajador"],
                ["PorcentajeEmpleador", "% Empleador"],
                ["MinimoTrabajador", "Mín Trabajador"],
                ["MaximoTrabajador", "Máx Trabajador"],
                ["MinimoEmpleador", "Mín Empleador"],
                ["MaximoEmpleador", "Máx Empleador"],
                ["MontoCreditoDeduccion", "Monto Crédito Deducción"],
                ["MontoRedondeo", "Monto Redondeo (entero)"],
              ].map(([name, labelTxt]) => (
                <div key={name}>
                  <label style={label}>{labelTxt}</label>
                  <input name={name} value={form[name]} onChange={onChange} style={input} />
                </div>
              ))}
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
              <button type="submit" disabled={loading} style={{ ...btn.base, ...btn.primary }}>
                {isEditing ? "Actualizar" : "Agregar"}
              </button>
              <button type="button" disabled={loading} onClick={onNew} style={{ ...btn.base, ...btn.neutral }}>
                Limpiar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* -------- Filtro (solo Concepto) JUSTO encima de la grilla -------- */}
      {activeTab === 0 && (
        <div style={{ ...card, marginBottom: 12 }}>
          <form onSubmit={onBuscar}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
              <div>
                <label style={label}>Filtrar por Concepto</label>
                <select value={fConceptoId} onChange={(e) => setFConceptoId(e.target.value)} style={input}>
                  <option value="">-- Todos --</option>
                  {conceptos.map((c) => (
                    <option key={c.PKID} value={c.PKID}>
                      {c.ConceptoPlanilla}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: "flex", alignItems: "end", gap: 8 }}>
                <button type="submit" style={{ ...btn.base, ...btn.primary }}>
                  Buscar
                </button>
                <button type="button" onClick={onClearFilters} style={{ ...btn.base, ...btn.neutral }}>
                  Limpiar
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* -------- Grilla cabecera -------- */}
      {activeTab === 0 && (
        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <strong>Registros</strong>
            <span style={{ fontSize: 12, color: "#6b7280" }}>
              Empresa: {empresaNombre || empresaId || "(sin empresa)"} — Periodo: {ano ?? "-"} / {mes ?? "-"} — Total:{" "}
              {rows.length}
            </span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Concepto</th>
                  <th style={{ textAlign: "right", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Año</th>
                  <th style={{ textAlign: "right", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Mes</th>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Situación</th>
                  <th style={{ textAlign: "center", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.PKID} style={selected?.PKID === r.PKID ? { background: "#fef3c7" } : undefined}>
                    <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{r.ConceptoPlanilla}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6", textAlign: "right" }}>{r.Ano}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6", textAlign: "right" }}>{r.Mes}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{r.SituacionRegistro}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6", textAlign: "center" }}>
                      <button onClick={() => onEdit(r)} style={{ ...btn.base, ...btn.neutral, marginRight: 6 }}>
                        ✏️
                      </button>
                      <button onClick={() => onDelete(r.PKID)} style={{ ...btn.base, ...btn.danger }}>
                        🗑️
                      </button>
                      <button
                        onClick={() => {
                          setSelected(r);
                          setActiveTab(1);
                        }}
                        style={{ ...btn.base, ...btn.primary, marginLeft: 6 }}
                      >
                        Detalles
                      </button>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", padding: 16, color: "#6b7280" }}>
                      {empresaId ? "Sin resultados." : "Seleccione una empresa."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* -------- Familias (Hijo 1) -------- */}
      {activeTab === 1 && (
        <>
          <h3 style={{ margin: "12px 0" }}>
            {selected
              ? `Familias — ${selected.ConceptoPlanilla} (${selected.Ano}-${String(selected.Mes).padStart(2, "0")})`
              : "Familias"}
          </h3>

          <div style={{ ...card, marginBottom: 12 }}>
            <form onSubmit={famSubmit}>
              <div style={row4}>
                <div>
                  <label style={label}>Familia *</label>
                  <select name="PKIDFamilia" value={famForm.PKIDFamilia} onChange={famOnChange} style={input}>
                    <option value="">-- Seleccionar --</option>
                    {familias.map((f) => (
                      <option key={f.PKID} value={f.PKID}>
                        {f.Familia}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={label}>Factor Pago</label>
                  <input name="FactorPago" value={famForm.FactorPago} onChange={famOnChange} style={input} />
                </div>
                <div>
                  <label style={label}>Factor División</label>
                  <input name="FactorDivision" value={famForm.FactorDivision} onChange={famOnChange} style={input} />
                </div>
                <div>
                  <label style={label}>Situación *</label>
                  <select name="PKIDSituacionregistro" value={famForm.PKIDSituacionregistro} onChange={famOnChange} style={input}>
                    <option value="">-- Seleccionar --</option>
                    {situaciones.map((s) => (
                      <option key={s.PKID} value={s.PKID}>
                        {s.SituacionRegistro}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginTop: 8 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="checkbox" name="IndicadorFijoCheck" checked={!!famForm.IndicadorFijoCheck} onChange={famOnChange} />
                  <span>Indicador Fijo</span>
                </label>
              </div>

              <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                <button type="submit" style={{ ...btn.base, ...btn.primary }}>
                  {famEditing ? "Actualizar" : "Agregar"}
                </button>
                <button type="button" onClick={famNew} style={{ ...btn.base, ...btn.neutral }}>
                  Limpiar
                </button>
              </div>
            </form>
          </div>

          <div style={card}>
            <strong>Detalle — Familias</strong>
            <div style={{ overflowX: "auto", marginTop: 8 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f9fafb" }}>
                    <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Familia</th>
                    <th style={{ textAlign: "right", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Factor Pago</th>
                    <th style={{ textAlign: "right", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Factor División</th>
                    <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Situación</th>
                    <th style={{ textAlign: "center", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Fijo</th>
                    <th style={{ textAlign: "center", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {famRows.map((r) => (
                    <tr key={r.PKID}>
                      <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{r.Familia}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6", textAlign: "right" }}>{r.FactorPago ?? ""}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6", textAlign: "right" }}>{r.FactorDivision ?? ""}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{r.SituacionRegistro}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6", textAlign: "center" }}>{r.IndicadorFijoCheck ? "✔" : ""}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6", textAlign: "center" }}>
                        <button onClick={() => famEdit(r)} style={{ ...btn.base, ...btn.neutral, marginRight: 6 }}>
                          ✏️
                        </button>
                        <button onClick={() => ctaDelete(r.PKID)} style={{ display: "none" }} />
                        <button onClick={() => famDelete(r.PKID)} style={{ ...btn.base, ...btn.danger }}>
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                  {famRows.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: "center", padding: 16, color: "#6b7280" }}>
                        Sin detalles.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* -------- Cuentas por Nómina (Hijo 2) -------- */}
      {activeTab === 2 && (
        <>
          <h3 style={{ margin: "12px 0" }}>
            {selected
              ? `Cuentas por Nómina — ${selected.ConceptoPlanilla} (${selected.Ano}-${String(selected.Mes).padStart(
                  2,
                  "0"
                )})`
              : "Cuentas por Nómina"}
          </h3>

          <div style={{ ...card, marginBottom: 12 }}>
            <form onSubmit={ctaSubmit}>
              <div style={row4}>
                <div>
                  <label style={label}>Nómina (contexto)</label>
                  <input value={nominaLabel} disabled style={{ ...input, background: "#f9fafb" }} />
                </div>
                <div>
                  <label style={label}>Cuenta MN *</label>
                  <select name="PKIDCuentaContableMN" value={ctaForm.PKIDCuentaContableMN} onChange={ctaOnChange} style={input}>
                    <option value="">-- Seleccionar --</option>
                    {cuentas.map((c) => (
                      <option key={c.PKID} value={c.PKID}>
                        {c.IDCuentaContable} — {c.CuentaContable}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={label}>Cuenta ME</label>
                  <select name="PKIDCuentaContableME" value={ctaForm.PKIDCuentaContableME} onChange={ctaOnChange} style={input}>
                    <option value="">-- Seleccionar --</option>
                    {cuentas.map((c) => (
                      <option key={c.PKID} value={c.PKID}>
                        {c.IDCuentaContable} — {c.CuentaContable}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={label}>Situación *</label>
                  <select name="PKIDSituacionRegistro" value={ctaForm.PKIDSituacionRegistro} onChange={ctaOnChange} style={input}>
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
                <button type="submit" style={{ ...btn.base, ...btn.primary }}>
                  {ctaEditing ? "Actualizar" : "Agregar"}
                </button>
                <button type="button" onClick={ctaNew} style={{ ...btn.base, ...btn.neutral }}>
                  Limpiar
                </button>
              </div>
            </form>
          </div>

          <div style={card}>
            <strong>Detalle — Cuentas por Nómina</strong>
            <div style={{ overflowX: "auto", marginTop: 8 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f9fafb" }}>
                    <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Nómina</th>
                    <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Cuenta MN</th>
                    <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Cuenta ME</th>
                    <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Situación</th>
                    <th style={{ textAlign: "center", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {ctaRows.map((r) => (
                    <tr key={r.PKID}>
                      <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{r.Nomina}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{r.CuentaMN}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{r.CuentaME ?? ""}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{r.SituacionRegistro}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6", textAlign: "center" }}>
                        <button onClick={() => ctaEdit(r)} style={{ ...btn.base, ...btn.neutral, marginRight: 6 }}>
                          ✏️
                        </button>
                        <button onClick={() => ctaDelete(r.PKID)} style={{ ...btn.base, ...btn.danger }}>
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                  {ctaRows.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: "center", padding: 16, color: "#6b7280" }}>
                        Sin detalles.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
