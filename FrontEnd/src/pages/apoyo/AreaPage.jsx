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

export default function AreaPage() {
  const auth = useAuthAxios();
  const { empresaId, empresaNombre } = useGlobal() || {};

  const [rows, setRows] = useState([]);
  const [situaciones, setSituaciones] = useState([]);
  const [loading, setLoading] = useState(false);

  // combos
  const loadSituaciones = async () => {
    try {
      const res = await auth.get("/area-combos/situacion");
      setSituaciones(res.data || []);
    } catch (err) {
      alert("No se pudieron cargar las situaciones.");
    }
  };

  // Listado
  const loadRows = async () => {
    if (!empresaId) {
      setRows([]);
      return;
    }
    try {
      setLoading(true);
      const res = await auth.get(`/area/?empresaId=${empresaId}`);
      setRows(res.data || []);
    } catch (err) {
      alert("No se pudo listar.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSituaciones();
  }, []);

  useEffect(() => {
    loadRows();
  }, [empresaId]);

  // crud
  const handleCreate = async (data) => {
    try {
      await auth.post("/area/", {
        ...data,
        PKIDEmpresa: Number(empresaId),
      });
      await loadRows();
    } catch (err) {
      alert(prettyError(err));
    }
  };

  const handleUpdate = async (data) => {
    try {
      await auth.put(`/area/${data.PKID}`, {
        ...data,
        PKIDEmpresa: Number(empresaId),
      });
      await loadRows();
    } catch (err) {
      alert(prettyError(err));
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm("¿Eliminar Área?")) return;
    try {
      await auth.delete(`/area/${row.PKID}`);
      await loadRows();
    } catch (err) {
      alert(prettyError(err));
    }
  };

  // columnada de tabla
  const tableColumns = [
    { key: "IDArea", label: "ID Área" },
    { key: "Area", label: "Área" },
    { key: "AreaAbreviado", label: "Abreviado" },
    { key: "SituacionRegistro", label: "Situación" },
  ];

  // Columna modal
  const modalColumns = [
    {
      key: "PKIDEmpresa",
      label: "Empresa",
      type: "select",
      options: empresaId
        ? [{ PKID: empresaId, RazonSocial: empresaNombre }]
        : [],
      displayKey: "RazonSocial",
      disabled: true,
      defaultValue: empresaId,
    },
    { key: "IDArea", label: "ID Área" },
    { key: "Area", label: "Área" },
    { key: "AreaAbreviado", label: "Abreviado" },
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
      title="Área"
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