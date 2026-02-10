// src/components/CondicionTrabajadorComponent.jsx
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

export default function CondicionTrabajadorComponent() {
  const auth = useAuthAxios();

  const [lista, setLista] = useState([]);
  const [situaciones, setSituaciones] = useState([]);

  // Filtros
  const [filterId, setFilterId] = useState("");
  const [filterText, setFilterText] = useState("");

  const [form, setForm] = useState({
    PKID: null,
    IDCondicionTrabajador: "",
    CondicionTrabajador: "",
    PKIDSituacionRegistro: "",
    LetraCondicionTrabajador: "",
  });

  const isEditing = form.PKID !== null;
  const [loading, setLoading] = useState(false);

  // Combos
  const loadCombos = async () => {
    try {
      setLoading(true);
      const res = await auth.get("/condicion-trabajador-combos/situacion");
      setSituaciones(res.data || []);
    } catch (err) {
      console.error("Error cargando combos:", err);
      alert("No se pudieron cargar las situaciones de registro.");
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await auth.get("/condicion-trabajador/");
      setLista(res.data || []);
    } catch (err) {
      console.error("Error listando condiciones de trabajador:", err);
      alert("No se pudo listar las condiciones de trabajador.");
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
      IDCondicionTrabajador: "",
      CondicionTrabajador: "",
      PKIDSituacionRegistro: "",
      LetraCondicionTrabajador: "",
    });
  };

  const handleEdit = (row) => {
    setForm({
      PKID: row.PKID,
      IDCondicionTrabajador: row.IDCondicionTrabajador,
      CondicionTrabajador: row.CondicionTrabajador,
      PKIDSituacionRegistro: row.PKIDSituacionRegistro,
      LetraCondicionTrabajador: row.LetraCondicionTrabajador,
    });
  };

  const handleDelete = async (PKID) => {
    if (!window.confirm("¿Eliminar Condición de Trabajador?")) return;
    try {
      setLoading(true);
      await auth.delete(`/condicion-trabajador/${PKID}`);
      await fetchData();
    } catch (err) {
      console.error("Error eliminando:", err);
      alert("No se pudo eliminar.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSave = async () => {
    if (
      !form.IDCondicionTrabajador ||
      !form.CondicionTrabajador ||
      !form.PKIDSituacionRegistro ||
      !form.LetraCondicionTrabajador
    ) {
      alert("Complete todos los campos requeridos: ID, Condición, Situación y Letra.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        IDCondicionTrabajador: Number(form.IDCondicionTrabajador),
        CondicionTrabajador: form.CondicionTrabajador.trim(),
        PKIDSituacionRegistro: Number(form.PKIDSituacionRegistro),
        LetraCondicionTrabajador: form.LetraCondicionTrabajador.trim(),
      };

      if (isEditing) {
        await auth.put(`/condicion-trabajador/${form.PKID}`, { ...payload, PKID: form.PKID });
        alert("Condición de trabajador actualizada.");
      } else {
        await auth.post(`/condicion-trabajador/`, payload);
        alert("Condición de trabajador creada.");
      }
      await fetchData();
      handleNew();
    } catch (err) {
      console.error("Error guardando:", err);
      const detail = err?.response?.data?.detail || err.message || "Error desconocido";
      alert(`No se pudo guardar.\nDetalle: ${detail}`);
    } finally {
      setLoading(false);
    }
  };

  // Filtrado en memoria
  const filteredList = useMemo(() => {
    const id = (filterId || "").trim();
    const txt = (filterText || "").trim().toLowerCase();
    return (lista || []).filter((r) => {
      const okId = id ? String(r.IDCondicionTrabajador || "").includes(id) : true;
      const okTxt = txt ? String(r.CondicionTrabajador || "").toLowerCase().includes(txt) : true;
      return okId && okTxt;
    });
  }, [lista, filterId, filterText]);

  const clearFilters = () => {
    setFilterId("");
    setFilterText("");
  };

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ marginBottom: 16 }}>Condición de Trabajador</h2>

      {/* Formulario */}
      <div style={{ ...card, marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "#374151" }}>ID Condición *</label>
            <input
              type="number"
              name="IDCondicionTrabajador"
              value={form.IDCondicionTrabajador}
              onChange={handleChange}
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
            />
          </div>
          
          <div style={{ gridColumn: "span 2" }}>
            <label style={{ display: "block", fontSize: 12, color: "#374151" }}>Condición de Trabajador *</label>
            <input
              type="text"
              name="CondicionTrabajador"
              value={form.CondicionTrabajador}
              onChange={handleChange}
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
            />
          </div>
          
          <div>
            <label style={{ display: "block", fontSize: 12, color: "#374151" }}>Letra *</label>
            <input
              type="text"
              name="LetraCondicionTrabajador"
              value={form.LetraCondicionTrabajador}
              onChange={handleChange}
              maxLength={1}
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
            />
          </div>

          <div style={{ gridColumn: "span 4" }}>
            <label style={{ display: "block", fontSize: 12, color: "#374151" }}>Situación de Registro *</label>
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
            <label style={{ display: "block", fontSize: 12, color: "#374151" }}>Filtrar por ID</label>
            <input
              type="text"
              value={filterId}
              onChange={(e) => setFilterId(e.target.value)}
              placeholder="Ej: 1001"
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
            />
          </div>
          <div style={{ minWidth: 240, flex: 1 }}>
            <label style={{ display: "block", fontSize: 12, color: "#374151" }}>Filtrar por Condición</label>
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Ej: CONTRATADO"
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
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Condición</th>
                <th style={{ textAlign: "center", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Letra</th>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Situación</th>
                <th style={{ textAlign: "center", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map((r) => (
                <tr key={r.PKID}>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{r.IDCondicionTrabajador}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{r.CondicionTrabajador}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6", textAlign: "center" }}>{r.LetraCondicionTrabajador}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{r.SituacionRegistro}</td>
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
                  <td colSpan="5" style={{ textAlign: "center", padding: 16, color: "#6b7280" }}>
                    No hay condiciones de trabajador para los filtros ingresados.
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