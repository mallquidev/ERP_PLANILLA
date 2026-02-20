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

export default function CategoriaTrabajadorPage() {
  const auth = useAuthAxios();

  const [rows, setRows] = useState([]);
  const [situaciones, setSituaciones] = useState([]);
  const [loading, setLoading] = useState(false);

  // =============================
  // Cargar combos
  // =============================
  const loadSituaciones = async () => {
    try {
      const res = await auth.get(
        "/categoria-trabajador-combos/situaciones"
      );
      setSituaciones(res.data || []);
    } catch (err) {
      alert("No fue posible cargar el combo de Situación.");
    }
  };

  // =============================
  // Listado
  // =============================
  const loadRows = async () => {
    try {
      setLoading(true);
      const res = await auth.get("/categoria-trabajador/");
      setRows(res.data || []);
    } catch (err) {
      alert("No fue posible listar las categorías.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSituaciones();
    loadRows();
  }, []);

  // =============================
  // CRUD
  // =============================
  const handleCreate = async (data) => {
    try {
      await auth.post("/categoria-trabajador/", {
        IDCategoriaTrabajador: Number(data.IDCategoriaTrabajador),
        CategoriaTrabajador: data.CategoriaTrabajador?.trim(),
        PKIDSituacionRegistro: Number(data.PKIDSituacionRegistro),
      });
      await loadRows();
    } catch (err) {
      alert(prettyError(err));
    }
  };

  const handleUpdate = async (data) => {
    try {
      await auth.put(`/categoria-trabajador/${data.PKID}`, {
        IDCategoriaTrabajador: Number(data.IDCategoriaTrabajador),
        CategoriaTrabajador: data.CategoriaTrabajador?.trim(),
        PKIDSituacionRegistro: Number(data.PKIDSituacionRegistro),
      });
      await loadRows();
    } catch (err) {
      alert(prettyError(err));
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm("¿Eliminar la categoría?")) return;
    try {
      await auth.delete(`/categoria-trabajador/${row.PKID}`);
      await loadRows();
    } catch (err) {
      alert(prettyError(err));
    }
  };

  // =============================
  // Columnas Tabla
  // =============================
  const tableColumns = [
    { key: "PKID", label: "PKID" },
    { key: "IDCategoriaTrabajador", label: "ID" },
    { key: "CategoriaTrabajador", label: "Categoría" },
    { key: "SituacionRegistro", label: "Situación" },
  ];

  // =============================
  // Columnas Modal
  // =============================
  const modalColumns = [
    {
      key: "IDCategoriaTrabajador",
      label: "ID Categoría",
      type: "number",
    },
    {
      key: "CategoriaTrabajador",
      label: "Categoría",
      type: "text",
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
      title="Categoría de Trabajador"
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