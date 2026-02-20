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
    return d.detail.map((e) => `• ${e.msg}`).join("\n");
  return String(d.detail || "Error");
}

export default function EntidadEpsComponent() {
  const auth = useAuthAxios();

  const [rows, setRows] = useState([]);
  const [situaciones, setSituaciones] = useState([]);
  const [loading, setLoading] = useState(false);

  // combos
  const loadSituaciones = async () => {
    try {
      const r = await auth.get("/entidad-eps-combos/situacion/");
      setSituaciones(r.data || []);
    } catch {
      alert("No se pudo cargar Situación.");
    }
  };

  // Listado
  const loadRows = async () => {
    try {
      setLoading(true);
      const res = await auth.get("/entidad-eps/");
      setRows(res.data || []);
    } catch (err) {
      alert("No se pudo listar EntidadEps.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSituaciones();
    loadRows();
  }, []);

  // crud
  const handleCreate = async (data) => {
    try {
      await auth.post("/entidad-eps/", {
        IDEntidadEps: Number(data.IDEntidadEps),
        EntidadEps: String(data.EntidadEps || "").trim(),
        PKIDSituacionRegistro: Number(data.PKIDSituacionRegistro),
      });
      await loadRows();
    } catch (err) {
      alert(prettyError(err));
    }
  };

  const handleUpdate = async (data) => {
    try {
      await auth.put(`/entidad-eps/${data.PKID}`, {
        IDEntidadEps: Number(data.IDEntidadEps),
        EntidadEps: String(data.EntidadEps || "").trim(),
        PKIDSituacionRegistro: Number(data.PKIDSituacionRegistro),
      });
      await loadRows();
    } catch (err) {
      alert(prettyError(err));
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm("¿Eliminar EntidadEps?")) return;
    try {
      await auth.delete(`/entidad-eps/${row.PKID}`);
      await loadRows();
    } catch (err) {
      alert(prettyError(err));
    }
  };

  // columnada de tabla
  const tableColumns = [
    { key: "IDEntidadEps", label: "ID" },
    { key: "EntidadEps", label: "Entidad EPS" },
    { key: "SituacionRegistro", label: "Situación" },
  ];

  // Columna modal
  const modalColumns = [
    { key: "IDEntidadEps", label: "ID Entidad EPS" },
    { key: "EntidadEps", label: "Entidad EPS" },
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
      title="Entidad EPS"
      data={rows}
      columns={tableColumns}
      modalColumns={modalColumns}
      onCreate={handleCreate}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
      loading={loading}
    />
  );
}