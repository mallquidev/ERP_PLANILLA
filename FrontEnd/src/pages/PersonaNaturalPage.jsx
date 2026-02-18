import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import API_BASE_URL from "../api";
import TableGlobal from "../ui/table/TableGlobal";

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

function prettyError(err) {
  const d = err?.response?.data;
  if (!d) return err?.message || "Error";
  if (Array.isArray(d.detail))
    return d.detail
      .map(
        (e) =>
          `• ${
            Array.isArray(e.loc) ? e.loc.join(".") : e.loc
          }: ${e.msg}`
      )
      .join("\n");
  return String(d.detail || "Error");
}

export default function PersonaNaturalPage() {
  const auth = useAuthAxios();

  const [rows, setRows] = useState([]);

  // combos
  const [tipodocs, setTipodocs] = useState([]);
  const [sexos, setSexos] = useState([]);
  const [niveles, setNiveles] = useState([]);
  const [profesiones, setProfesiones] = useState([]);
  const [grados, setGrados] = useState([]);
  const [nacionalidades, setNacionalidades] = useState([]);
  const [paises, setPaises] = useState([]);
  const [situaciones, setSituaciones] = useState([]);

  // cargar combos
  const loadCombos = async () => {
    try {
      const [
        td,
        sx,
        ni,
        pr,
        ga,
        na,
        pa,
        sr
      ] = await Promise.all([
        auth.get(`/persona-natural-combos/tipodoc/`),
        auth.get(`/persona-natural-combos/sexo/`),
        auth.get(`/persona-natural-combos/nivel/`),
        auth.get(`/persona-natural-combos/profesion/`),
        auth.get(`/persona-natural-combos/grado/`),
        auth.get(`/persona-natural-combos/nacionalidad/`),
        auth.get(`/persona-natural-combos/pais/`),
        auth.get(`/persona-natural-combos/situacion/`)
      ]);

      setTipodocs(td.data || []);
      setSexos(sx.data || []);
      setNiveles(ni.data || []);
      setProfesiones(pr.data || []);
      setGrados(ga.data || []);
      setNacionalidades(na.data || []);
      setPaises(pa.data || []);
      setSituaciones(sr.data || []);
    } catch (err) {
      alert("No se pudieron cargar los combos.");
    }
  };

  // cargar listado
  const loadRows = async () => {
    try {
      const res = await auth.get(`/persona-natural/`);
      setRows(res.data || []);
    } catch (err) {
      alert("No se pudo listar personas.");
    }
  };

  useEffect(() => {
    loadCombos();
    loadRows();
  }, []);

  // normalizador numerico
  const normalizeNumbers = (payload) => {
    const numericFields = [
      "IDPersonaNatural",
      "PKIDTipoDocumentoIdentidad",
      "PKIDSexo",
      "PKIDNivelInstruccion",
      "PKIDProfesion",
      "PKIDGradoAcademico",
      "PKIDNacionalidad",
      "PKIDPais",
      "PKIDSituacionRegistro",
      "PKIDEstadoCivil",
      "PKIDModalidadFormativa",
      "PKIDInstitutoEducativo",
      "PKIDProfesionFormativa",
      "PKIDTipoCentroFormativo"
    ];

    numericFields.forEach((k) => {
      if (payload[k] !== "" && payload[k] !== null && payload[k] !== undefined) {
        payload[k] = Number(payload[k]);
      } else {
        payload[k] = null;
      }
    });

    return payload;
  };

  // crear
  const handleCreate = async (formData) => {
    try {
      const payload = normalizeNumbers({ ...formData });
      await auth.post(`/persona-natural/`, payload);
      await loadRows();
    } catch (err) {
      alert(prettyError(err));
    }
  };

  // actualizar
  const handleUpdate = async (formData) => {
    try {
      const payload = normalizeNumbers({ ...formData });
      await auth.put(`/persona-natural/${formData.PKID}`, payload);
      await loadRows();
    } catch (err) {
      alert(prettyError(err));
    }
  };

  // eliminar
  const handleDelete = async (item) => {
    try {
      await auth.delete(`/persona-natural/${item.PKID}`);
      await loadRows();
    } catch (err) {
      alert(prettyError(err));
    }
  };

  // columnas para la tabla
  const tableColumns = [
    { key: "IDPersonaNatural", label: "ID" },
    { key: "NumeroDocumentoIdentidad", label: "N° Documento" },
    {
      key: "PKIDTipoDocumentoIdentidad",
      label: "Tipo Doc",
      type: "select",
      options: tipodocs,
      displayKey: "Nombre"
    },
    {
      key: "NombreCompleto",
      label: "Nombre Completo",
      render: (row) =>
        `${row.ApellidoPaterno || ""} ${row.ApellidoMaterno || ""}, ${row.PrimerNombre || ""} ${row.SegundoNombre || ""}`
    },
    {
      key: "PKIDSexo",
      label: "Sexo",
      type: "select",
      options: sexos,
      displayKey: "Nombre"
    },
    {
      key: "PKIDNivelInstruccion",
      label: "Nivel",
      type: "select",
      options: niveles,
      displayKey: "Nombre"
    },
    {
      key: "PKIDProfesion",
      label: "Profesión",
      type: "select",
      options: profesiones,
      displayKey: "Nombre"
    },
    {
      key: "PKIDGradoAcademico",
      label: "Grado",
      type: "select",
      options: grados,
      displayKey: "Nombre"
    },
    {
      key: "PKIDNacionalidad",
      label: "Nacionalidad",
      type: "select",
      options: nacionalidades,
      displayKey: "Nombre"
    },
    {
      key: "PKIDPais",
      label: "País",
      type: "select",
      options: paises,
      displayKey: "Nombre"
    },
    {
      key: "PKIDSituacionRegistro",
      label: "Situación",
      type: "select",
      options: situaciones,
      displayKey: "Nombre"
    },
  ];

  // columnas para el modal (inputs separados)
  const modalColumns = [
    { key: "IDPersonaNatural", label: "ID Persona Natural" },
    {
      key: "NumeroDocumentoIdentidad",
      label: "N° Documento"
    },
    { key: "PrimerNombre", label: "Primer Nombre" },
    { key: "SegundoNombre", label: "Segundo Nombre" },
    { key: "ApellidoPaterno", label: "Apellido Paterno" },
    { key: "ApellidoMaterno", label: "Apellido Materno" },
    { key: "EmailPersonal", label: "Email Personal" },
    { key: "NumeroAFP", label: "AFP" },
    { key: "TelefonoFijo", label: "Telefono Fijo" },
    { key: "TelefonoCelular", label: "Celular" },
    { key: "GrupoSanguineo", label: "Grupo Sanguineo" },
    { key: "FechaNacimiento", label: "Fecha Nacimiento", type:"date" },
    { key: "LugarNacimiento", label: "Lugar de Nacimiento" },
    { 
      key: "FechaAfiliacionAFP", 
      label: "AFP (fecha afiliacion)",
      type:"date"
    },
    { 
      key: "PKIDGradoAcademico", 
      label: "Grado Academico",
      type: "select",
      options: grados,
      displayKey: "Nombre"
    },
    {
      key: "PKIDTipoDocumentoIdentidad",
      label: "Tipo Doc",
      type: "select",
      options: tipodocs,
      displayKey: "Nombre"
    },
    {
      key: "PKIDSexo",
      label: "Sexo",
      type: "select",
      options: sexos,
      displayKey: "Nombre"
    },
    {
      key: "PKIDNivelInstruccion",
      label: "Nivel Instruccion",
      type: "select",
      options: niveles,
      displayKey: "Nombre"
    },
    {
      key: "PKIDProfesion",
      label: "Profesión",
      type: "select",
      options: profesiones,
      displayKey: "Nombre"
    },
    {
      key: "PKIDNacionalidad",
      label: "Nacionalidad",
      type: "select",
      options: nacionalidades,
      displayKey: "Nombre"
    },
    {
      key: "PKIDPais",
      label: "País",
      type: "select",
      options: paises,
      displayKey: "Nombre"
    },
    {
      key: "PKIDSituacionRegistro",
      label: "Situación",
      type: "select",
      options: situaciones,
      displayKey: "Nombre"
    },
  ];

  return (
    <TableGlobal
      title="Persona Natural"
      data={rows}
      columns={tableColumns}      // columna para tabla
      modalColumns={modalColumns} // columna para modal
      onCreate={handleCreate}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
    />
  );
}
