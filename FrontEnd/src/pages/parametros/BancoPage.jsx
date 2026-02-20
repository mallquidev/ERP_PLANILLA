//frontend/src/components/BancoComponent.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import API_BASE_URL from "../../api";
import TableGlobal from "../../ui/table/TableGlobal";
import { useGlobal } from "../../GlobalContext";

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

export default function BancoPage() {
  const auth = useAuthAxios();
  const { empresaId, empresaNombre } = useGlobal() || {};

  const [rows, setRows] = useState([]);
  const [situaciones, setSituaciones] = useState([]);
  const [loading, setLoading] = useState(false);

  // combos
  const loadSituaciones = async () => {
    try {
      const res = await auth.get("/banco-combos/situaciones");
      setSituaciones(res.data || []);
    } catch (err) {
      alert("No se pudieron cargar las situaciones.");
    }
  };

  // Listado
  const loadRows = async () => {
    try {
      setLoading(true);
      const res = await auth.get("/banco/");
      setRows(res.data || []);
    } catch (err) {
      alert("No se pudo listar bancos.");
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
      await auth.post("/banco/", {
        IDBanco: Number(data.IDBanco),
        Banco: (data.Banco || "").trim(),
        SiglasBanco: (data.SiglasBanco || "").trim() || null,
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
      await auth.put(`/banco/${data.PKID}`, {
        IDBanco: Number(data.IDBanco),
        Banco: (data.Banco || "").trim(),
        SiglasBanco: (data.SiglasBanco || "").trim() || null,
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
    if (!window.confirm("¿Eliminar banco?")) return;
    try {
      await auth.delete(`/banco/${row.PKID}`);
      await loadRows();
    } catch (err) {
      alert(prettyError(err));
    }
  };

  // columnada de tabla
  const tableColumns = [
    { key: "IDBanco", label: "ID Banco" },
    { key: "Banco", label: "Banco" },
    { key: "SiglasBanco", label: "Siglas" },
    { key: "SituacionRegistro", label: "Situación" },
  ];

  // Columna modal
  const modalColumns = [
    { key: "IDBanco", label: "ID Banco" },
    { key: "Banco", label: "Banco" },
    { key: "SiglasBanco", label: "Siglas Banco" },
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
      title={`Banco`}
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
