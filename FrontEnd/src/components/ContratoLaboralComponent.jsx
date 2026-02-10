// src/components/ContratoLaboralComponent.jsx
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

// ---------- helpers ----------
const numberFieldsContrato = new Set([
  "IDContratoLaboral",
  "PKIDTrabajador",
  "PKIDCargoEmpresa",
  "PKIDModeloContratoLaboral",
  "PKIDSituacionRegistro",
]);
const numberFieldsAdenda = new Set([
  "PKIDContratoLaboral",
  "IDAdendaContratoLaboral",
  "PKIDSituacionRegistro",
]);

function normalizePayload(obj, numberFields) {
  const out = {};
  Object.keys(obj).forEach((k) => {
    const v = obj[k];
    if (v === "" || v === null || typeof v === "undefined") out[k] = null;
    else if (numberFields.has(k)) {
      if (typeof v === "string" && /^-?\d+(\.\d+)?$/.test(v.trim())) out[k] = Number(v);
      else out[k] = v;
    } else out[k] = v;
  });
  return out;
}

export default function ContratoLaboralComponent() {
  const auth = useAuthAxios();
  const { empresaId, empresaNombre } = useGlobal() || {};

  const [activeTab, setActiveTab] = useState("contrato");

  // listas
  const [contratos, setContratos] = useState([]);
  const [adendas, setAdendas] = useState([]);

  // combos
  const [trabajadores, setTrabajadores] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [situaciones, setSituaciones] = useState([]);

  // forms
  const emptyContrato = {
    PKID: null,
    IDContratoLaboral: "",
    PKIDTrabajador: "",
    FechaRegistroContrato: "",
    FechaInicioContrato: "",
    FechaFinContrato: "",
    PKIDCargoEmpresa: "",
    GlosaContrato: "",
    PKIDModeloContratoLaboral: "",
    PKIDSituacionRegistro: "",
  };
  const [formContrato, setFormContrato] = useState(emptyContrato);

  const emptyAdenda = {
    PKID: null,
    PKIDContratoLaboral: null,
    IDAdendaContratoLaboral: "",
    GlosaAdenda: "",
    FechaInicioAdenda: "",
    FechaFinAdenda: "",
    InicioSuspensionPerfecta: "",
    FinSuspensionPerfecta: "",
    PKIDSituacionRegistro: "",
  };
  const [formAdenda, setFormAdenda] = useState(emptyAdenda);

  const isEditingContrato = formContrato.PKID !== null;
  const isEditingAdenda = formAdenda.PKID !== null;

  // nombre del trabajador seleccionado (para mostrar al lado de Adendas)
  const [selectedTrabajadorName, setSelectedTrabajadorName] = useState("");

  const [loading, setLoading] = useState(false);
  const row3 = { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 };
  const row4 = { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 };
  const input = { width: "100%", padding: 8, borderRadius: 6, border: "1px solid #d1d5db" };
  const label = { display: "block", fontSize: 12, color: "#374151", marginBottom: 4 };

  // --------- cargar combos ----------
  const loadCombos = async () => {
    if (!empresaId) {
      setTrabajadores([]);
      setCargos([]);
      setModelos([]);
      setSituaciones([]);
      return;
    }
    try {
      setLoading(true);
      const [trab, cargo, modelo, sit] = await Promise.all([
        auth.get(`/contrato-laboral-combos/trabajador/?empresaId=${empresaId}`),
        auth.get(`/contrato-laboral-combos/cargo-empresa/?empresaId=${empresaId}`),
        auth.get(`/contrato-laboral-combos/modelo-contrato/`),
        auth.get(`/contrato-laboral-combos/situacion/`),
      ]);
      setTrabajadores(trab.data || []);
      setCargos(cargo.data || []);
      setModelos(modelo.data || []);
      setSituaciones(sit.data || []);
    } catch (err) {
      console.error("Error combos:", err?.response || err);
      alert("No se pudieron cargar los combos.");
    } finally {
      setLoading(false);
    }
  };

  // --------- listar contratos ----------
  const loadContratos = async () => {
    if (!empresaId) {
      setContratos([]);
      return;
    }
    try {
      setLoading(true);
      const res = await auth.get(`/contrato-laboral/?empresaId=${empresaId}`);
      setContratos(res.data || []);
    } catch (err) {
      console.error("Error lista contratos:", err?.response || err);
      alert("No se pudo listar contratos.");
    } finally {
      setLoading(false);
    }
  };

  // --------- listar adendas ----------
  const loadAdendas = async (contratoPKID) => {
    if (!contratoPKID) {
      setAdendas([]);
      return;
    }
    try {
      setLoading(true);
      const res = await auth.get(`/adenda-contrato-laboral/?contratoId=${contratoPKID}`);
      setAdendas(res.data || []);
    } catch (err) {
      console.error("Error lista adendas:", err?.response || err);
      alert("No se pudo listar adendas.");
    } finally {
      setLoading(false);
    }
  };

  // efectos: cuando cambia empresa, reset
  useEffect(() => {
    loadCombos();
    loadContratos();
    setFormContrato(emptyContrato);
    setFormAdenda(emptyAdenda);
    setAdendas([]);
    setSelectedTrabajadorName("");
    setActiveTab("contrato");
  }, [empresaId]);

  // efecto: al entrar a "adendas", carga adendas del contrato activo (lazy)
  useEffect(() => {
    if (activeTab === "adendas") {
      const contratoId = formContrato.PKID || formAdenda.PKIDContratoLaboral;
      if (contratoId) loadAdendas(contratoId);
    }
  }, [activeTab, formContrato.PKID, formAdenda.PKIDContratoLaboral]);

  // efecto: si cambia el trabajador en el form, mantener el nombre mostrado
  useEffect(() => {
    if (formContrato.PKIDTrabajador) {
      const found = trabajadores.find((t) => Number(t.PKID) === Number(formContrato.PKIDTrabajador));
      if (found) setSelectedTrabajadorName(found.NombreCompleto);
    }
  }, [formContrato.PKIDTrabajador, trabajadores]);

  // ---------- handlers contrato ----------
  const handleContratoChange = (e) => {
    const { name, value } = e.target;
    setFormContrato((f) => ({ ...f, [name]: value }));
  };

  const handleContratoNew = () => {
    setFormContrato(emptyContrato);
    setAdendas([]);
    setFormAdenda(emptyAdenda);
    setSelectedTrabajadorName("");
    setActiveTab("contrato");
  };

  const handleContratoEdit = (row) => {
    setFormContrato({
      PKID: row.PKID,
      IDContratoLaboral: row.IDContratoLaboral ?? "",
      PKIDTrabajador: row.PKIDTrabajador ?? "",
      FechaRegistroContrato: row.FechaRegistroContrato ?? "",
      FechaInicioContrato: row.FechaInicioContrato ?? "",
      FechaFinContrato: row.FechaFinContrato ?? "",
      PKIDCargoEmpresa: row.PKIDCargoEmpresa ?? "",
      GlosaContrato: row.GlosaContrato ?? "",
      PKIDModeloContratoLaboral: row.PKIDModeloContratoLaboral ?? "",
      PKIDSituacionRegistro: row.PKIDSituacionRegistro ?? "",
    });
    setSelectedTrabajadorName(row.Trabajador || "");
    setFormAdenda((f) => ({ ...f, PKIDContratoLaboral: row.PKID }));
  };

  const handleContratoDelete = async (id) => {
    if (!window.confirm("¿Eliminar contrato y sus adendas?")) return;
    try {
      setLoading(true);
      await auth.delete(`/contrato-laboral/${id}`);
      await loadContratos();
      handleContratoNew();
    } catch (err) {
      console.error("Error eliminando contrato:", err?.response || err);
      alert("No se pudo eliminar el contrato.");
    } finally {
      setLoading(false);
    }
  };

  const handleContratoSave = async (e) => {
    e.preventDefault();
    if (!empresaId) {
      alert("Seleccione empresa en el Selector de Contexto.");
      return;
    }
    if (
      !formContrato.PKIDTrabajador ||
      !formContrato.IDContratoLaboral ||
      !formContrato.PKIDCargoEmpresa ||
      !formContrato.PKIDModeloContratoLaboral ||
      !formContrato.PKIDSituacionRegistro ||
      !formContrato.FechaRegistroContrato ||
      !formContrato.FechaInicioContrato ||
      !formContrato.GlosaContrato
    ) {
      alert("Complete los campos obligatorios (*).");
      return;
    }
    const payload = normalizePayload(formContrato, numberFieldsContrato);
    try {
      setLoading(true);
      if (isEditingContrato) {
        await auth.put(`/contrato-laboral/${formContrato.PKID}`, { ...payload, PKID: formContrato.PKID });
        alert("Contrato actualizado.");
      } else {
        const res = await auth.post(`/contrato-laboral/`, payload);
        alert("Contrato creado.");
        const newId = res?.data?.PKID;
        if (newId) {
          await loadContratos();
          setFormContrato((f) => ({ ...f, PKID: newId }));
          setFormAdenda((f) => ({ ...f, PKIDContratoLaboral: newId }));
          const found = trabajadores.find((t) => Number(t.PKID) === Number(formContrato.PKIDTrabajador));
          if (found) setSelectedTrabajadorName(found.NombreCompleto);
        }
      }
      await loadContratos();
    } catch (err) {
      console.error("Error guardando contrato:", err?.response || err);
      alert(`No se pudo guardar el contrato.\n\n${prettyError(err)}`);
    } finally {
      setLoading(false);
    }
  };

  // ---------- handlers adenda ----------
  const handleAdendaChange = (e) => {
    const { name, value } = e.target;
    setFormAdenda((f) => ({ ...f, [name]: value }));
  };

  const handleAdendaNew = () => {
    setFormAdenda((f) => ({ ...emptyAdenda, PKIDContratoLaboral: formContrato.PKID || f.PKIDContratoLaboral }));
  };

  const handleAdendaEdit = (row) => {
    setFormAdenda({
      PKID: row.PKID,
      PKIDContratoLaboral: row.PKIDContratoLaboral,
      IDAdendaContratoLaboral: row.IDAdendaContratoLaboral ?? "",
      GlosaAdenda: row.GlosaAdenda ?? "",
      FechaInicioAdenda: row.FechaInicioAdenda ?? "",
      FechaFinAdenda: row.FechaFinAdenda ?? "",
      InicioSuspensionPerfecta: row.InicioSuspensionPerfecta ?? "",
      FinSuspensionPerfecta: row.FinSuspensionPerfecta ?? "",
      PKIDSituacionRegistro: row.PKIDSituacionRegistro ?? "",
    });
  };

  const handleAdendaDelete = async (id) => {
    if (!window.confirm("¿Eliminar adenda?")) return;
    try {
      setLoading(true);
      await auth.delete(`/adenda-contrato-laboral/${id}`);
      const contratoId = formAdenda.PKIDContratoLaboral || formContrato.PKID;
      await loadAdendas(contratoId);
      handleAdendaNew();
    } catch (err) {
      console.error("Error eliminando adenda:", err?.response || err);
      alert("No se pudo eliminar la adenda.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdendaSave = async (e) => {
    e.preventDefault();
    const contratoId = formAdenda.PKIDContratoLaboral || formContrato.PKID;
    if (!contratoId) {
      alert("Primero guarde el contrato laboral.");
      return;
    }
    const payload = normalizePayload({ ...formAdenda, PKIDContratoLaboral: contratoId }, numberFieldsAdenda);

    if (
      !payload.IDAdendaContratoLaboral ||
      !payload.GlosaAdenda ||
      !payload.FechaInicioAdenda ||
      !payload.FechaFinAdenda ||
      !payload.PKIDSituacionRegistro
    ) {
      alert("Complete los campos obligatorios de la adenda (*).");
      return;
    }
    try {
      setLoading(true);
      if (isEditingAdenda) {
        await auth.put(`/adenda-contrato-laboral/${formAdenda.PKID}`, { ...payload, PKID: formAdenda.PKID });
        alert("Adenda actualizada.");
      } else {
        await auth.post(`/adenda-contrato-laboral/`, payload);
        alert("Adenda creada.");
      }
      await loadAdendas(contratoId);
      handleAdendaNew();
    } catch (err) {
      console.error("Error guardando adenda:", err?.response || err);
      alert(`No se pudo guardar la adenda.\n\n${prettyError(err)}`);
    } finally {
      setLoading(false);
    }
  };

  // UI helpers para mostrar IDContratoLaboral en pestaña y header
  const workerName =
    selectedTrabajadorName ||
    (formContrato.PKIDTrabajador
      ? trabajadores.find((t) => Number(t.PKID) === Number(formContrato.PKIDTrabajador))?.NombreCompleto
      : "") ||
    "";

  const selectedContratoPk = formContrato.PKID || formAdenda.PKIDContratoLaboral;
  const selectedContratoRow = selectedContratoPk
    ? contratos.find((c) => Number(c.PKID) === Number(selectedContratoPk))
    : null;
  const selectedIdContratoLaboral =
    (formContrato.IDContratoLaboral && String(formContrato.IDContratoLaboral)) ||
    (selectedContratoRow?.IDContratoLaboral != null ? String(selectedContratoRow.IDContratoLaboral) : "");

  // Título de pestaña Adendas: "Adendas – ID <IDContratoLaboral> – <Trabajador>"
  let adendasTitle = "Adendas";
  const adendasParts = [];
  if (selectedIdContratoLaboral) adendasParts.push(`ID ${selectedIdContratoLaboral}`);
  if (workerName) adendasParts.push(workerName);
  if (adendasParts.length) adendasTitle = `Adendas – ${adendasParts.join(" – ")}`;

  const tabs = [
    { id: "contrato", title: "Contrato" },
    { id: "adendas", title: adendasTitle },
  ];
  const tabBtn = (t) => ({ ...btn.base, ...(activeTab === t ? btn.primary : btn.subtle), padding: "6px 10px" });

  const pill = {
    display: "inline-block",
    padding: "2px 8px",
    fontSize: 12,
    borderRadius: 999,
    background: "#e5e7eb",
    color: "#111827",
  };

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ marginBottom: 16 }}>Contrato Laboral</h2>

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

      {/* Form Contrato */}
      {activeTab === "contrato" && (
        <div style={{ ...card, marginBottom: 16 }}>
          <form onSubmit={handleContratoSave}>
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
                <select name="PKIDTrabajador" value={formContrato.PKIDTrabajador} onChange={handleContratoChange} style={input}>
                  <option value="">-- Seleccionar --</option>
                  {trabajadores.map((t) => (
                    <option key={t.PKID} value={t.PKID}>
                      {t.NombreCompleto}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={label}>Cargo empresa *</label>
                <select name="PKIDCargoEmpresa" value={formContrato.PKIDCargoEmpresa} onChange={handleContratoChange} style={input}>
                  <option value="">-- Seleccionar --</option>
                  {cargos.map((c) => (
                    <option key={c.PKID} value={c.PKID}>
                      {c.CargoEmpresa}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={label}>Modelo contrato *</label>
                <select
                  name="PKIDModeloContratoLaboral"
                  value={formContrato.PKIDModeloContratoLaboral}
                  onChange={handleContratoChange}
                  style={input}
                >
                  <option value="">-- Seleccionar --</option>
                  {modelos.map((m) => (
                    <option key={m.PKID} value={m.PKID}>
                      {m.ModeloContratoLaboral}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ ...row4, marginTop: 12 }}>
              <div>
                <label style={label}>ID Contrato *</label>
                <input name="IDContratoLaboral" value={formContrato.IDContratoLaboral} onChange={handleContratoChange} style={input} />
              </div>
              <div>
                <label style={label}>Fecha registro *</label>
                <input
                  type="date"
                  name="FechaRegistroContrato"
                  value={formContrato.FechaRegistroContrato || ""}
                  onChange={handleContratoChange}
                  style={input}
                />
              </div>
              <div>
                <label style={label}>Fecha inicio *</label>
                <input
                  type="date"
                  name="FechaInicioContrato"
                  value={formContrato.FechaInicioContrato || ""}
                  onChange={handleContratoChange}
                  style={input}
                />
              </div>
              <div>
                <label style={label}>Fecha fin</label>
                <input
                  type="date"
                  name="FechaFinContrato"
                  value={formContrato.FechaFinContrato || ""}
                  onChange={handleContratoChange}
                  style={input}
                />
              </div>
            </div>

            <div style={{ ...row3, marginTop: 12 }}>
              <div>
                <label style={label}>Situación *</label>
                <select
                  name="PKIDSituacionRegistro"
                  value={formContrato.PKIDSituacionRegistro}
                  onChange={handleContratoChange}
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
              <div style={{ gridColumn: "span 2" }}>
                <label style={label}>Glosa *</label>
                <input name="GlosaContrato" value={formContrato.GlosaContrato} onChange={handleContratoChange} style={input} />
              </div>
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
              <button type="submit" disabled={loading} style={{ ...btn.base, ...(btn.primary) }}>
                {isEditingContrato ? "Actualizar" : "Agregar"}
              </button>
              <button type="button" disabled={loading} onClick={handleContratoNew} style={{ ...btn.base, ...(btn.neutral) }}>
                Limpiar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Form/Encabezado Adendas */}
      {activeTab === "adendas" && (
        <div style={{ ...card, marginBottom: 16 }}>
          {/* Header con IDContratoLaboral (pill) y nombre de trabajador */}
          <div style={{ marginBottom: 8, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
            {(selectedIdContratoLaboral || selectedContratoPk) && (
              <span style={pill}>
                {selectedIdContratoLaboral ? `ID ${selectedIdContratoLaboral}` : `#${selectedContratoPk}`}
              </span>
            )}
            <span>{workerName || "Adendas"}</span>
          </div>

          <form onSubmit={handleAdendaSave}>
            <div style={row4}>
              <div>
                <label style={label}>Contrato</label>
                <input
                  value={
                    selectedIdContratoLaboral
                      ? `ID ${selectedIdContratoLaboral}`
                      : selectedContratoPk
                      ? `PKID ${selectedContratoPk}`
                      : "(nuevo)"
                  }
                  disabled
                  style={{ ...input, background: "#f9fafb" }}
                />
              </div>
              <div>
                <label style={label}>ID Adenda *</label>
                <input
                  name="IDAdendaContratoLaboral"
                  value={formAdenda.IDAdendaContratoLaboral}
                  onChange={handleAdendaChange}
                  style={input}
                />
              </div>
              <div>
                <label style={label}>Fecha inicio *</label>
                <input
                  type="date"
                  name="FechaInicioAdenda"
                  value={formAdenda.FechaInicioAdenda || ""}
                  onChange={handleAdendaChange}
                  style={input}
                />
              </div>
              <div>
                <label style={label}>Fecha fin *</label>
                <input
                  type="date"
                  name="FechaFinAdenda"
                  value={formAdenda.FechaFinAdenda || ""}
                  onChange={handleAdendaChange}
                  style={input}
                />
              </div>
            </div>

            <div style={{ ...row4, marginTop: 12 }}>
              <div>
                <label style={label}>Inicio Susp. Perfecta</label>
                <input
                  type="date"
                  name="InicioSuspensionPerfecta"
                  value={formAdenda.InicioSuspensionPerfecta || ""}
                  onChange={handleAdendaChange}
                  style={input}
                />
              </div>
              <div>
                <label style={label}>Fin Susp. Perfecta</label>
                <input
                  type="date"
                  name="FinSuspensionPerfecta"
                  value={formAdenda.FinSuspensionPerfecta || ""}
                  onChange={handleAdendaChange}
                  style={input}
                />
              </div>
              <div>
                <label style={label}>Situación *</label>
                <select
                  name="PKIDSituacionRegistro"
                  value={formAdenda.PKIDSituacionRegistro}
                  onChange={handleAdendaChange}
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
                <label style={label}>Glosa *</label>
                <input name="GlosaAdenda" value={formAdenda.GlosaAdenda} onChange={handleAdendaChange} style={input} />
              </div>
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
              <button type="submit" disabled={loading} style={{ ...btn.base, ...(btn.primary) }}>
                {isEditingAdenda ? "Actualizar" : "Agregar"}
              </button>
              <button type="button" disabled={loading} onClick={handleAdendaNew} style={{ ...btn.base, ...(btn.neutral) }}>
                Limpiar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista Contratos (solo en pestaña Contrato) */}
      {activeTab === "contrato" && (
        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <strong>Contratos</strong>
            <span style={{ fontSize: 12, color: "#6b7280" }}>Total: {contratos.length}</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Trabajador</th>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Cargo</th>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Modelo</th>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>F. Inicio</th>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>F. Fin</th>
                  <th style={{ textAlign: "center", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {contratos.map((r) => {
                  const isSelected = Number(r.PKID) === Number(formContrato.PKID || 0);
                  const rowStyle = {
                    background: isSelected ? "#fff7ed" /* amber-50 */ : "transparent",
                  };
                  return (
                    <tr key={r.PKID} style={rowStyle}>
                      <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{r.Trabajador}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{r.CargoEmpresa}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{r.ModeloContratoLaboral}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{r.FechaInicioContrato}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{r.FechaFinContrato || ""}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6", textAlign: "center" }}>
                        <button
                          onClick={() => handleContratoEdit(r)}
                          title="Editar (mantener en Contrato)"
                          style={{ ...btn.base, ...(btn.neutral), marginRight: 6 }}
                        >
                          ✏️
                        </button>
                        <button onClick={() => handleContratoDelete(r.PKID)} title="Eliminar" style={{ ...btn.base, ...(btn.danger) }}>
                          🗑️
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {contratos.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", padding: 16, color: "#6b7280" }}>
                      No hay contratos para la empresa seleccionada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Lista Adendas (en pestaña Adendas, si hay contrato seleccionado) */}
      {activeTab === "adendas" && (formContrato.PKID || formAdenda.PKIDContratoLaboral) && (
        <div style={{ ...card, marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <strong>
              {selectedIdContratoLaboral
                ? `Adendas del contrato ID ${selectedIdContratoLaboral}`
                : `Adendas del contrato #${selectedContratoPk}`}
            </strong>
            <span style={{ fontSize: 12, color: "#6b7280" }}>Total: {adendas.length}</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>ID Adenda</th>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Glosa</th>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Inicio</th>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Fin</th>
                  <th style={{ textAlign: "center", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {adendas.map((a) => (
                  <tr key={a.PKID}>
                    <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{a.IDAdendaContratoLaboral}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{a.GlosaAdenda}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{a.FechaInicioAdenda}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{a.FechaFinAdenda}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6", textAlign: "center" }}>
                      <button
                        onClick={() => handleAdendaEdit(a)}
                        title="Editar"
                        style={{ ...btn.base, ...(btn.neutral), marginRight: 6 }}
                      >
                        ✏️
                      </button>
                      <button onClick={() => handleAdendaDelete(a.PKID)} title="Eliminar" style={{ ...btn.base, ...(btn.danger) }}>
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
                {adendas.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", padding: 16, color: "#6b7280" }}>
                      No hay adendas para este contrato.
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
