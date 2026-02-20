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

export default function EstablecimientoPage() {
  const auth = useAuthAxios();
  const { empresaId, empresaNombre } = useGlobal() || {};

  const [rows, setRows] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [situaciones, setSituaciones] = useState([]);
  const [loading, setLoading] = useState(false);

  // combos
  const loadCombos = async () => {
    try {
      const [cTipo, cSit] = await Promise.all([
        auth.get("/establecimiento-combos/tipo-establecimiento/"),
        auth.get("/establecimiento-combos/situacion/"),
      ]);
      setTipos(cTipo.data || []);
      setSituaciones(cSit.data || []);
    } catch (err) {
      alert("No se pudieron cargar los combos.");
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
      const res = await auth.get(
        `/establecimiento/?empresaId=${empresaId}`
      );
      setRows(res.data || []);
    } catch (err) {
      alert("No se pudo listar Establecimientos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCombos();
  }, []);

  useEffect(() => {
    loadRows();
  }, [empresaId]);

  // crud
  const handleCreate = async (data) => {
    try {
      await auth.post("/establecimiento/", {
        ...data,
        PKIDEmpresa: Number(empresaId),
        IDEstablecimiento: Number(data.IDEstablecimiento),
        PKIDTipoEstablecimiento: Number(data.PKIDTipoEstablecimiento),
        TasaEstablecimiento:
          data.TasaEstablecimiento === ""
            ? null
            : Number(data.TasaEstablecimiento),
        PKIDSituacionRegistro:
          data.PKIDSituacionRegistro === ""
            ? null
            : Number(data.PKIDSituacionRegistro),
        IndicadorCentroDeRiesgoCheck: !!data.IndicadorCentroDeRiesgoCheck,
      });
      await loadRows();
    } catch (err) {
      alert(prettyError(err));
    }
  };

  const handleUpdate = async (data) => {
    try {
      await auth.put(`/establecimiento/${data.PKID}`, {
        ...data,
        PKIDEmpresa: Number(empresaId),
        IDEstablecimiento: Number(data.IDEstablecimiento),
        PKIDTipoEstablecimiento: Number(data.PKIDTipoEstablecimiento),
        TasaEstablecimiento:
          data.TasaEstablecimiento === ""
            ? null
            : Number(data.TasaEstablecimiento),
        PKIDSituacionRegistro:
          data.PKIDSituacionRegistro === ""
            ? null
            : Number(data.PKIDSituacionRegistro),
        IndicadorCentroDeRiesgoCheck: !!data.IndicadorCentroDeRiesgoCheck,
      });
      await loadRows();
    } catch (err) {
      alert(prettyError(err));
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm("¿Eliminar establecimiento?")) return;
    try {
      await auth.delete(`/establecimiento/${row.PKID}`);
      await loadRows();
    } catch (err) {
      alert(prettyError(err));
    }
  };

  // columnada de tabla
  const tableColumns = [
    { key: "IDEstablecimiento", label: "ID" },
    { key: "NombreEstablecimiento", label: "Nombre" },
    { key: "TipoEstablecimiento", label: "Tipo" },
    {
      key: "IndicadorCentroDeRiesgoCheck",
      label: "Centro Riesgo",
      render: (row) =>
        row.IndicadorCentroDeRiesgoCheck ? "Sí" : "No",
    },
    { key: "TasaEstablecimiento", label: "Tasa" },
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
    { key: "IDEstablecimiento", label: "ID Establecimiento" },
    { key: "NombreEstablecimiento", label: "Nombre Establecimiento" },
    {
      key: "PKIDTipoEstablecimiento",
      label: "Tipo Establecimiento",
      type: "select",
      options: tipos,
      displayKey: "TipoEstablecimiento",
    },
    {
      key: "IndicadorCentroDeRiesgoCheck",
      label: "Centro de Riesgo",
      type: "checkbox",
    },
    { key: "TasaEstablecimiento", label: "Tasa Establecimiento" },
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
      title={`Establecimientos`}
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
