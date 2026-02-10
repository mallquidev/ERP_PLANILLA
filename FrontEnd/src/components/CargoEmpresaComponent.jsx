//CargoEmpresaComponent.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import API_BASE_URL from "../api";
import { useGlobal } from "../GlobalContext";

const axiosCfg = (token) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export default function CargoEmpresaComponent() {
  const token = localStorage.getItem("token");
  const { empresaId } = useGlobal();

  const [situaciones, setSituaciones] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const emptyForm = useMemo(
    () => ({
      IDCargoEmpresa: "",
      PKIDEmpresa: empresaId || 0,
      CargoEmpresa: "",
      PKIDSituacionRegistro: "",
    }),
    [empresaId]
  );

  const [form, setForm] = useState(emptyForm);
  const [editingPkid, setEditingPkid] = useState(null);

  useEffect(() => {
    if (!token) return;
    loadCombos();
  }, [token]);

  useEffect(() => {
    // cada vez que cambie empresa, recarga lista y resetea form
    if (!token || !empresaId) return;
    setForm((prev) => ({ ...prev, PKIDEmpresa: empresaId }));
    loadList();
  }, [token, empresaId]);

  const loadCombos = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/cargo-combos/situaciones`, axiosCfg(token));
      setSituaciones(res.data || []);
    } catch (err) {
      console.error("❌ Error cargando combo de Situaciones:", err);
      alert("No fue posible cargar el combo de Situación.");
    }
  };

  const loadList = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_BASE_URL}/cargo-empresa/?PKIDEmpresa=${empresaId}`,
        axiosCfg(token)
      );
      setItems(res.data || []);
    } catch (err) {
      console.error("❌ Error listando cargos:", err);
      alert("No fue posible cargar los cargos.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    // numéricos:
    if (["IDCargoEmpresa", "PKIDEmpresa", "PKIDSituacionRegistro"].includes(name)) {
      setForm((f) => ({ ...f, [name]: value === "" ? "" : Number(value) }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const validate = () => {
    if (!form.PKIDEmpresa) return "Empresa es obligatoria.";
    if (!form.IDCargoEmpresa) return "IDCargoEmpresa es obligatorio.";
    if (!form.CargoEmpresa?.trim()) return "CargoEmpresa es obligatorio.";
    if (!form.PKIDSituacionRegistro) return "Situación es obligatoria.";
    return null;
    // La combinación (IDCargoEmpresa, PKIDEmpresa) es única a nivel BD.
  };

  const handleSave = async () => {
    const err = validate();
    if (err) {
      alert(err);
      return;
    }
    try {
      const payload = {
        IDCargoEmpresa: Number(form.IDCargoEmpresa),
        PKIDEmpresa: Number(form.PKIDEmpresa), // del contexto, bloqueado
        CargoEmpresa: form.CargoEmpresa.trim(),
        PKIDSituacionRegistro: Number(form.PKIDSituacionRegistro),
      };

      if (editingPkid) {
        await axios.put(`${API_BASE_URL}/cargo-empresa/${editingPkid}`, payload, axiosCfg(token));
        alert("✅ Cargo actualizado");
      } else {
        await axios.post(`${API_BASE_URL}/cargo-empresa/`, payload, axiosCfg(token));
        alert("✅ Cargo creado");
      }
      setForm(emptyForm);
      setEditingPkid(null);
      loadList();
    } catch (err) {
      console.error("❌ Error guardando cargo:", err);
      const detail = err?.response?.data?.detail || err?.message || "Error desconocido";
      alert(`No se pudo guardar el cargo.\nDetalle: ${detail}`);
    }
  };

  const handleEdit = (row) => {
    setEditingPkid(row.PKID);
    setForm({
      IDCargoEmpresa: row.IDCargoEmpresa,
      PKIDEmpresa: row.PKIDEmpresa, // bloqueado
      CargoEmpresa: row.CargoEmpresa,
      PKIDSituacionRegistro: row.PKIDSituacionRegistro,
    });
  };

  const handleDelete = async (pkid) => {
    if (!window.confirm("¿Eliminar este cargo?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/cargo-empresa/${pkid}`, axiosCfg(token));
      alert("🗑️ Cargo eliminado");
      loadList();
    } catch (err) {
      console.error("❌ Error eliminando cargo:", err);
      const detail = err?.response?.data?.detail || err?.message || "Error desconocido";
      alert(`No se pudo eliminar el cargo.\nDetalle: ${detail}`);
    }
  };

  const handleCancel = () => {
    setForm(emptyForm);
    setEditingPkid(null);
  };

  return (
    <div style={{ padding: 16, fontSize: 14 }}>
      <h2>Cargo de Empresa</h2>

      <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 12, maxWidth: 700 }}>
        <label>Empresa (del contexto):</label>
        <input type="number" name="PKIDEmpresa" value={form.PKIDEmpresa} disabled />

        <label>ID Cargo Empresa:</label>
        <input
          type="number"
          name="IDCargoEmpresa"
          value={form.IDCargoEmpresa}
          onChange={handleChange}
        />

        <label>Descripción:</label>
        <input
          type="text"
          name="CargoEmpresa"
          value={form.CargoEmpresa}
          onChange={handleChange}
        />

        <label>Situación:</label>
        <select
          name="PKIDSituacionRegistro"
          value={form.PKIDSituacionRegistro}
          onChange={handleChange}
        >
          <option value="">-- Seleccione --</option>
          {situaciones.map((s) => (
            <option key={s.PKID} value={s.PKID}>
              {s.SituacionRegistro}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginTop: 12 }}>
        <button onClick={handleSave} style={{ marginRight: 8 }}>
          {editingPkid ? "Actualizar" : "Crear"}
        </button>
        {editingPkid && (
          <button onClick={handleCancel} style={{ background: "#eee" }}>
            Cancelar
          </button>
        )}
      </div>

      <h3 style={{ marginTop: 24 }}>Listado</h3>
      {loading ? (
        <p>Cargando...</p>
      ) : (
        <table border="1" cellPadding="5" style={{ fontSize: 13, width: "100%", maxWidth: 900 }}>
          <thead>
            <tr>
              <th>PKID</th>
              <th>ID</th>
              <th>Empresa</th>
              <th>Descripción</th>
              <th>Situación</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {(items || []).map((r) => (
              <tr key={r.PKID}>
                <td>{r.PKID}</td>
                <td>{r.IDCargoEmpresa}</td>
                <td>{r.PKIDEmpresa}</td>
                <td>{r.CargoEmpresa}</td>
                <td>{r.SituacionRegistro || r.PKIDSituacionRegistro}</td>
                <td>
                  <button onClick={() => handleEdit(r)} style={{ marginRight: 8 }}>✏️</button>
                  <button onClick={() => handleDelete(r.PKID)}>🗑️</button>
                </td>
              </tr>
            ))}
            {(!items || items.length === 0) && (
              <tr>
                <td colSpan="6" style={{ textAlign: "center" }}>
                  Sin registros
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
