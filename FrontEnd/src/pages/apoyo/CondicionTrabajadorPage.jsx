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

export default function CondicionTrabajadorPage() {
  const auth = useAuthAxios();

  const [rows, setRows] = useState([]);
  const [situaciones, setSituaciones] = useState([]);
  const [loading, setLoading] = useState(false);

  // combos
  const loadSituaciones = async () => {
    try {
      const res = await auth.get("/condicion-trabajador-combos/situacion");
      setSituaciones(res.data || []);
    } catch (err) {
      alert("No se pudieron cargar las situaciones.");
    }
  };

  // listado
  const loadRows = async () => {
    try {
      setLoading(true);
      const res = await auth.get("/condicion-trabajador/");
      setRows(res.data || []);
    } catch (err) {
      alert("No se pudo listar.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSituaciones();
    loadRows();
  }, []);

  // create
  const handleCreate = async (data) => {
    try {
      await auth.post("/condicion-trabajador/", {
        IDCondicionTrabajador: Number(data.IDCondicionTrabajador),
        CondicionTrabajador: (data.CondicionTrabajador || "").trim(),
        PKIDSituacionRegistro: Number(data.PKIDSituacionRegistro),
        LetraCondicionTrabajador: (data.LetraCondicionTrabajador || "").trim(),
      });
      await loadRows();
    } catch (err) {
      alert(prettyError(err));
    }
  };

  // update
  const handleUpdate = async (data) => {
    try {
      await auth.put(`/condicion-trabajador/${data.PKID}`, {
        PKID: data.PKID,
        IDCondicionTrabajador: Number(data.IDCondicionTrabajador),
        CondicionTrabajador: (data.CondicionTrabajador || "").trim(),
        PKIDSituacionRegistro: Number(data.PKIDSituacionRegistro),
        LetraCondicionTrabajador: (data.LetraCondicionTrabajador || "").trim(),
      });
      await loadRows();
    } catch (err) {
      alert(prettyError(err));
    }
  };

  // delete
  const handleDelete = async (row) => {
    if (!window.confirm("¿Eliminar Condición de Trabajador?")) return;
    try {
      await auth.delete(`/condicion-trabajador/${row.PKID}`);
      await loadRows();
    } catch (err) {
      alert(prettyError(err));
    }
  };

  // columnada de tabla
  const tableColumns = [
    { key: "IDCondicionTrabajador", label: "ID" },
    { key: "CondicionTrabajador", label: "Condición" },
    { key: "LetraCondicionTrabajador", label: "Letra" },
    { key: "SituacionRegistro", label: "Situación" },
  ];

  // Columna modal
  const modalColumns = [
    {
      key: "IDCondicionTrabajador",
      label: "ID Condición",
      type: "number",
    },
    {
      key: "CondicionTrabajador",
      label: "Condición de Trabajador",
    },
    {
      key: "LetraCondicionTrabajador",
      label: "Letra",
    },
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
      title="Condición de Trabajador"
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