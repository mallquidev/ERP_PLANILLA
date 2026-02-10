import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import API_BASE_URL from "../api";

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
  base: {
    border: "none",
    borderRadius: 6,
    padding: "8px 12px",
    cursor: "pointer",
    fontWeight: 600,
  },
  primary: {
    background: "#2563eb",
    color: "#fff",
  },
  neutral: {
    background: "#f3f4f6",
    color: "#111827",
  },
  danger: {
    background: "#ef4444",
    color: "#fff",
  },
  subtle: {
    background: "#e5e7eb",
    color: "#111827",
  },
};

// Opciones para los combos
const tipoConceptoOptions = [
  { value: 1, label: "Ingreso" },
  { value: 2, label: "Deducción" },
  { value: 3, label: "Cuenta Corriente" }
];

const tipoGastoOptions = [
  { value: 1, label: "Ingreso" },
  { value: 2, label: "Deducción" },
  { value: 3, label: "Aporte" }
];

const tipoHoraDiaOptions = [
  { value: 1, label: "Hora" },
  { value: 2, label: "Dia" },
  { value: 3, label: "Cantidad" }
];

export default function ConceptoPlanillaComponent() {
  const auth = useAuthAxios();

  const [lista, setLista] = useState([]);
  const [plames, setPlames] = useState([]);
  const [situaciones, setSituaciones] = useState([]);

  // Filtros
  const [filterId, setFilterId] = useState("");
  const [filterText, setFilterText] = useState("");

  const [form, setForm] = useState({
    PKID: null,
    IDConceptoPlanilla: "",
    ConceptoPlanilla: "",
    ConceptoAbreviado: "",
    TipoConcepto: 0,
    TipoConceptoGasto: "",
    TipoHoraDia: 0,
    IndicadorSubsidioCheck: false,
    IndicadorCuentaCorrienteCheck: false,
    IndicadorDescuentoJudicialCheck: false,
    IndicadorAfpCheck: false,
    IndicadorScrtSaludCheck: false,
    IndicadorScrtPensionCheck: false,
    IndicadorAporteEssaludCheck: false,
    IndicadoAporteSenatiCheck: false,
    IndicadorAporteSCRTCheck: false,
    IndicadorAporteVidaCheck: false,
    IndicadorExclusionCostosCheck: false,
    PKIDPlameConcepto: "",
    PKIDSituacionRegistro: "",
  });

  const isEditing = form.PKID !== null;
  const [loading, setLoading] = useState(false);

  // Combos
  const loadCombos = async () => {
    try {
      setLoading(true);
      const [pl, si] = await Promise.all([
        auth.get("/concepto-planilla-combos/plame"),
        auth.get("/concepto-planilla-combos/situacion"),
      ]);
      setPlames(pl.data || []);
      setSituaciones(si.data || []);
    } catch (err) {
      console.error("Error cargando combos CP:", err);
      alert("No se pudieron cargar los combos.");
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await auth.get("/concepto-planilla/");
      setLista(res.data || []);
    } catch (err) {
      console.error("Error listando CP:", err);
      alert("No se pudo listar Conceptos de Planilla.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCombos();
    fetchData();
    // eslint-disable-next-line
  }, []);

  const handleNew = () => {
    setForm({
      PKID: null,
      IDConceptoPlanilla: "",
      ConceptoPlanilla: "",
      ConceptoAbreviado: "",
      TipoConcepto: 0,
      TipoConceptoGasto: "",
      TipoHoraDia: 0,
      IndicadorSubsidioCheck: false,
      IndicadorCuentaCorrienteCheck: false,
      IndicadorDescuentoJudicialCheck: false,
      IndicadorAfpCheck: false,
      IndicadorScrtSaludCheck: false,
      IndicadorScrtPensionCheck: false,
      IndicadorAporteEssaludCheck: false,
      IndicadoAporteSenatiCheck: false,
      IndicadorAporteSCRTCheck: false,
      IndicadorAporteVidaCheck: false,
      IndicadorExclusionCostosCheck: false,
      PKIDPlameConcepto: "",
      PKIDSituacionRegistro: "",
    });
  };

  const handleEdit = (row) => {
    setForm({
      PKID: row.PKID,
      IDConceptoPlanilla: row.IDConceptoPlanilla,
      ConceptoPlanilla: row.ConceptoPlanilla,
      ConceptoAbreviado: row.ConceptoAbreviado || "",
      TipoConcepto: row.TipoConcepto || 0,
      TipoConceptoGasto: row.TipoConceptoGasto ?? "",
      TipoHoraDia: row.TipoHoraDia || 0,
      IndicadorSubsidioCheck: !!row.IndicadorSubsidioCheck,
      IndicadorCuentaCorrienteCheck: !!row.IndicadorCuentaCorrienteCheck,
      IndicadorDescuentoJudicialCheck: !!row.IndicadorDescuentoJudicialCheck,
      IndicadorAfpCheck: !!row.IndicadorAfpCheck,
      IndicadorScrtSaludCheck: !!row.IndicadorScrtSaludCheck,
      IndicadorScrtPensionCheck: !!row.IndicadorScrtPensionCheck,
      IndicadorAporteEssaludCheck: !!row.IndicadorAporteEssaludCheck,
      IndicadoAporteSenatiCheck: !!row.IndicadoAporteSenatiCheck,
      IndicadorAporteSCRTCheck: !!row.IndicadorAporteSCRTCheck,
      IndicadorAporteVidaCheck: !!row.IndicadorAporteVidaCheck,
      IndicadorExclusionCostosCheck: !!row.IndicadorExclusionCostosCheck,
      PKIDPlameConcepto: row.PKIDPlameConcepto ?? "",
      PKIDSituacionRegistro: row.PKIDSituacionRegistro ?? "",
    });
  };

  const handleDelete = async (PKID) => {
    if (!window.confirm("¿Eliminar Concepto?")) return;
    try {
      setLoading(true);
      await auth.delete(`/concepto-planilla/${PKID}`);
      await fetchData();
    } catch (err) {
      console.error("Error eliminando CP:", err);
      alert("No se pudo eliminar.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    if (type === "checkbox") {
      setForm((f) => ({ ...f, [name]: checked }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const handleSave = async () => {
    if (
      !form.IDConceptoPlanilla ||
      !form.ConceptoPlanilla ||
      form.TipoConcepto === "" ||
      !form.TipoHoraDia ||
      !form.PKIDSituacionRegistro
    ) {
      alert("Complete los campos requeridos: ID, Concepto, TipoConcepto, TipoHoraDia y Situación.");
      return;
    }
    try {
      setLoading(true);

      const payload = {
        IDConceptoPlanilla: Number(form.IDConceptoPlanilla),
        ConceptoPlanilla: form.ConceptoPlanilla.trim(),
        ConceptoAbreviado: form.ConceptoAbreviado?.trim() || null,
        TipoConcepto: Number(form.TipoConcepto),
        TipoConceptoGasto: form.TipoConceptoGasto === "" ? null : Number(form.TipoConceptoGasto),
        TipoHoraDia: Number(form.TipoHoraDia),
        IndicadorSubsidioCheck: !!form.IndicadorSubsidioCheck,
        IndicadorCuentaCorrienteCheck: !!form.IndicadorCuentaCorrienteCheck,
        IndicadorDescuentoJudicialCheck: !!form.IndicadorDescuentoJudicialCheck,
        IndicadorAfpCheck: !!form.IndicadorAfpCheck,
        IndicadorScrtSaludCheck: !!form.IndicadorScrtSaludCheck,
        IndicadorScrtPensionCheck: !!form.IndicadorScrtPensionCheck,
        IndicadorAporteEssaludCheck: !!form.IndicadorAporteEssaludCheck,
        IndicadoAporteSenatiCheck: !!form.IndicadoAporteSenatiCheck,
        IndicadorAporteSCRTCheck: !!form.IndicadorAporteSCRTCheck,
        IndicadorAporteVidaCheck: !!form.IndicadorAporteVidaCheck,
        IndicadorExclusionCostosCheck: !!form.IndicadorExclusionCostosCheck,
        PKIDPlameConcepto: form.PKIDPlameConcepto === "" ? null : Number(form.PKIDPlameConcepto),
        PKIDSituacionRegistro: Number(form.PKIDSituacionRegistro),
      };

      if (isEditing) {
        await auth.put(`/concepto-planilla/${form.PKID}`, { ...payload, PKID: form.PKID });
        alert("Concepto actualizado.");
      } else {
        await auth.post(`/concepto-planilla/`, payload);
        alert("Concepto creado.");
      }
      await fetchData();
      handleNew();
    } catch (err) {
      console.error("Error guardando CP:", err);
      const detail = err?.response?.data?.detail || err.message || "Error desconocido";
      alert(`No se pudo guardar.\nDetalle: ${detail}`);
    } finally {
      setLoading(false);
    }
  };

  const rowYesNo = (v) => (v ? "✓" : "");

  // Filtrado en memoria
  const filteredList = useMemo(() => {
    const id = (filterId || "").trim();
    const txt = (filterText || "").trim().toLowerCase();
    return (lista || []).filter((r) => {
      const okId = id ? String(r.IDConceptoPlanilla || "").includes(id) : true;
      const okTxt = txt ? String(r.ConceptoPlanilla || "").toLowerCase().includes(txt) : true;
      return okId && okTxt;
    });
  }, [lista, filterId, filterText]);

  const clearFilters = () => {
    setFilterId("");
    setFilterText("");
  };

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ marginBottom: 16 }}>Concepto de Planilla</h2>

      {/* Formulario */}
      <div style={{ ...card, marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "#374151" }}>ID Concepto *</label>
            <input
              type="number"
              name="IDConceptoPlanilla"
              value={form.IDConceptoPlanilla}
              onChange={handleChange}
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
            />
          </div>
          <div style={{ gridColumn: "span 2" }}>
            <label style={{ display: "block", fontSize: 12, color: "#374151" }}>Concepto *</label>
            <input
              type="text"
              name="ConceptoPlanilla"
              value={form.ConceptoPlanilla}
              onChange={handleChange}
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "#374151" }}>Abreviado</label>
            <input
              type="text"
              name="ConceptoAbreviado"
              value={form.ConceptoAbreviado}
              onChange={handleChange}
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, color: "#374151" }}>Tipo Concepto *</label>
            <select
              name="TipoConcepto"
              value={form.TipoConcepto}
              onChange={handleChange}
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
            >
              <option value={0}>-- Seleccionar --</option>
              {tipoConceptoOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "#374151" }}>Tipo Concepto Gasto</label>
            <select
              name="TipoConceptoGasto"
              value={form.TipoConceptoGasto}
              onChange={handleChange}
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
            >
              <option value="">-- Seleccionar --</option>
              {tipoGastoOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "#374151" }}>Tipo Hora/Día *</label>
            <select
              name="TipoHoraDia"
              value={form.TipoHoraDia}
              onChange={handleChange}
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
            >
              <option value={0}>-- Seleccionar --</option>
              {tipoHoraDiaOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, color: "#374151" }}>Plame Concepto</label>
            <select
              name="PKIDPlameConcepto"
              value={form.PKIDPlameConcepto}
              onChange={handleChange}
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
            >
              <option value="">-- (ninguno) --</option>
              {plames.map((p) => (
                <option key={p.PKID} value={p.PKID}>
                  {p.PlameConcepto}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, color: "#374151" }}>Situación *</label>
            <select
              name="PKIDSituacionRegistro"
              value={form.PKIDSituacionRegistro}
              onChange={handleChange}
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
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

        {/* Checkboxes */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginTop: 12 }}>
          {[
            ["IndicadorSubsidioCheck", "Subsidio"],
            ["IndicadorCuentaCorrienteCheck", "Cuenta Corriente"],
            ["IndicadorDescuentoJudicialCheck", "Desc. Judicial"],
            ["IndicadorAfpCheck", "AFP"],
            ["IndicadorScrtSaludCheck", "SCRT Salud"],
            ["IndicadorScrtPensionCheck", "SCRT Pensión"],
            ["IndicadorAporteEssaludCheck", "Aporte Essalud"],
            ["IndicadoAporteSenatiCheck", "Aporte Senati"],
            ["IndicadorAporteSCRTCheck", "Aporte SCRT"],
            ["IndicadorAporteVidaCheck", "Aporte Vida"],
            ["IndicadorExclusionCostosCheck", "Exclusión Costos"],
          ].map(([name, label]) => (
            <label key={name} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#374151" }}>
              <input type="checkbox" name={name} checked={!!form[name]} onChange={handleChange} />
              {label}
            </label>
          ))}
        </div>

        {/* Botones */}
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <button onClick={handleSave} disabled={loading} style={{ ...btn.base, ...(btn.primary) }}>
            {isEditing ? "Actualizar" : "Agregar"}
          </button>
          <button onClick={handleNew} disabled={loading} style={{ ...btn.base, ...(btn.neutral) }}>
            Limpiar
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ ...card, marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ maxWidth: 160 }}>
            <label style={{ display: "block", fontSize: 12, color: "#374151" }}>Filtrar por ID Concepto</label>
            <input
              type="text"
              value={filterId}
              onChange={(e) => setFilterId(e.target.value)}
              placeholder="Ej: 1001"
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
            />
          </div>
          <div style={{ minWidth: 240, flex: 1 }}>
            <label style={{ display: "block", fontSize: 12, color: "#374151" }}>Filtrar por Concepto</label>
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Ej: BÁSICO"
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
            />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={clearFilters} style={{ ...btn.base, ...(btn.subtle) }}>
              Limpiar filtros
            </button>
            <div style={{ alignSelf: "center", color: "#6b7280", fontSize: 13 }}>
              Mostrando: <strong>{filteredList.length}</strong> de {lista.length}
            </div>
          </div>
        </div>
      </div>

      {/* Listado */}
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <strong>Listado</strong>
          <span style={{ fontSize: 12, color: "#6b7280" }}>Total: {filteredList.length}</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f9fafb" }}>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>ID</th>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Concepto</th>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Abrev.</th>
                <th style={{ textAlign: "center", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Tipo</th>
                <th style={{ textAlign: "center", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Hora/Día</th>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Plame</th>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Situación</th>
                <th style={{ textAlign: "center", padding: 8, borderBottom: "1px solid #e5e7eb" }}>AFP</th>
                <th style={{ textAlign: "center", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Essalud</th>
                <th style={{ textAlign: "center", padding: 8, borderBottom: "1px solid #e5e7eb" }}>SCRT</th>
                <th style={{ textAlign: "center", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map((r) => (
                <tr key={r.PKID}>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{r.IDConceptoPlanilla}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{r.ConceptoPlanilla}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{r.ConceptoAbreviado || ""}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6", textAlign: "center" }}>
                    {tipoConceptoOptions.find(opt => opt.value === r.TipoConcepto)?.label || r.TipoConcepto}
                  </td>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6", textAlign: "center" }}>
                    {tipoHoraDiaOptions.find(opt => opt.value === r.TipoHoraDia)?.label || r.TipoHoraDia}
                  </td>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{r.PlameConceptoNombre || ""}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{r.SituacionRegistro}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6", textAlign: "center" }}>
                    {r.IndicadorAfpCheck ? "✓" : ""}
                  </td>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6", textAlign: "center" }}>
                    {r.IndicadorAporteEssaludCheck ? "✓" : ""}
                  </td>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6", textAlign: "center" }}>
                    {(r.IndicadorScrtPensionCheck || r.IndicadorScrtSaludCheck) ? "✓" : ""}
                  </td>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6", textAlign: "center" }}>
                    <button
                      onClick={() => handleEdit(r)}
                      title="Editar"
                      style={{ ...btn.base, ...(btn.neutral), marginRight: 6 }}
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(r.PKID)}
                      title="Eliminar"
                      style={{ ...btn.base, ...(btn.danger) }}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
              {filteredList.length === 0 && (
                <tr>
                  <td colSpan="11" style={{ textAlign: "center", padding: 16, color: "#6b7280" }}>
                    No hay conceptos para los filtros ingresados.
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