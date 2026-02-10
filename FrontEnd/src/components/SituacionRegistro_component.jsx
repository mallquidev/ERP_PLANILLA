import React, { useEffect, useState } from "react";
import axios from "axios";
import API_BASE_URL from '../api';

function SituacionRegistroComponent() {
  const [situaciones, setSituaciones] = useState([]);
  const [form, setForm] = useState({ IDSituacionRegistro: "", SituacionRegistro: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");

  const axiosConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  useEffect(() => {
    fetchSituaciones();
  }, []);

  const fetchSituaciones = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/situacion/`, axiosConfig);
      setSituaciones(res.data);
    } catch (error) {
      console.error("Error al listar situaciones:", error);
      alert("⚠️ Error al cargar las situaciones.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    const id = parseInt(form.IDSituacionRegistro);
    if (isNaN(id) || !form.SituacionRegistro.trim()) {
      alert("Todos los campos son obligatorios y el ID debe ser numérico.");
      return;
    }

    try {
      setLoading(true);
      if (isEditing) {
        await axios.put(`${API_BASE_URL}/situacion/${id}`, form, axiosConfig);
        alert("✅ Situación actualizada");
      } else {
        await axios.post(`${API_BASE_URL}/situacion/`, form, axiosConfig);
        alert("✅ Situación registrada");
      }
      setForm({ IDSituacionRegistro: "", SituacionRegistro: "" });
      setIsEditing(false);
      fetchSituaciones();
    } catch (error) {
      console.error("❌ Error en el mantenimiento:", error);
      alert("❌ Error al guardar los datos.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (situacion) => {
    setForm(situacion);
    setIsEditing(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar esta situación?")) return;
    try {
      setLoading(true);
      await axios.delete(`${API_BASE_URL}/situacion/${id}`, axiosConfig);
      alert("🗑️ Situación eliminada");
      fetchSituaciones();
    } catch (error) {
      console.error("❌ Error al eliminar:", error);
      alert("❌ No se pudo eliminar la situación.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", fontSize: "14px" }}>
      <h2>{isEditing ? "Editar Situación" : "Registrar Nueva Situación"}</h2>
      <div>
        <label>IDSituacionRegistro: </label>
        <input
          type="number"
          name="IDSituacionRegistro"
          value={form.IDSituacionRegistro}
          onChange={handleChange}
          disabled={isEditing}
        />
      </div>
      <div>
        <label>SituacionRegistro: </label>
        <input
          type="text"
          name="SituacionRegistro"
          value={form.SituacionRegistro}
          onChange={handleChange}
        />
      </div>
      <button onClick={handleSubmit} disabled={loading}>
        {loading ? "Procesando..." : isEditing ? "Actualizar" : "Crear"}
      </button>
      {isEditing && (
        <button onClick={() => {
          setForm({ IDSituacionRegistro: "", SituacionRegistro: "" });
          setIsEditing(false);
        }}>
          Cancelar
        </button>
      )}

      <h3 style={{ marginTop: "30px" }}>Listado de Situaciones</h3>
      {loading ? (
        <p>Cargando...</p>
      ) : (
        <table border="1" cellPadding="5" style={{ fontSize: "13px" }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Descripción</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {situaciones.map((s) => (
              <tr key={s.IDSituacionRegistro}>
                <td>{s.IDSituacionRegistro}</td>
                <td>{s.SituacionRegistro}</td>
                <td>
                  <button onClick={() => handleEdit(s)}>✏️ Editar</button>
                  <button onClick={() => handleDelete(s.IDSituacionRegistro)}>🗑️ Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default SituacionRegistroComponent;
