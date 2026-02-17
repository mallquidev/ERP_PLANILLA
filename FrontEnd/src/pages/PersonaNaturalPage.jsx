// src/components/PersonaNaturalComponent.jsx
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
  const [loading, setLoading] = useState(false);

  // Combos
  const [tipodocs, setTipodocs] = useState([]);
  const [sexos, setSexos] = useState([]);
  const [niveles, setNiveles] = useState([]);
  const [profesiones, setProfesiones] = useState([]);
  const [grados, setGrados] = useState([]);
  const [nacionalidades, setNacionalidades] = useState([]);
  const [paises, setPaises] = useState([]);
  const [situaciones, setSituaciones] = useState([]);

  const loadCombos = async () => {
    try {
      const [td, sx, ni, pr, ga, na, pa, sr] = await Promise.all([
        auth.get(`/persona-natural-combos/tipodoc`),
        auth.get(`/persona-natural-combos/sexo`),
        auth.get(`/persona-natural-combos/nivel`),
        auth.get(`/persona-natural-combos/profesion`),
        auth.get(`/persona-natural-combos/grado`),
        auth.get(`/persona-natural-combos/nacionalidad`),
        auth.get(`/persona-natural-combos/pais`),
        auth.get(`/persona-natural-combos/situacion`)
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

  const loadRows = async () => {
    setLoading(true);
    try {
      const res = await auth.get(`/persona-natural/`);
      setRows(res.data || []);
    } catch (err) {
      alert("No se pudo listar personas naturales.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCombos();
    loadRows();
  }, []);

  // Crear / actualizar / eliminar
  const handleCreate = async (formData) => {
    try {
      const payload = { ...formData };
      // convertir combos a number
      ["IDPersonaNatural","PKIDTipoDocumentoIdentidad","PKIDSexo","PKIDNivelInstruccion","PKIDProfesion","PKIDGradoAcademico","PKIDNacionalidad","PKIDPais","PKIDSituacionRegistro"].forEach(k => {
        if(payload[k]) payload[k] = Number(payload[k])
      })
      await auth.post(`/persona-natural/`, payload);
      await loadRows();
    } catch (err) {
      alert(prettyError(err));
    }
  };

  const handleUpdate = async (formData) => {
    try {
      const payload = { ...formData };
      ["IDPersonaNatural","PKIDTipoDocumentoIdentidad","PKIDSexo","PKIDNivelInstruccion","PKIDProfesion","PKIDGradoAcademico","PKIDNacionalidad","PKIDPais","PKIDSituacionRegistro"].forEach(k => {
        if(payload[k]) payload[k] = Number(payload[k])
      })
      await auth.put(`/persona-natural/${formData.PKID}`, payload);
      await loadRows();
    } catch (err) {
      alert(prettyError(err));
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm("¿Eliminar registro?")) return;
    try {
      await auth.delete(`/persona-natural/${item.PKID}`);
      await loadRows();
    } catch (err) {
      alert("No se pudo eliminar (puede estar referenciado).");
    }
  };

  // Columnas con displayKey
  const columns = [
    { key: "IDPersonaNatural", label: "ID", type: "number" },
    { key: "PKIDTipoDocumentoIdentidad", label: "Tipo Doc", type: "select", options: tipodocs, displayKey: "DocumentoIdentidad" },
    { key: "NumeroDocumentoIdentidad", label: "N° Doc" },
    { key: "PrimerNombre", label: "Primer Nombre" },
    { key: "SegundoNombre", label: "Segundo Nombre" },
    { key: "ApellidoPaterno", label: "Ap. Paterno" },
    { key: "ApellidoMaterno", label: "Ap. Materno" },
    { key: "PKIDSexo", label: "Sexo", type: "select", options: sexos, displayKey: "Sexo" },
    { key: "PKIDNivelInstruccion", label: "Nivel", type: "select", options: niveles, displayKey: "Nombre" },
    { key: "PKIDProfesion", label: "Profesión", type: "select", options: profesiones, displayKey: "Nombre" },
    { key: "PKIDGradoAcademico", label: "Grado", type: "select", options: grados, displayKey: "Nombre" },
    { key: "PKIDNacionalidad", label: "Nacionalidad", type: "select", options: nacionalidades, displayKey: "Nombre" },
    { key: "PKIDPais", label: "País", type: "select", options: paises, displayKey: "Nombre" },
    { key: "PKIDSituacionRegistro", label: "Situación", type: "select", options: situaciones, displayKey: "Nombre" },
  ];

  return (
    <TableGlobal
      title="Persona Natural"
      data={rows}
      columns={columns}
      onCreate={handleCreate}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
    />
  );
}
