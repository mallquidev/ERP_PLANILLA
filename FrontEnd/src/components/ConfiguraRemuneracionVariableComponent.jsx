// src/components/ConfiguraRemuneracionVariableComponent.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import API_BASE_URL from "../api";

// === helper: axios autenticado (como en tus componentes) ===
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

// === estilos reutilizados (card / btn), siguiendo tu diseño ===
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
  primary: { background: "#2563eb", color: "#fff" },
  neutral: { background: "#f3f4f6", color: "#111827" },
  danger: { background: "#ef4444", color: "#fff" },
  subtle: { background: "#e5e7eb", color: "#111827" },
};

export default function ConfiguraRemuneracionVariableComponent() {
  const auth = useAuthAxios();

  // listado y combos
  const [lista, setLista] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [tiposProceso, setTiposProceso] = useState([]);
  const [situaciones, setSituaciones] = useState([]);

  // filtros
  const [filtroAno, setFiltroAno] = useState("");
  const [filtroMes, setFiltroMes] = useState("");
  const [filtroTrans, setFiltroTrans] = useState("");

  // formulario
  const [form, setForm] = useState({
    PKID: null,
    PKIDEmpresa: "",
    Ano: "",
    Mes: "",
    Transaccion: "",
    Descripcion: "",
    NumeroMesesAnterior: "",
    NumeroMesesMinimos: "",
    FactorDivision: "",
    PKIDTipoProceso: "",
    APartirMesAnterior: false,
    FactorTiempoServicio: "",
    CondiserarInicioPeriodo: false,
    ConsiderarSoloVariables: false,
    GuardarDatosCalculo: false,
    AplicarComisionPromedio: false,
    PKIDSituacionRegistro: "",
  });
  const isEditing = form.PKID !== null;
  const [loading, setLoading] = useState(false);

  // === combos ===
  const loadCombos = async () => {
    try {
      setLoading(true);
      const [emp, tipo, sit] = await Promise.all([
        auth.get("/configura-remuneracion-variable-combos/empresa/"),
        auth.get("/configura-remuneracion-variable-combos/tipoproceso/"),
        auth.get("/configura-remuneracion-variable-combos/situacion/"),
      ]);
      setEmpresas(emp.data || []);
      setTiposProceso(tipo.data || []);
      setSituaciones(sit.data || []);
    } catch (err) {
      console.error("Error combos RemVar:", err);
      alert("No se pudieron cargar los combos.");
    } finally {
      setLoading(false);
    }
  };

  // === listado ===
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await auth.get("/configura-remuneracion-variable/");
      setLista(res.data || []);
    } catch (err) {
      console.error("Error listando RemVar:", err);
      alert("No se pudo listar la configuración.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCombos();
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // === helpers form ===
  const handleNew = () => {
    setForm({
      PKID: null,
      PKIDEmpresa: "",
      Ano: "",
      Mes: "",
      Transaccion: "",
      Descripcion: "",
      NumeroMesesAnterior: "",
      NumeroMesesMinimos: "",
      FactorDivision: "",
      PKIDTipoProceso: "",
      APartirMesAnterior: false,
      FactorTiempoServicio: "",
      CondiserarInicioPeriodo: false,
      ConsiderarSoloVariables: false,
      GuardarDatosCalculo: false,
      AplicarComisionPromedio: false,
      PKIDSituacionRegistro: "",
    });
  };

  const handleEdit = (row) => {
    setForm({
      PKID: row.PKID,
      PKIDEmpresa: row.PKIDEmpresa,
      Ano: row.Ano,
      Mes: row.Mes,
      Transaccion: row.Transaccion,
      Descripcion: row.Descripcion || "",
      NumeroMesesAnterior: row.NumeroMesesAnterior ?? "",
      NumeroMesesMinimos: row.NumeroMesesMinimos ?? "",
      FactorDivision: row.FactorDivision ?? "",
      PKIDTipoProceso: row.PKIDTipoProceso,
      APartirMesAnterior: !!row.APartirMesAnterior,
      FactorTiempoServicio: row.FactorTiempoServicio ?? "",
      CondiserarInicioPeriodo: !!row.CondiserarInicioPeriodo,
      ConsiderarSoloVariables: !!row.ConsiderarSoloVariables,
      GuardarDatosCalculo: !!row.GuardarDatosCalculo,
      AplicarComisionPromedio: !!row.AplicarComisionPromedio,
      PKIDSituacionRegistro: row.PKIDSituacionRegistro,
    });
  };

  const handleDelete = async (PKID) => {
    if (!window.confirm("¿Eliminar configuración?")) return;
    try {
      setLoading(true);
      await auth.delete(`/configura-remuneracion-variable/${PKID}`);
      await fetchData();
    } catch (err) {
      console.error("Error eliminando RemVar:", err);
      alert("No se pudo eliminar.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSave = async () => {
    // validación mínima
    if (
      !form.PKIDEmpresa ||
      !form.Ano ||
      !form.Mes ||
      !form.Transaccion ||
      !form.Descripcion ||
      !form.PKIDTipoProceso ||
      !form.PKIDSituacionRegistro
    ) {
      alert("Completa los campos requeridos: Empresa, Año, Mes, Transacción, Descripción, Tipo Proceso y Situación.");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        PKIDEmpresa: Number(form.PKIDEmpresa),
        Ano: Number(form.Ano),
        Mes: Number(form.Mes),
        Transaccion: String(form.Transaccion).slice(0, 4),
        Descripcion: form.Descripcion.trim(),
        NumeroMesesAnterior: Number(form.NumeroMesesAnterior || 0),
        NumeroMesesMinimos: Number(form.NumeroMesesMinimos || 0),
        FactorDivision: Number(form.FactorDivision || 0),
        PKIDTipoProceso: Number(form.PKIDTipoProceso),
        APartirMesAnterior: !!form.APartirMesAnterior,
        FactorTiempoServicio: Number(form.FactorTiempoServicio || 0),
        CondiserarInicioPeriodo: !!form.CondiserarInicioPeriodo,
        ConsiderarSoloVariables: !!form.ConsiderarSoloVariables,
        GuardarDatosCalculo: !!form.GuardarDatosCalculo,
        AplicarComisionPromedio: !!form.AplicarComisionPromedio,
        PKIDSituacionRegistro: Number(form.PKIDSituacionRegistro),
      };

      if (isEditing) {
        await auth.put(`/configura-remuneracion-variable/${form.PKID}`, { ...payload, PKID: form.PKID });
        alert("Configuración actualizada.");
      } else {
        await auth.post(`/configura-remuneracion-variable/`, payload);
        alert("Configuración creada.");
      }
      await fetchData();
      handleNew();
    } catch (err) {
      console.error("Error guardando RemVar:", err);
      const detail = err?.response?.data?.detail || err.message || "Error desconocido";
      alert(`No se pudo guardar.\nDetalle: ${detail}`);
    } finally {
      setLoading(false);
    }
  };

  // === filtros en memoria ===
  const filtered = useMemo(() => {
    return (lista || []).filter((r) => {
      const okAno = filtroAno ? String(r.Ano || "").includes(String(filtroAno)) : true;
      const okMes = filtroMes ? String(r.Mes || "").includes(String(filtroMes)) : true;
      const okTrx = filtroTrans ? String(r.Transaccion || "").toLowerCase().includes(String(filtroTrans).toLowerCase()) : true;
      return okAno && okMes && okTrx;
    });
  }, [lista, filtroAno, filtroMes, filtroTrans]);

  const clearFilters = () => {
    setFiltroAno("");
    setFiltroMes("");
    setFiltroTrans("");
  };

  // === UI ===
  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ marginBottom: 16 }}>Configuración de Remuneración Variable</h2>

      {/* Formulario */}
      <div style={{ ...card, marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "#374151" }}>Empresa *</label>
            <select
              name="PKIDEmpresa"
              value={form.PKIDEmpresa}
              onChange={handleChange}
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
            >
              <option value="">-- Seleccionar --</option>
              {empresas.map((e) => (
                <option key={e.PKID} value={e.PKID}>
                  {e.Empresa}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, color: "#374151" }}>Año *</label>
            <input
              type="number"
              name="Ano"
              value={form.Ano}
              onChange={handleChange}
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, color: "#374151" }}>Mes *</label>
            <input
              type="number"
              name="Mes"
              value={form.Mes}
              onChange={handleChange}
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, color: "#374151" }}>Transacción (4) *</label>
            <input
              name="Transaccion"
              maxLength={4}
              value={form.Transaccion}
              onChange={handleChange}
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
            />
          </div>

          <div style={{ gridColumn: "span 2" }}>
            <label style={{ display: "block", fontSize: 12, color: "#374151" }}>Descripción *</label>
            <input
              name="Descripcion"
              value={form.Descripcion}
              onChange={handleChange}
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, color: "#374151" }}>N° Meses Anterior *</label>
            <input
              type="number"
              name="NumeroMesesAnterior"
              value={form.NumeroMesesAnterior}
              onChange={handleChange}
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, color: "#374151" }}>N° Meses Mínimos *</label>
            <input
              type="number"
              name="NumeroMesesMinimos"
              value={form.NumeroMesesMinimos}
              onChange={handleChange}
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, color: "#374151" }}>Factor División *</label>
            <input
              type="number"
              name="FactorDivision"
              value={form.FactorDivision}
              onChange={handleChange}
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, color: "#374151" }}>Tipo Proceso *</label>
            <select
              name="PKIDTipoProceso"
              value={form.PKIDTipoProceso}
              onChange={handleChange}
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
            >
              <option value="">-- Seleccionar --</option>
              {tiposProceso.map((t) => (
                <option key={t.PKID} value={t.PKID}>
                  {t.TipoProceso}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, color: "#374151" }}>Factor Tiempo Servicio *</label>
            <input
              type="number"
              name="FactorTiempoServicio"
              value={form.FactorTiempoServicio}
              onChange={handleChange}
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
            />
          </div>
        </div>

        {/* checks */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginTop: 12 }}>
          {[
            ["APartirMesAnterior", "A partir del mes anterior"],
            ["CondiserarInicioPeriodo", "Considerar inicio del periodo"],
            ["ConsiderarSoloVariables", "Considerar solo variables"],
            ["GuardarDatosCalculo", "Guardar datos cálculo"],
            ["AplicarComisionPromedio", "Aplicar comisión promedio"],
          ].map(([name, label]) => (
            <label key={name} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#374151" }}>
              <input type="checkbox" name={name} checked={!!form[name]} onChange={handleChange} />
              {label}
            </label>
          ))}
        </div>

        <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
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
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <button onClick={handleSave} disabled={loading} style={{ ...btn.base, ...(btn.primary) }}>
              {isEditing ? "Actualizar" : "Agregar"}
            </button>
            <button onClick={handleNew} disabled={loading} style={{ ...btn.base, ...(btn.neutral) }}>
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ ...card, marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "#374151" }}>Año</label>
            <input
              type="text"
              value={filtroAno}
              onChange={(e) => setFiltroAno(e.target.value)}
              placeholder="Ej: 2025"
              style={{ width: 120, padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "#374151" }}>Mes</label>
            <input
              type="text"
              value={filtroMes}
              onChange={(e) => setFiltroMes(e.target.value)}
              placeholder="1..12"
              style={{ width: 100, padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
            />
          </div>
          <div style={{ minWidth: 200, flex: 1 }}>
            <label style={{ display: "block", fontSize: 12, color: "#374151" }}>Transacción</label>
            <input
              type="text"
              value={filtroTrans}
              onChange={(e) => setFiltroTrans(e.target.value)}
              placeholder="Ej: 0001"
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
            />
          </div>
          <button onClick={clearFilters} style={{ ...btn.base, ...(btn.subtle), height: 36 }}>
            Limpiar filtros
          </button>
          <div style={{ alignSelf: "center", color: "#6b7280", fontSize: 13 }}>
            Mostrando: <strong>{filtered.length}</strong> de {lista.length}
          </div>
        </div>
      </div>

      {/* Grilla */}
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <strong>Listado</strong>
          <span style={{ fontSize: 12, color: "#6b7280" }}>Total: {filtered.length}</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f9fafb" }}>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Año</th>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Mes</th>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Transacción</th>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Descripción</th>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Empresa</th>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Tipo Proceso</th>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Situación</th>
                <th style={{ textAlign: "center", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.PKID}>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{r.Ano}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{r.Mes}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{r.Transaccion}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{r.Descripcion}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{r.Empresa}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{r.TipoProceso}</td>
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
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", padding: 16, color: "#6b7280" }}>
                    No hay registros para los filtros dados.
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
