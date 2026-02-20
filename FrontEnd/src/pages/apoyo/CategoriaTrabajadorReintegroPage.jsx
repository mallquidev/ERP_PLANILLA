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

export default function CategoriaTrabajadorReintegroPage() {
  const auth = useAuthAxios();
  const { empresaId, empresaNombre, nominaId, nominaNombre, periodo } =
    useGlobal() || {};

  const [rows, setRows] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [situaciones, setSituaciones] = useState([]);
  const [loading, setLoading] = useState(false);

  // combos
  const loadCombos = async () => {
    try {
      const [catRes, sitRes] = await Promise.all([
        auth.get("/ctr-combos/categorias"),
        auth.get("/ctr-combos/situaciones"),
      ]);
      setCategorias(catRes.data || []);
      setSituaciones(sitRes.data || []);
    } catch (err) {
      alert("No se pudieron cargar los combos.");
    }
  };

  // listado filtrado por contexto
  const loadRows = async () => {
    if (!empresaId || !nominaId || !periodo?.ano || !periodo?.mes) {
      setRows([]);
      return;
    }

    try {
      setLoading(true);
      const res = await auth.get("/ctr", {
        params: {
          PKIDEmpresa: empresaId,
          Ano: periodo.ano,
          Mes: periodo.mes,
          PKIDNomina: nominaId,
        },
      });
      setRows(res.data || []);
    } catch (err) {
      alert("No se pudo listar los registros.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCombos();
  }, []);

  useEffect(() => {
    loadRows();
  }, [empresaId, nominaId, periodo]);

  // create
  const handleCreate = async (data) => {
    try {
      await auth.post("/ctr/", {
        PKIDEmpresa: Number(empresaId),
        Ano: Number(periodo?.ano),
        Mes: Number(periodo?.mes),
        PKIDNomina: Number(nominaId),
        PKIDCategoriaTrabajador: Number(data.PKIDCategoriaTrabajador),
        ImporteReintegro1: Number(data.ImporteReintegro1 || 0),
        ImporteReintegro2: Number(data.ImporteReintegro2 || 0),
        ImporteReintegro3: Number(data.ImporteReintegro3 || 0),
        ImporteReintegro4: Number(data.ImporteReintegro4 || 0),
        ImporteReintegro5: Number(data.ImporteReintegro5 || 0),
        ImporteReintegro6: Number(data.ImporteReintegro6 || 0),
        PKIDSituacionRegistro: Number(data.PKIDSituacionRegistro),
      });
      await loadRows();
    } catch (err) {
      alert(prettyError(err));
    }
  };

  // update
  const handleUpdate = async (data) => {
    try {
      await auth.put(`/ctr/${data.PKID}`, {
        PKIDCategoriaTrabajador: Number(data.PKIDCategoriaTrabajador),
        ImporteReintegro1: Number(data.ImporteReintegro1 || 0),
        ImporteReintegro2: Number(data.ImporteReintegro2 || 0),
        ImporteReintegro3: Number(data.ImporteReintegro3 || 0),
        ImporteReintegro4: Number(data.ImporteReintegro4 || 0),
        ImporteReintegro5: Number(data.ImporteReintegro5 || 0),
        ImporteReintegro6: Number(data.ImporteReintegro6 || 0),
        PKIDSituacionRegistro: Number(data.PKIDSituacionRegistro),
      });
      await loadRows();
    } catch (err) {
      alert(prettyError(err));
    }
  };

  // delete
  const handleDelete = async (row) => {
    if (!window.confirm("¿Eliminar registro?")) return;
    try {
      await auth.delete(`/ctr/${row.PKID}`);
      await loadRows();
    } catch (err) {
      alert(prettyError(err));
    }
  };

  // tabla
  const tableColumns = [
    { key: "CategoriaTrabajador", label: "Categoría" },
    { key: "SituacionRegistro", label: "Situación" },
    {
      key: "ImporteReintegro1",
      label: "Imp1",
      render: (row) => Number(row.ImporteReintegro1 || 0).toFixed(2),
    },
    {
      key: "ImporteReintegro2",
      label: "Imp2",
      render: (row) => Number(row.ImporteReintegro2 || 0).toFixed(2),
    },
    {
      key: "ImporteReintegro3",
      label: "Imp3",
      render: (row) => Number(row.ImporteReintegro3 || 0).toFixed(2),
    },
    {
      key: "ImporteReintegro4",
      label: "Imp4",
      render: (row) => Number(row.ImporteReintegro4 || 0).toFixed(2),
    },
    {
      key: "ImporteReintegro5",
      label: "Imp5",
      render: (row) => Number(row.ImporteReintegro5 || 0).toFixed(2),
    },
    {
      key: "ImporteReintegro6",
      label: "Imp6",
      render: (row) => Number(row.ImporteReintegro6 || 0).toFixed(2),
    },
  ];

  // modal
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
    {
      key: "Ano",
      label: "Año",
      type: "number",
      disabled: true,
      defaultValue: periodo?.ano,
    },
    {
      key: "Mes",
      label: "Mes",
      type: "number",
      disabled: true,
      defaultValue: periodo?.mes,
    },
    {
      key: "PKIDNomina",
      label: "Nómina",
      type: "select",
      options: nominaId
        ? [{ PKID: nominaId, Nomina: nominaNombre }]
        : [],
      displayKey: "Nomina",
      disabled: true,
      defaultValue: nominaId,
    },
    {
      key: "PKIDCategoriaTrabajador",
      label: "Categoría Trabajador",
      type: "select",
      options: categorias,
      displayKey: "CategoriaTrabajador",
    },
    {
      key: "ImporteReintegro1",
      label: "Importe 1",
      type: "number",
    },
    {
      key: "ImporteReintegro2",
      label: "Importe 2",
      type: "number",
    },
    {
      key: "ImporteReintegro3",
      label: "Importe 3",
      type: "number",
    },
    {
      key: "ImporteReintegro4",
      label: "Importe 4",
      type: "number",
    },
    {
      key: "ImporteReintegro5",
      label: "Importe 5",
      type: "number",
    },
    {
      key: "ImporteReintegro6",
      label: "Importe 6",
      type: "number",
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
      title="Reintegros por Categoría de Trabajador"
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