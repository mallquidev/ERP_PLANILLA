/*D:\payroll_project_3\frontend\src\components\CentroCostoComponent.jsx*/
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
};

export default function CentroCostoComponent() {
  const auth = useAuthAxios();
  const { empresaId } = useGlobal();

  const [lista, setLista] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [situaciones, setSituaciones] = useState([]);

  const [form, setForm] = useState({
    PKID: null,
    PKIDEmpresa: empresaId || 0,
    IDCentroCosto: "",
    CentroCosto: "",
    PKIDSituacionRegistro: 0,
  });

  const isEditing = form.PKID !== null;
  const [loading, setLoading] = useState(false);

  // Combos
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [empRes, sitRes] = await Promise.all([
          auth.get("/cc-combos/empresas"),
          auth.get("/cc-combos/situaciones"),
        ]);
        setEmpresas(empRes.data || []);
        setSituaciones(sitRes.data || []);
      } catch (err) {
        console.error("Error cargando combos CC:", err);
        alert("No se pudieron cargar los combos para Centro de Costo.");
      } finally {
        setLoading(false);
      }
    })();
  }, [auth]);

  // Sincronizar empresa de contexto en el formulario
  useEffect(() => {
    setForm((f) => ({ ...f, PKIDEmpresa: empresaId || 0 }));
  }, [empresaId]);

  // Listar por empresa
  const fetchData = async () => {
    if (!empresaId) return;
    try {
      setLoading(true);
      const res = await auth.get("/centro-costo", {
        params: { PKIDEmpresa: empresaId },
      });
      setLista(res.data || []);
    } catch (err) {
      console.error("Error listando Centros de Costo:", err);
      alert("No se pudo listar Centros de Costo.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [empresaId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleNew = () => {
    setForm({
      PKID: null,
      PKIDEmpresa: empresaId || 0,
      IDCentroCosto: "",
      CentroCosto: "",
      PKIDSituacionRegistro: 0,
    });
  };

  const handleEdit = (row) => {
    setForm({
      PKID: row.PKID,
      PKIDEmpresa: row.PKIDEmpresa,
      IDCentroCosto: row.IDCentroCosto,
      CentroCosto: row.CentroCosto,
      PKIDSituacionRegistro: row.PKIDSituacionRegistro,
    });
  };

  const handleDelete = async (PKID) => {
    if (!window.confirm("¿Eliminar Centro de Costo?")) return;
    try {
      setLoading(true);
      await auth.delete(`/centro-costo/${PKID}`);
      await fetchData();
    } catch (err) {
      console.error("Error eliminando CC:", err);
      alert("No se pudo eliminar.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.PKIDEmpresa || !form.IDCentroCosto || !form.CentroCosto || !form.PKIDSituacionRegistro) {
      alert("Complete Empresa, ID y Situación.");
      return;
    }
    try {
      setLoading(true);
      if (isEditing) {
        const payload = {
          PKID: form.PKID,
          IDCentroCosto: Number(form.IDCentroCosto),
          CentroCosto: form.CentroCosto,
          PKIDSituacionRegistro: Number(form.PKIDSituacionRegistro),
        };
        await auth.put(`/centro-costo/${form.PKID}`, payload);
        alert("Centro de Costo actualizado.");
      } else {
        const payload = {
          PKIDEmpresa: Number(form.PKIDEmpresa),
          IDCentroCosto: Number(form.IDCentroCosto),
          CentroCosto: form.CentroCosto,
          PKIDSituacionRegistro: Number(form.PKIDSituacionRegistro),
        };
        await auth.post("/centro-costo/", payload);
        alert("Centro de Costo creado.");
      }
      await fetchData();
      handleNew();
    } catch (err) {
      console.error("Error guardando CC:", err);
      const detail = err?.response?.data?.detail || err.message || "Error desconocido";
      alert(`No se pudo guardar.\nDetalle: ${detail}`);
    } finally {
      setLoading(false);
    }
  };

  const getEmpresaNombre = (pkid) => {
    const e = empresas.find((x) => Number(x.PKID) === Number(pkid));
    return e ? e.RazonSocial : "";
  };

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ marginBottom: 16 }}>Centro de Costo</h2>

      {/* Formulario */}
      <div style={{ ...card, marginBottom: 16 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 12,
            alignItems: "end",
          }}
        >
          <div>
            <label style={{ display: "block", fontSize: 12, color: "#374151" }}>Empresa</label>
            {/* Combo renderizado pero deshabilitado (contexto) */}
            <select
              name="PKIDEmpresa"
              value={form.PKIDEmpresa || 0}
              onChange={handleChange}
              disabled
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
            >
              <option value={0}>-- Seleccionar --</option>
              {empresas.map((e) => (
                <option key={e.PKID} value={e.PKID}>
                  {e.RazonSocial}
                </option>
              ))}
            </select>
            <small style={{ color: "#6b7280" }}>
              (Bloqueado por contexto: {getEmpresaNombre(form.PKIDEmpresa)})
            </small>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, color: "#374151" }}>ID Centro Costo</label>
            <input
              type="number"
              name="IDCentroCosto"
              value={form.IDCentroCosto}
              onChange={handleChange}
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
            />
          </div>

          <div style={{ gridColumn: "span 2" }}>
            <label style={{ display: "block", fontSize: 12, color: "#374151" }}>Centro Costo</label>
            <input
              type="text"
              name="CentroCosto"
              value={form.CentroCosto}
              onChange={handleChange}
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, color: "#374151" }}>Situación</label>
            <select
              name="PKIDSituacionRegistro"
              value={form.PKIDSituacionRegistro || 0}
              onChange={handleChange}
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
            >
              <option value={0}>-- Seleccionar --</option>
              {situaciones.map((s) => (
                <option key={s.PKID} value={s.PKID}>
                  {s.SituacionRegistro}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleSave}
              disabled={loading}
              style={{ ...btn.base, ...(btn.primary), width: "100%" }}
            >
              {isEditing ? "Actualizar" : "Agregar"}
            </button>
            <button
              onClick={handleNew}
              disabled={loading}
              style={{ ...btn.base, ...(btn.neutral), width: "100%" }}
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Lista */}
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <strong>Listado</strong>
          <span style={{ fontSize: 12, color: "#6b7280" }}>
            Empresa: {getEmpresaNombre(empresaId)}
          </span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f9fafb" }}>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>ID</th>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Centro Costo</th>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Situación</th>
                <th style={{ textAlign: "center", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((r) => (
                <tr key={r.PKID}>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{r.IDCentroCosto}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{r.CentroCosto}</td>
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
              {lista.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ textAlign: "center", padding: 16, color: "#6b7280" }}>
                    No hay centros de costo para la empresa seleccionada.
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
