import React, { useEffect, useState } from 'react';
import axios from 'axios';
import API_BASE_URL from '../api';

function SituacionTrabajadorComponent() {
  const [lista, setLista] = useState([]);
  const [form, setForm] = useState({
    IDSituacionTrabajador: '',
    SituacionTrabajador: '',
    PKIDSituacionRegistro: ''
  });
  const [editandoId, setEditandoId] = useState(null);
  const token = localStorage.getItem('token');

  const headers = {
    Authorization: `Bearer ${token}`
  };

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/situacion_trabajador/`, { headers });
      setLista(res.data);
    } catch (error) {
      console.error('Error al obtener los datos:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async () => {
    const payload = {
      IDSituacionTrabajador: parseInt(form.IDSituacionTrabajador),
      SituacionTrabajador: form.SituacionTrabajador,
      PKIDSituacionRegistro: parseInt(form.PKIDSituacionRegistro)
    };

    try {
      if (editandoId === null) {
        await axios.post(`${API_BASE_URL}/situacion_trabajador/`, payload, { headers });
      } else {
        await axios.put(`${API_BASE_URL}/situacion_trabajador/${editandoId}`, payload, { headers });
        setEditandoId(null);
      }
      setForm({ IDSituacionTrabajador: '', SituacionTrabajador: '', PKIDSituacionRegistro: '' });
      fetchData();
    } catch (error) {
      alert("❌ Error al guardar: " + error?.response?.data?.detail);
      console.error(error);
    }
  };

  const handleEdit = (item) => {
    setEditandoId(item.PKID);
    setForm({
      IDSituacionTrabajador: item.IDSituacionTrabajador,
      SituacionTrabajador: item.SituacionTrabajador,
      PKIDSituacionRegistro: item.PKIDSituacionRegistro
    });
  };

  const handleDelete = async (pkid) => {
    if (!window.confirm("¿Deseas eliminar este registro?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/situacion_trabajador/${pkid}`, { headers });
      fetchData();
    } catch (error) {
      alert("❌ Error al eliminar");
      console.error(error);
    }
  };

  return (
    <div style={{ marginTop: '40px' }}>
      <h2>Mantenimiento: Situación Trabajador</h2>

      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          name="IDSituacionTrabajador"
          placeholder="ID Situación Trabajador"
          value={form.IDSituacionTrabajador}
          onChange={handleChange}
        />
        <input
          type="text"
          name="SituacionTrabajador"
          placeholder="Descripción"
          value={form.SituacionTrabajador}
          onChange={handleChange}
        />
        <input
          type="text"
          name="PKIDSituacionRegistro"
          placeholder="PKID Situación Registro"
          value={form.PKIDSituacionRegistro}
          onChange={handleChange}
        />
        <button onClick={handleSubmit}>
          {editandoId ? 'Actualizar' : 'Crear'}
        </button>
      </div>

      <table border="1" cellPadding="6" style={{ fontSize: '13px', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>PKID</th>
            <th>ID Situación Trabajador</th>
            <th>Descripción</th>
            <th>PKID Situación Registro</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {lista.map((item) => (
            <tr key={item.PKID}>
              <td>{item.PKID}</td>
              <td>{item.IDSituacionTrabajador}</td>
              <td>{item.SituacionTrabajador}</td>
              <td>{item.PKIDSituacionRegistro}</td>
              <td>
                <button onClick={() => handleEdit(item)}>✏️Editar</button>
                <button onClick={() => handleDelete(item.PKID)}>🗑️Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default SituacionTrabajadorComponent;
