import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import API_BASE_URL from '../api';
import { useGlobal } from '../GlobalContext';

const authHeaders = () => {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

function AreaComponent() {
  const { empresaId } = useGlobal();
  const [items, setItems] = useState([]);
  const [situaciones, setSituaciones] = useState([]);

  const [form, setForm] = useState({
    PKIDEmpresa: 0,
    IDArea: '',
    Area: '',
    AreaAbreviado: '',
    PKIDSituacionRegistro: ''
  });

  const [editPkid, setEditPkid] = useState(null);
  const [loading, setLoading] = useState(false);

  // Formatear opciones de situación
  const situacionOptions = useMemo(
    () =>
      (situaciones || []).map(s => ({
        value: s.PKID,
        label: s.SituacionRegistro
      })),
    [situaciones]
  );

  const loadSituaciones = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/area-combos/situacion`, { headers: authHeaders() });
      //const res = await axios.get(`${API_BASE_URL}/empresa-combos/situacion`, {
      //  headers: authHeaders()
      //});
      setSituaciones(res.data || []);
    } catch (err) {
      console.error('Error cargando situaciones:', err);
      alert('No se pudieron cargar las situaciones');
    }
  };

  const loadAreas = async () => {
    if (!empresaId) {
      setItems([]);
      return;
    }
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/area`, {
        params: { PKIDEmpresa: empresaId },
        headers: authHeaders()
      });
      setItems(res.data || []);
    } catch (err) {
      console.error('Error listando áreas:', err);
      alert('No se pudo listar Áreas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // inicializar PKIDEmpresa en el form
    setForm(f => ({ ...f, PKIDEmpresa: Number(empresaId || 0) }));
  }, [empresaId]);

  useEffect(() => {
    loadSituaciones();
  }, []);

  useEffect(() => {
    loadAreas();
  }, [empresaId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async () => {
    // Validación
    if (!empresaId) {
      alert('Seleccione una empresa en el contexto.');
      return;
    }
    if (!form.IDArea || isNaN(Number(form.IDArea))) {
      alert('IDArea debe ser numérico');
      return;
    }
    if (!form.Area?.trim()) {
      alert('El nombre de Área es obligatorio');
      return;
    }
    if (!form.AreaAbreviado?.trim()) {
      alert('El Área Abreviado es obligatorio');
      return;
    }
    if (!form.PKIDSituacionRegistro) {
      alert('Seleccione Situación');
      return;
    }

    const payload = {
      PKIDEmpresa: Number(empresaId),
      IDArea: Number(form.IDArea),
      Area: form.Area.trim(),
      AreaAbreviado: form.AreaAbreviado.trim(),
      PKIDSituacionRegistro: Number(form.PKIDSituacionRegistro),
    };

    try {
      setLoading(true);
      if (editPkid) {
        await axios.put(`${API_BASE_URL}/area/${editPkid}`, payload, {
          headers: authHeaders()
        });
        alert('Área actualizada');
      } else {
        await axios.post(`${API_BASE_URL}/area/`, payload, {
          headers: authHeaders()
        });
        alert('Área registrada');
      }
      // limpiar
      setForm({
        PKIDEmpresa: Number(empresaId),
        IDArea: '',
        Area: '',
        AreaAbreviado: '',
        PKIDSituacionRegistro: ''
      });
      setEditPkid(null);
      // recargar
      loadAreas();
    } catch (err) {
      console.error('❌ Error guardando Área:', err);
      const detail = err?.response?.data?.detail || err?.message || 'Error desconocido';
      alert(`No se pudo guardar el Área.\nDetalle: ${detail}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (row) => {
    setEditPkid(row.PKID);
    setForm({
      PKIDEmpresa: Number(row.PKIDEmpresa),
      IDArea: row.IDArea,
      Area: row.Area,
      AreaAbreviado: row.AreaAbreviado,
      PKIDSituacionRegistro: row.PKIDSituacionRegistro
    });
  };

  const handleDelete = async (pkid) => {
    if (!window.confirm('¿Desea eliminar esta Área?')) return;
    try {
      setLoading(true);
      await axios.delete(`${API_BASE_URL}/area/${pkid}`, { headers: authHeaders() });
      loadAreas();
    } catch (err) {
      console.error('❌ Error al eliminar Área:', err);
      alert('No se pudo eliminar el registro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Mantenimiento: Área</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '200px 200px 200px 220px auto', gap: 10, marginBottom: 10 }}>
        <div>
          <label>Empresa (contexto)</label>
          <input type="number" value={empresaId || ''} disabled />
        </div>

        <div>
          <label>ID Área</label>
          <input
            name="IDArea"
            type="number"
            value={form.IDArea}
            onChange={handleChange}
            placeholder="Código de Área"
          />
        </div>

        <div>
          <label>Área</label>
          <input
            name="Area"
            type="text"
            value={form.Area}
            onChange={handleChange}
            placeholder="Nombre"
          />
        </div>

        <div>
          <label>Abreviado</label>
          <input
            name="AreaAbreviado"
            type="text"
            maxLength={10}
            value={form.AreaAbreviado}
            onChange={handleChange}
            placeholder="Abrev. (máx 10)"
          />
        </div>

        <div>
          <label>Situación </label>
          <select
            name="PKIDSituacionRegistro"
            value={form.PKIDSituacionRegistro}
            onChange={handleChange}
          >
            <option value="">-- Seleccione --</option>
            {situacionOptions.map(op => (
              <option key={op.value} value={op.value}>{op.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ marginBottom: 15 }}>
        <button onClick={handleSubmit} disabled={loading}>
          {loading ? 'Procesando...' : (editPkid ? 'Actualizar' : 'Agregar')}
        </button>
        {editPkid && (
          <button
            style={{ marginLeft: 10 }}
            onClick={() => {
              setEditPkid(null);
              setForm({
                PKIDEmpresa: Number(empresaId || 0),
                IDArea: '',
                Area: '',
                AreaAbreviado: '',
                PKIDSituacionRegistro: ''
              });
            }}
          >
            Cancelar
          </button>
        )}
      </div>

      <h3>Listado</h3>
      {loading ? (
        <p>Cargando...</p>
      ) : (
        <table border="1" cellPadding="6" style={{ fontSize: 13, borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>PKID</th>
              <th>ID Área</th>
              <th>Área</th>
              <th>Abreviado</th>
              <th>Situación</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map(row => (
              <tr key={row.PKID}>
                <td>{row.PKID}</td>
                <td>{row.IDArea}</td>
                <td>{row.Area}</td>
                <td>{row.AreaAbreviado}</td>
                <td>{row.SituacionRegistro || row.PKIDSituacionRegistro}</td>
                <td>
                  <button onClick={() => handleEdit(row)} title="Editar">✏️</button>{' '}
                  <button onClick={() => handleDelete(row.PKID)} title="Eliminar">🗑️</button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center' }}>No hay áreas registradas</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AreaComponent;
