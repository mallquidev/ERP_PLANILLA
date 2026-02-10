/*frontend/src/components/CategoriaTrabajadorReintegroComponent.jsx*/
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

export default function CategoriaTrabajadorReintegroComponent() {
  const authAxios = useAuthAxios();
  const { empresaId, nominaId, periodo } = useGlobal();

  const [lista, setLista] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [nominas, setNominas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [situaciones, setSituaciones] = useState([]);

  const [form, setForm] = useState({
    PKID: null,
    PKIDEmpresa: empresaId || 0,
    Ano: periodo?.ano || 0,
    Mes: periodo?.mes || 0,
    PKIDNomina: nominaId || 0,
    PKIDCategoriaTrabajador: 0,
    ImporteReintegro1: 0,
    ImporteReintegro2: 0,
    ImporteReintegro3: 0,
    ImporteReintegro4: 0,
    ImporteReintegro5: 0,
    ImporteReintegro6: 0,
    PKIDSituacionRegistro: 0,
  });

  const [loading, setLoading] = useState(false);
  const isEditing = form.PKID !== null;

  // Cargar combos
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [empRes, nomRes, catRes, sitRes] = await Promise.all([
          authAxios.get("/ctr-combos/empresas"),
          authAxios.get("/ctr-combos/nominas"),
          authAxios.get("/ctr-combos/categorias"),
          authAxios.get("/ctr-combos/situaciones"),
        ]);
        setEmpresas(empRes.data || []);
        setNominas(nomRes.data || []);
        setCategorias(catRes.data || []);
        setSituaciones(sitRes.data || []);
      } catch (err) {
        console.error("Error cargando combos CTR:", err);
        alert("No se pudieron cargar los combos.");
      } finally {
        setLoading(false);
      }
    })();
  }, [authAxios]);

  // Sincronizar contexto al formulario (no editable esos campos)
  useEffect(() => {
    setForm((f) => ({
      ...f,
      PKIDEmpresa: empresaId || 0,
      Ano: periodo?.ano || 0,
      Mes: periodo?.mes || 0,
      PKIDNomina: nominaId || 0,
    }));
  }, [empresaId, nominaId, periodo]);

  // Listar (filtrado por contexto)
  const fetchData = async () => {
    if (!empresaId || !nominaId || !periodo?.ano || !periodo?.mes) return;
    try {
      setLoading(true);
      const res = await authAxios.get("/ctr", {
        params: {
          PKIDEmpresa: empresaId,
          Ano: periodo.ano,
          Mes: periodo.mes,
          PKIDNomina: nominaId,
        },
      });
      setLista(res.data || []);
    } catch (err) {
      console.error("Error listando CTR:", err);
      alert("No se pudo listar los registros.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [empresaId, nominaId, periodo]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let v = value;
    if (name.startsWith("ImporteReintegro")) {
      v = value === "" ? "" : Number(value);
    }
    setForm((f) => ({ ...f, [name]: v }));
  };

  const handleNew = () => {
    setForm({
      PKID: null,
      PKIDEmpresa: empresaId || 0,
      Ano: periodo?.ano || 0,
      Mes: periodo?.mes || 0,
      PKIDNomina: nominaId || 0,
      PKIDCategoriaTrabajador: 0,
      ImporteReintegro1: 0,
      ImporteReintegro2: 0,
      ImporteReintegro3: 0,
      ImporteReintegro4: 0,
      ImporteReintegro5: 0,
      ImporteReintegro6: 0,
      PKIDSituacionRegistro: 0,
    });
  };

  const handleEdit = (row) => {
    setForm({
      PKID: row.PKID,
      PKIDEmpresa: row.PKIDEmpresa,
      Ano: row.Ano,
      Mes: row.Mes,
      PKIDNomina: row.PKIDNomina,
      PKIDCategoriaTrabajador: row.PKIDCategoriaTrabajador,
      ImporteReintegro1: row.ImporteReintegro1 ?? 0,
      ImporteReintegro2: row.ImporteReintegro2 ?? 0,
      ImporteReintegro3: row.ImporteReintegro3 ?? 0,
      ImporteReintegro4: row.ImporteReintegro4 ?? 0,
      ImporteReintegro5: row.ImporteReintegro5 ?? 0,
      ImporteReintegro6: row.ImporteReintegro6 ?? 0,
      PKIDSituacionRegistro: row.PKIDSituacionRegistro,
    });
  };

  const handleDelete = async (PKID) => {
    if (!window.confirm("¿Eliminar registro?")) return;
    try {
      setLoading(true);
      await authAxios.delete(`/ctr/${PKID}`);
      await fetchData();
    } catch (err) {
      console.error("Error eliminando:", err);
      alert("No se pudo eliminar el registro.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validaciones mínimas
    if (!form.PKIDCategoriaTrabajador || !form.PKIDSituacionRegistro) {
      alert("Complete Categoría Trabajador y Situación.");
      return;
    }
    try {
      setLoading(true);
      if (isEditing) {
        const payload = {
          PKID: form.PKID,
          PKIDCategoriaTrabajador: Number(form.PKIDCategoriaTrabajador),
          ImporteReintegro1: Number(form.ImporteReintegro1 || 0),
          ImporteReintegro2: Number(form.ImporteReintegro2 || 0),
          ImporteReintegro3: Number(form.ImporteReintegro3 || 0),
          ImporteReintegro4: Number(form.ImporteReintegro4 || 0),
          ImporteReintegro5: Number(form.ImporteReintegro5 || 0),
          ImporteReintegro6: Number(form.ImporteReintegro6 || 0),
          PKIDSituacionRegistro: Number(form.PKIDSituacionRegistro),
        };
        await authAxios.put(`/ctr/${form.PKID}`, payload);
        alert("Registro actualizado.");
      } else {
        const payload = {
          PKIDEmpresa: Number(form.PKIDEmpresa),
          Ano: Number(form.Ano),
          Mes: Number(form.Mes),
          PKIDNomina: Number(form.PKIDNomina),
          PKIDCategoriaTrabajador: Number(form.PKIDCategoriaTrabajador),
          ImporteReintegro1: Number(form.ImporteReintegro1 || 0),
          ImporteReintegro2: Number(form.ImporteReintegro2 || 0),
          ImporteReintegro3: Number(form.ImporteReintegro3 || 0),
          ImporteReintegro4: Number(form.ImporteReintegro4 || 0),
          ImporteReintegro5: Number(form.ImporteReintegro5 || 0),
          ImporteReintegro6: Number(form.ImporteReintegro6 || 0),
          PKIDSituacionRegistro: Number(form.PKIDSituacionRegistro),
        };
        await authAxios.post("/ctr/", payload);
        alert("Registro creado.");
      }
      await fetchData();
      handleNew();
    } catch (err) {
      console.error("Error guardando CTR:", err);
      const detail = err?.response?.data?.detail || err.message || "Error desconocido";
      alert(`No se pudo guardar.\n${detail}`);
    } finally {
      setLoading(false);
    }
  };

  const getNombre = (arr, pkid, nombreCampo) => {
    const found = arr.find((x) => Number(x.PKID) === Number(pkid));
    return found ? found[nombreCampo] : "";
    return "";
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Reintegros por Categoría de Trabajador</h2>

      {/* Filtros de contexto (solo lectura) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 12 }}>
        <div>
          <label>Empresa:</label>
          <input value={getNombre(empresas, form.PKIDEmpresa, "RazonSocial")} readOnly />
        </div>
        <div>
          <label>Nómina:</label>
          <input value={getNombre(nominas, form.PKIDNomina, "Nomina")} readOnly />
        </div>
        <div>
          <label>Año:</label>
          <input value={form.Ano} readOnly />
        </div>
        <div>
          <label>Mes:</label>
          <input value={form.Mes} readOnly />
        </div>
      </div>

      {/* Formulario */}
      <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          <div>
            <label>Categoría Trabajador:</label>
            <select
              name="PKIDCategoriaTrabajador"
              value={form.PKIDCategoriaTrabajador || 0}
              onChange={handleChange}
            >
              <option value={0}>-- Seleccione --</option>
              {categorias.map((c) => (
                <option key={c.PKID} value={c.PKID}>
                  {c.CategoriaTrabajador}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Situación:</label>
            <select
              name="PKIDSituacionRegistro"
              value={form.PKIDSituacionRegistro || 0}
              onChange={handleChange}
            >
              <option value={0}>-- Seleccione --</option>
              {situaciones.map((s) => (
                <option key={s.PKID} value={s.PKID}>
                  {s.SituacionRegistro}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Importe 1:</label>
            <input
              type="number"
              step="0.01"
              name="ImporteReintegro1"
              value={form.ImporteReintegro1}
              onChange={handleChange}
            />
          </div>

          <div>
            <label>Importe 2:</label>
            <input
              type="number"
              step="0.01"
              name="ImporteReintegro2"
              value={form.ImporteReintegro2}
              onChange={handleChange}
            />
          </div>

          <div>
            <label>Importe 3:</label>
            <input
              type="number"
              step="0.01"
              name="ImporteReintegro3"
              value={form.ImporteReintegro3}
              onChange={handleChange}
            />
          </div>

          <div>
            <label>Importe 4:</label>
            <input
              type="number"
              step="0.01"
              name="ImporteReintegro4"
              value={form.ImporteReintegro4}
              onChange={handleChange}
            />
          </div>

          <div>
            <label>Importe 5:</label>
            <input
              type="number"
              step="0.01"
              name="ImporteReintegro5"
              value={form.ImporteReintegro5}
              onChange={handleChange}
            />
          </div>

          <div>
            <label>Importe 6:</label>
            <input
              type="number"
              step="0.01"
              name="ImporteReintegro6"
              value={form.ImporteReintegro6}
              onChange={handleChange}
            />
          </div>
        </div>

        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          <button onClick={handleSave} disabled={loading}>
            {isEditing ? "Actualizar" : "Agregar"}
          </button>
          <button onClick={handleNew} disabled={loading}>
            Limpiar
          </button>
        </div>
      </div>

      {/* Lista */}
      <table border="1" cellPadding="6" style={{ width: "100%", fontSize: 13 }}>
        <thead>
          <tr>
            <th>Categoría</th>
            <th>Situación</th>
            <th>Imp1</th>
            <th>Imp2</th>
            <th>Imp3</th>
            <th>Imp4</th>
            <th>Imp5</th>
            <th>Imp6</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {lista.map((r) => (
            <tr key={r.PKID}>
              <td>{r.CategoriaTrabajador}</td>
              <td>{r.SituacionRegistro}</td>
              <td style={{ textAlign: "right" }}>{r.ImporteReintegro1?.toFixed(2)}</td>
              <td style={{ textAlign: "right" }}>{r.ImporteReintegro2?.toFixed(2)}</td>
              <td style={{ textAlign: "right" }}>{r.ImporteReintegro3?.toFixed(2)}</td>
              <td style={{ textAlign: "right" }}>{r.ImporteReintegro4?.toFixed(2)}</td>
              <td style={{ textAlign: "right" }}>{r.ImporteReintegro5?.toFixed(2)}</td>
              <td style={{ textAlign: "right" }}>{r.ImporteReintegro6?.toFixed(2)}</td>
              <td>
                <button onClick={() => handleEdit(r)}>✏️</button>{" "}
                <button onClick={() => handleDelete(r.PKID)}>🗑️</button>
              </td>
            </tr>
          ))}
          {lista.length === 0 && (
            <tr>
              <td colSpan="9" style={{ textAlign: "center", padding: 12 }}>
                No hay registros para el contexto seleccionado.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
