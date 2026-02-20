import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import API_BASE_URL from "../../api";
import TableGlobal from "../../ui/table/TableGlobal";

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
          `• ${(Array.isArray(e.loc) ? e.loc.join(".") : e.loc)}: ${e.msg}`
      )
      .join("\n");
  return String(d.detail || "Error");
}

export default function EstadoCivilPage() {
  const auth = useAuthAxios();

  // combos
  const [situaciones, setSituaciones] = useState([]);

  // grilla
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);

  // filtros
  const [fId, setFId] = useState("");
  const [fNombre, setFNombre] = useState("");
  const [fSituacion, setFSituacion] = useState("");

  // form
  const empty = {
    PKID: null,
    IDEstadoCivil: "",
    EstadoCivil: "",
    PKIDSituacionRegistro: "",
  };
  const [form, setForm] = useState(empty);
  const isEditing = form.PKID !== null;

  // cargar combos
  const loadSituaciones = async () => {
    try {
      const r = await auth.get(`/estado-civil-combos/situacion/`);
      setSituaciones(r.data || []);
    } catch {
      alert("No se pudo cargar Situación.");
    }
  };

  // cargar grilla
  const loadRows = async () => {
    try {
      const qs = new URLSearchParams();
      if (fId) qs.append("id_estado", fId);
      if (fNombre) qs.append("nombre", fNombre);
      if (fSituacion) qs.append("situacion_id", fSituacion);
      const url = qs.toString() ? `/estado-civil/?${qs.toString()}` : `/estado-civil/`;
      const res = await auth.get(url);
      setRows(res.data || []);
    } catch (err) {
      console.error(err);
      alert("No se pudo listar Estados Civiles.");
    }
  };

  useEffect(() => {
    loadSituaciones();
    loadRows();
  }, []);

  // CRUD
  const handleCreate = async (data) => {
    try {
      await auth.post("/estado-civil/", {
        IDEstadoCivil: Number(data.IDEstadoCivil),
        EstadoCivil: String(data.EstadoCivil).trim(),
        PKIDSituacionRegistro: data.PKIDSituacionRegistro
          ? Number(data.PKIDSituacionRegistro)
          : null,
      });
      await loadRows();
    } catch (err) {
      alert(prettyError(err));
    }
  };

  const handleUpdate = async (data) => {
    try {
      await auth.put(`/estado-civil/${data.PKID}`, {
        IDEstadoCivil: Number(data.IDEstadoCivil),
        EstadoCivil: String(data.EstadoCivil).trim(),
        PKIDSituacionRegistro: data.PKIDSituacionRegistro
          ? Number(data.PKIDSituacionRegistro)
          : null,
      });
      await loadRows();
    } catch (err) {
      alert(prettyError(err));
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm("¿Eliminar Estado Civil?")) return;
    try {
      await auth.delete(`/estado-civil/${row.PKID}`);
      await loadRows();
    } catch (err) {
      alert(prettyError(err));
    }
  };

  // columnas de tabla
  const tableColumns = [
    { key: "IDEstadoCivil", label: "ID" },
    { key: "EstadoCivil", label: "Estado Civil" },
    { key: "SituacionRegistro", label: "Situación" },
  ];

  // columnas modal
  const modalColumns = [
    { key: "IDEstadoCivil", label: "ID Estado Civil" },
    { key: "EstadoCivil", label: "Estado Civil" },
    {
      key: "PKIDSituacionRegistro",
      label: "Situación",
      type: "select",
      options: situaciones,
      displayKey: "SituacionRegistro",
    },
  ];

  return (
    <TableGlobal
      title="Estado Civil"
      data={rows}
      columns={tableColumns}
      modalColumns={modalColumns}
      onCreate={handleCreate}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
      loading={rows.length === 0}
      filters={{
        fId,
        setFId,
        fNombre,
        setFNombre,
        fSituacion,
        setFSituacion,
        onSearch: loadRows,
        onClear: () => {
          setFId("");
          setFNombre("");
          setFSituacion("");
          loadRows();
        },
      }}
    />
  );
}