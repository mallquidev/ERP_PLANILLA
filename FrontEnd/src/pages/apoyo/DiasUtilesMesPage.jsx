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

export default function DiasUtilesMesPage() {
  const auth = useAuthAxios();
  const { empresaId, empresaNombre } = useGlobal() || {};

  const [rows, setRows] = useState([]);
  const [situaciones, setSituaciones] = useState([]);
  const [loading, setLoading] = useState(false);

  // combos
  const loadSituaciones = async () => {
    try {
      const res = await auth.get("/dias-utiles-mes-combos/situacion");
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
      const res = await auth.get(`/dias-utiles-mes/?empresaId=${empresaId}`);
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
      await auth.post("/dias-utiles-mes/", {
        ...data,
        PKIDEmpresa: Number(empresaId),
        Ano: Number(data.Ano),
        Mes: Number(data.Mes),
        NumeroDiasUtiles:
          data.NumeroDiasUtiles === ""
            ? null
            : Number(data.NumeroDiasUtiles),
      });
      await loadRows();
    } catch (err) {
      alert(prettyError(err));
    }
  };

  const handleUpdate = async (data) => {
    try {
      await auth.put(`/dias-utiles-mes/${data.PKID}`, {
        ...data,
        Ano: Number(data.Ano),
        Mes: Number(data.Mes),
        NumeroDiasUtiles:
          data.NumeroDiasUtiles === ""
            ? null
            : Number(data.NumeroDiasUtiles),
      });
      await loadRows();
    } catch (err) {
      alert(prettyError(err));
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm("¿Eliminar registro?")) return;
    try {
      await auth.delete(`/dias-utiles-mes/${row.PKID}`);
      await loadRows();
    } catch (err) {
      alert(prettyError(err));
    }
  };

  // columnada de tabla
  const tableColumns = [
    { key: "Ano", label: "Año" },
    { key: "Mes", label: "Mes" },
    { key: "NumeroDiasUtiles", label: "Días Útiles" },
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
    { key: "Ano", label: "Año" },
    { key: "Mes", label: "Mes" },
    { key: "NumeroDiasUtiles", label: "N° Días Útiles" },
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
      title="Días Útiles por Mes"
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