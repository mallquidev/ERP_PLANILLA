//src/components/CategoriaTrabajadorComponent.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import API_BASE_URL from "../api";

export default function CategoriaTrabajadorComponent() {
  const [lista, setLista] = useState([]);
  const [situaciones, setSituaciones] = useState([]);
  const [form, setForm] = useState({
    IDCategoriaTrabajador: "",
    CategoriaTrabajador: "",
    PKIDSituacionRegistro: ""
  });
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");
  const auth = { headers: { Authorization: `Bearer ${token}` } };

  const loadSituaciones = async () => {
    try {
      // Puedes reutilizar el endpoint de área si ya lo tienes:
      // const res = await axios.get(`${API_BASE_URL}/area-combos/situaciones`, auth);
      // O usar el dedicado a esta pantalla:
      const res = await axios.get(`${API_BASE_URL}/categoria-trabajador-combos/situaciones`, auth);
      setSituaciones(res.data || []);
    } catch (e) {
      console.error("Error cargando situaciones:", e);
      alert("No se pudieron cargar las situaciones.");
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/categoria-trabajador/`, auth);
      setLista(res.data || []);
    } catch (e) {
      console.error("Error cargando categorías:", e);
      alert("No se pudieron listar las categorías de trabajador.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSituaciones();
    loadData();
    // eslint-disable-next-line
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const limpiar = () => {
    setForm({
      IDCategoriaTrabajador: "",
      CategoriaTrabajador: "",
      PKIDSituacionRegistro: ""
    });
    setEditId(null);
  };

  const guardar = async () => {
    const payload = {
      IDCategoriaTrabajador: parseInt(form.IDCategoriaTrabajador, 10),
      CategoriaTrabajador: (form.CategoriaTrabajador || "").trim(),
      PKIDSituacionRegistro: parseInt(form.PKIDSituacionRegistro || "0", 10)
    };

    if (!payload.IDCategoriaTrabajador || !payload.CategoriaTrabajador || !payload.PKIDSituacionRegistro) {
      alert("Complete: ID, Categoría y Situación.");
      return;
    }

    try {
      setLoading(true);
      if (editId) {
        await axios.put(`${API_BASE_URL}/categoria-trabajador/${editId}`, payload, auth);
        alert("✅ Categoría actualizada");
      } else {
        await axios.post(`${API_BASE_URL}/categoria-trabajador/`, payload, auth);
        alert("✅ Categoría creada");
      }
      limpiar();
      await loadData();
    } catch (err) {
      console.error("❌ Error guardando categoría:", err);
      const detail = err?.response?.data?.detail || err?.message || "Error desconocido";
      alert(`No se pudo guardar la categoría.\nDetalle: ${detail}`);
    } finally {
      setLoading(false);
    }
  };

  const editar = (row) => {
    setEditId(row.PKID);
    setForm({
      IDCategoriaTrabajador: row.IDCategoriaTrabajador,
      CategoriaTrabajador: row.CategoriaTrabajador,
      PKIDSituacionRegistro: row.PKIDSituacionRegistro
    });
  };

  const eliminar = async (pkid) => {
    if (!window.confirm("¿Eliminar la categoría?")) return;
    try {
      setLoading(true);
      await axios.delete(`${API_BASE_URL}/categoria-trabajador/${pkid}`, auth);
      alert("🗑️ Eliminado");
      await loadData();
    } catch (err) {
      console.error("❌ Error eliminando:", err);
      const detail = err?.response?.data?.detail || err?.message || "Error desconocido";
      alert(`No se pudo eliminar.\nDetalle: ${detail}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Categoría de Trabajador</h2>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 2fr 1fr", gap: 8, maxWidth: 900 }}>
        <label>ID Categoría</label>
        <input
          type="number"
          name="IDCategoriaTrabajador"
          value={form.IDCategoriaTrabajador}
          onChange={handleChange}
          disabled={!!editId}
        />

        <label>Categoría</label>
        <input
          type="text"
          name="CategoriaTrabajador"
          value={form.CategoriaTrabajador}
          onChange={handleChange}
        />

        <label>Situación</label>
        <select
          name="PKIDSituacionRegistro"
          value={form.PKIDSituacionRegistro}
          onChange={handleChange}
        >
          <option value="">--Seleccione--</option>
          {situaciones.map((s) => (
            <option key={s.PKID} value={s.PKID}>
              {s.SituacionRegistro}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginTop: 10 }}>
        <button onClick={guardar} disabled={loading}>
          {loading ? "Procesando..." : editId ? "Actualizar" : "Crear"}
        </button>
        <button style={{ marginLeft: 8 }} onClick={limpiar} disabled={loading}>
          Limpiar
        </button>
      </div>

      <h3 style={{ marginTop: 24 }}>Listado</h3>
      {loading ? (
        <p>Cargando…</p>
      ) : (
        <table border="1" cellPadding="6" style={{ fontSize: 13, borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Categoría</th>
              <th>Situación</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((r) => (
              <tr key={r.PKID}>
                <td>{r.IDCategoriaTrabajador}</td>
                <td>{r.CategoriaTrabajador}</td>
                <td>{r.SituacionRegistro || r.PKIDSituacionRegistro}</td>
                <td>
                  <button onClick={() => editar(r)} title="Editar">✏️</button>
                  <button onClick={() => eliminar(r.PKID)} title="Eliminar" style={{ marginLeft: 6 }}>🗑️</button>
                </td>
              </tr>
            ))}
            {lista.length === 0 && (
              <tr><td colSpan="4">Sin datos</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
