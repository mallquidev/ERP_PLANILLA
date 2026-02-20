import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import API_BASE_URL from "../api";
import TableGlobal from "../ui/table/TableGlobal";
import { useGlobal } from "../GlobalContext";

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

export default function CuentaContableComponent() {
  const auth = useAuthAxios();
  const { empresaId, empresaNombre } = useGlobal() || {};

  const [rows, setRows] = useState([]);
  const [situaciones, setSituaciones] = useState([]);
  const [loading, setLoading] = useState(false);

  // combos
  const loadSituaciones = async () => {
    try {
      const res = await auth.get("/cuenta-contable-combos/situacion");
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
      const res = await auth.get(`/cuenta-contable/?empresaId=${empresaId}`);
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
      await auth.post("/cuenta-contable/", {
        ...data,
        PKIDEmpresa: Number(empresaId),
        IndicadorCuentaCorrienteCheck: data.IndicadorCuentaCorrienteCheck ? 1 : 0,
      });
      await loadRows();
    } catch (err) {
      alert(prettyError(err));
    }
  };

  const handleUpdate = async (data) => {
    try {
      await auth.put(`/cuenta-contable/${data.PKID}`, {
        ...data,
        PKIDEmpresa: Number(empresaId),
        IndicadorCuentaCorrienteCheck: data.IndicadorCuentaCorrienteCheck ? 1 : 0,
      });
      await loadRows();
    } catch (err) {
      alert(prettyError(err));
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm("¿Eliminar cuenta contable?")) return;
    try {
      await auth.delete(`/cuenta-contable/${row.PKID}`);
      await loadRows();
    } catch (err) {
      alert(prettyError(err));
    }
  };

  // columnada de tabla
  const tableColumns = [
    { key: "IDCuentaContable", label: "ID" },
    { key: "CuentaContable", label: "Cuenta" },
    { key: "NivelCuenta", label: "Nivel" },
    { key: "SituacionRegistro", label: "Situación" },
    {
      key: "IndicadorMovimientoCheck",
      label: "Mov",
      render: (row) => (row.IndicadorMovimientoCheck ? "✔" : ""),
    },
    {
      key: "IndicadorAnaliticaCheck",
      label: "Analítica",
      render: (row) => (row.IndicadorAnaliticaCheck ? "✔" : ""),
    },
    {
      key: "IndicadorCentroCostoCheck",
      label: "CCosto",
      render: (row) => (row.IndicadorCentroCostoCheck ? "✔" : ""),
    },
    {
      key: "IndicadorCuentaCorrienteCheck",
      label: "Cta Cte",
      render: (row) => (row.IndicadorCuentaCorrienteCheck ? "✔" : ""),
    },
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
    { key: "IDCuentaContable", label: "ID Cuenta" },
    { key: "CuentaContable", label: "Nombre Cuenta" },
    { key: "NivelCuenta", label: "Nivel Cuenta" },
    {
      key: "IndicadorMovimientoCheck",
      label: "Movimiento",
      type: "checkbox",
    },
    {
      key: "IndicadorAnaliticaCheck",
      label: "Analítica",
      type: "checkbox",
    },
    {
      key: "IndicadorCentroCostoCheck",
      label: "Centro Costo",
      type: "checkbox",
    },
    {
      key: "IndicadorCuentaCorrienteCheck",
      label: "Cuenta Corriente",
      type: "checkbox",
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
      title={`Cuenta Contable`}
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
