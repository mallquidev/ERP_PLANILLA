// src/components/PersonaNaturalComponent.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import API_BASE_URL from "../api";

function authConfig() {
  const token = localStorage.getItem("token");
  return {
    headers: { Authorization: `Bearer ${token}` },
  };
}

const initialForm = {
  IDPersonaNatural: "",
  PKIDTipoDocumentoIdentidad: "",
  NumeroDocumentoIdentidad: "",
  PKIDSexo: "",
  PKIDNivelInstruccion: "",
  PKIDProfesion: "",
  PrimerNombre: "",
  SegundoNombre: "",
  TercerNombre: "",
  ApellidoPaterno: "",
  ApellidoMaterno: "",
  FechaNacimiento: "",
  LugarNacimiento: "",
  TelefonoFijo: "",
  TelefonoCelular: "",
  EmailPersonal: "",
  FechaAfiliacionAFP: "",
  NumeroAFP: "",
  PKIDGradoAcademico: "",
  PKIDNacionalidad: "",
  PKIDPais: "",
  BreveteNumero: "",
  BreveteFechaCaducidad: "",
  PasaporteNumero: "",
  PasaporteCaducidad: "",
  GrupoSanguineo: "",
  PKIDSituacionRegistro: "",
  PKIDEstadoCivil: "",
  NumeroSeguroSocial: "",
  Talla: "",
  PKIDModalidadFormativa: "",
  PKIDInstitutoEducativo: "",
  PKIDProfesionFormativa: "",
  FechaEgresoFormativa: "",
  PKIDTipoCentroFormativo: "",
  LibretaMilitar: ""
};

export default function PersonaNaturalComponent() {
  const [list, setList] = useState([]);
  const [q, setQ] = useState("");
  const [form, setForm] = useState(initialForm);
  const [editingPKID, setEditingPKID] = useState(null);
  const [loading, setLoading] = useState(false);

  // combos
  const [tipodocs, setTipodocs] = useState([]);
  const [sexos, setSexos] = useState([]);
  const [niveles, setNiveles] = useState([]);
  const [profesiones, setProfesiones] = useState([]);
  const [grados, setGrados] = useState([]);
  const [nacionalidades, setNacionalidades] = useState([]);
  const [paises, setPaises] = useState([]);
  const [situaciones, setSituaciones] = useState([]);

  const loadCombos = async () => {
    const cfg = authConfig();
    const [td, sx, ni, pr, ga, na, pa, sr] = await Promise.all([
      axios.get(`${API_BASE_URL}/persona-natural-combos/tipodoc`, cfg),
      axios.get(`${API_BASE_URL}/persona-natural-combos/sexo`, cfg),
      axios.get(`${API_BASE_URL}/persona-natural-combos/nivel`, cfg),
      axios.get(`${API_BASE_URL}/persona-natural-combos/profesion`, cfg),
      axios.get(`${API_BASE_URL}/persona-natural-combos/grado`, cfg),
      axios.get(`${API_BASE_URL}/persona-natural-combos/nacionalidad`, cfg),
      axios.get(`${API_BASE_URL}/persona-natural-combos/pais`, cfg),
      axios.get(`${API_BASE_URL}/persona-natural-combos/situacion`, cfg),
    ]);
    setTipodocs(td.data);
    setSexos(sx.data);
    setNiveles(ni.data);
    setProfesiones(pr.data);
    setGrados(ga.data);
    setNacionalidades(na.data);
    setPaises(pa.data);
    setSituaciones(sr.data);
  };

  const loadList = async () => {
    setLoading(true);
    try {
      const cfg = authConfig();
      const url = q
        ? `${API_BASE_URL}/persona-natural/?q=${encodeURIComponent(q)}`
        : `${API_BASE_URL}/persona-natural/`;
      const res = await axios.get(url, cfg);
      setList(res.data || []);
    } catch (err) {
      console.error("Error listando PersonaNatural:", err);
      alert("Error cargando el listado");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCombos();
    loadList();
    // eslint-disable-next-line
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingPKID(null);
  };

  const onEdit = (row) => {
    setEditingPKID(row.PKID);
    setForm({
      ...initialForm,
      ...row, // cuidado: row incluye campos de combos (Texto) en listar; al editar, envía sólo PKIDs
      // asegúrate de que los campos PKID* queden con su valor PKID (el listado ya trae PKIDs)
    });
  };

  const onDelete = async (row) => {
    if (!window.confirm("¿Eliminar registro?")) return;
    try {
      const cfg = authConfig();
      await axios.delete(`${API_BASE_URL}/persona-natural/${row.PKID}`, cfg);
      await loadList();
      alert("Eliminado");
    } catch (err) {
      console.error(err);
      alert("No se pudo eliminar (puede estar referenciado).");
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    // Validación mínima
    if (!form.IDPersonaNatural || !form.PKIDTipoDocumentoIdentidad || !form.NumeroDocumentoIdentidad || !form.PrimerNombre || !form.ApellidoPaterno) {
      alert("Complete los campos obligatorios (ID, Tipo Doc, N° Doc, Nombres/Ap. Paterno).");
      return;
    }

    try {
      const cfg = authConfig();
      const payload = { ...form };

      // Ajustar tipos numéricos (los combos devuelven strings)
      [
        "IDPersonaNatural", "PKIDTipoDocumentoIdentidad", "PKIDSexo", "PKIDNivelInstruccion",
        "PKIDProfesion", "PKIDGradoAcademico", "PKIDNacionalidad", "PKIDPais",
        "PKIDSituacionRegistro", "PKIDEstadoCivil", "PKIDModalidadFormativa",
        "PKIDInstitutoEducativo", "PKIDProfesionFormativa", "PKIDTipoCentroFormativo"
      ].forEach(k => {
        if (payload[k] !== "" && payload[k] !== null && payload[k] !== undefined) {
          payload[k] = Number(payload[k]);
        } else {
          payload[k] = null;
        }
      });

      if (editingPKID) {
        await axios.put(`${API_BASE_URL}/persona-natural/${editingPKID}`, payload, cfg);
        alert("Actualizado");
      } else {
        await axios.post(`${API_BASE_URL}/persona-natural/`, payload, cfg);
        alert("Creado");
      }

      resetForm();
      await loadList();
    } catch (err) {
      console.error("Guardar persona error:", err);
      const detail = err?.response?.data?.detail || err.message;
      alert(`No se pudo guardar.\n${detail}`);
    }
  };

  return (
    <div>
      <h2>Persona Natural</h2>

      {/* Buscador */}
      <div style={{ marginBottom: 12 }}>
        <input
          placeholder="Buscar por nombre/apellido/documento..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ marginRight: 8 }}
        />
        <button onClick={loadList} disabled={loading}>
          {loading ? "Cargando..." : "Buscar"}
        </button>
        <button onClick={() => { setQ(""); loadList(); }} style={{ marginLeft: 8 }}>
          Limpiar
        </button>
      </div>

      {/* Formulario */}
      <form onSubmit={onSubmit} style={{ border: "1px solid #ddd", padding: 12, marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          <div>
            <label>IDPersonaNatural*</label>
            <input name="IDPersonaNatural" value={form.IDPersonaNatural} onChange={handleChange} />
          </div>

          <div>
            <label>Tipo Doc.*</label>
            <select name="PKIDTipoDocumentoIdentidad" value={form.PKIDTipoDocumentoIdentidad} onChange={handleChange}>
              <option value="">--Seleccione--</option>
              {tipodocs.map(x => <option key={x.PKID} value={x.PKID}>{x.Nombre}</option>)}
            </select>
          </div>

          <div>
            <label>N° Documento*</label>
            <input name="NumeroDocumentoIdentidad" value={form.NumeroDocumentoIdentidad} onChange={handleChange} />
          </div>

          <div>
            <label>Sexo*</label>
            <select name="PKIDSexo" value={form.PKIDSexo} onChange={handleChange}>
              <option value="">--Seleccione--</option>
              {sexos.map(x => <option key={x.PKID} value={x.PKID}>{x.Nombre}</option>)}
            </select>
          </div>

          <div>
            <label>Nivel Instrucción*</label>
            <select name="PKIDNivelInstruccion" value={form.PKIDNivelInstruccion} onChange={handleChange}>
              <option value="">--Seleccione--</option>
              {niveles.map(x => <option key={x.PKID} value={x.PKID}>{x.Nombre}</option>)}
            </select>
          </div>

          <div>
            <label>Profesión*</label>
            <select name="PKIDProfesion" value={form.PKIDProfesion} onChange={handleChange}>
              <option value="">--Seleccione--</option>
              {profesiones.map(x => <option key={x.PKID} value={x.PKID}>{x.Nombre}</option>)}
            </select>
          </div>

          <div>
            <label>Primer Nombre*</label>
            <input name="PrimerNombre" value={form.PrimerNombre} onChange={handleChange} />
          </div>

          <div>
            <label>Segundo Nombre</label>
            <input name="SegundoNombre" value={form.SegundoNombre} onChange={handleChange} />
          </div>

          <div>
            <label>Ap. Paterno*</label>
            <input name="ApellidoPaterno" value={form.ApellidoPaterno} onChange={handleChange} />
          </div>

          <div>
            <label>Ap. Materno</label>
            <input name="ApellidoMaterno" value={form.ApellidoMaterno} onChange={handleChange} />
          </div>

          <div>
            <label>Fecha Nac.*</label>
            <input type="date" name="FechaNacimiento" value={form.FechaNacimiento} onChange={handleChange} />
          </div>

          <div>
            <label>Lugar Nac.*</label>
            <input name="LugarNacimiento" value={form.LugarNacimiento} onChange={handleChange} />
          </div>

          <div>
            <label>Email</label>
            <input name="EmailPersonal" value={form.EmailPersonal} onChange={handleChange} />
          </div>

          <div>
            <label>Tel. Fijo</label>
            <input name="TelefonoFijo" value={form.TelefonoFijo} onChange={handleChange} />
          </div>

          <div>
            <label>Celular</label>
            <input name="TelefonoCelular" value={form.TelefonoCelular} onChange={handleChange} />
          </div>

          <div>
            <label>Grado Acad.*</label>
            <select name="PKIDGradoAcademico" value={form.PKIDGradoAcademico} onChange={handleChange}>
              <option value="">--Seleccione--</option>
              {grados.map(x => <option key={x.PKID} value={x.PKID}>{x.Nombre}</option>)}
            </select>
          </div>

          <div>
            <label>Nacionalidad*</label>
            <select name="PKIDNacionalidad" value={form.PKIDNacionalidad} onChange={handleChange}>
              <option value="">--Seleccione--</option>
              {nacionalidades.map(x => <option key={x.PKID} value={x.PKID}>{x.Nombre}</option>)}
            </select>
          </div>

          <div>
            <label>País*</label>
            <select name="PKIDPais" value={form.PKIDPais} onChange={handleChange}>
              <option value="">--Seleccione--</option>
              {paises.map(x => <option key={x.PKID} value={x.PKID}>{x.Nombre}</option>)}
            </select>
          </div>

          <div>
            <label>Situación*</label>
            <select name="PKIDSituacionRegistro" value={form.PKIDSituacionRegistro} onChange={handleChange}>
              <option value="">--Seleccione--</option>
              {situaciones.map(x => <option key={x.PKID} value={x.PKID}>{x.Nombre}</option>)}
            </select>
          </div>

          {/* Campos opcionales extra (puedes ocultarlos si no los usarás ahora) */}
          <div>
            <label>AFP (Fecha Afiliación)</label>
            <input type="date" name="FechaAfiliacionAFP" value={form.FechaAfiliacionAFP || ""} onChange={handleChange} />
          </div>
          <div>
            <label>AFP (N°)</label>
            <input name="NumeroAFP" value={form.NumeroAFP || ""} onChange={handleChange} />
          </div>
          <div>
            <label>Grupo Sanguíneo</label>
            <input name="GrupoSanguineo" value={form.GrupoSanguineo || ""} onChange={handleChange} />
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <button type="submit" style={{ marginRight: 8 }}>
            {editingPKID ? "Actualizar" : "Crear"}
          </button>
          {editingPKID && (
            <button type="button" onClick={resetForm}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      {/* Tabla */}
      <div style={{ overflowX: "auto" }}>
        <table border="1" cellPadding="6" style={{ fontSize: 13, width: "100%" }}>
          <thead>
            <tr>
              <th>PKID</th>
              <th>ID</th>
              <th>Tipo Doc</th>
              <th>N° Doc</th>
              <th>Nombres</th>
              <th>Sexo</th>
              <th>Nivel</th>
              <th>Profesión</th>
              <th>Grado</th>
              <th>Nacionalidad</th>
              <th>País</th>
              <th>Situación</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.PKID}>
                <td>{r.PKID}</td>
                <td>{r.IDPersonaNatural}</td>
                <td>{r.TipoDocumentoIdentidad}</td>
                <td>{r.NumeroDocumentoIdentidad}</td>
                <td>
                  {r.ApellidoPaterno} {r.ApellidoMaterno}, {r.PrimerNombre} {r.SegundoNombre || ""}
                </td>
                <td>{r.Sexo}</td>
                <td>{r.NivelInstruccion}</td>
                <td>{r.Profesion}</td>
                <td>{r.GradoAcademico}</td>
                <td>{r.Nacionalidad}</td>
                <td>{r.Pais}</td>
                <td>{r.SituacionRegistro}</td>
                <td>
                  <button onClick={() => onEdit(r)} style={{ marginRight: 6 }}>✏️</button>
                  <button onClick={() => onDelete(r)}>🗑️</button>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan="13" style={{ textAlign: "center" }}>Sin registros</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
