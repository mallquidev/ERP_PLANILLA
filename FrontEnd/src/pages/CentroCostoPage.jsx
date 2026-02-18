import React, { useEffect, useState, useMemo } from "react";
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

export default function CentroCostoComponent() {
  const auth = useAuthAxios();
  const { empresaId, empresaNombre } = useGlobal(); // tomamos el nombre de la empresa del contexto

  const [rows, setRows] = useState([]);
  const [situaciones, setSituaciones] = useState([]);

  // Cargar combos
  const loadCombos = async () => {
    try {
      const sitRes = await auth.get("/cc-combos/situaciones");
      setSituaciones(sitRes.data || []);
    } catch (err) {
      alert("No se pudieron cargar los combos.");
    }
  };

  // Cargar centros de costo
  const loadRows = async () => {
    if (!empresaId) return;
    try {
      const res = await auth.get("/centro-costo", { params: { PKIDEmpresa: empresaId } });
      setRows(res.data || []);
    } catch (err) {
      alert("No se pudieron cargar los centros de costo.");
    }
  };

  useEffect(() => {
    loadCombos();
    loadRows();
  }, [empresaId]);

  const normalizeNumbers = (payload) => {
    ["PKIDEmpresa", "IDCentroCosto", "PKIDSituacionRegistro", "PKID"].forEach((k) => {
      payload[k] = payload[k] ? Number(payload[k]) : null;
    });
    return payload;
  };

  // CRUD
  const handleCreate = async (formData) => {
    try {
      await auth.post("/centro-costo/", normalizeNumbers({ ...formData, PKIDEmpresa: empresaId }));
      await loadRows();
    } catch (err) {
      alert(err?.response?.data?.detail || err.message || "Error creando centro de costo.");
    }
  };

  const handleUpdate = async (formData) => {
    try {
      await auth.put(`/centro-costo/${formData.PKID}`, normalizeNumbers({ ...formData, PKIDEmpresa: empresaId }));
      await loadRows();
    } catch (err) {
      alert(err?.response?.data?.detail || err.message || "Error actualizando centro de costo.");
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm("¿Eliminar centro de costo?")) return;
    try {
      await auth.delete(`/centro-costo/${item.PKID}`);
      await loadRows();
    } catch (err) {
      alert(err?.response?.data?.detail || err.message || "Error eliminando centro de costo.");
    }
  };

  // Columnas para la tabla
  const tableColumns = [
    { key: "IDCentroCosto", label: "ID Centro Costo" },
    { key: "CentroCosto", label: "Centro Costo" },
    {
      key: "PKIDSituacionRegistro",
      label: "Situación",
      type: "select",
      options: situaciones,
      displayKey: "SituacionRegistro",
    },
    {
      key: "PKIDEmpresa",
      label: "Empresa",
      render: () => empresaNombre, // mostramos el nombre de la empresa en la tabla
    },
  ];

  // Columnas para el modal
  const modalColumns = [
    {
      key: "PKIDEmpresa",
      label: "Empresa",
      type: "select",
      options: [{ PKID: empresaId, RazonSocial: empresaNombre }], // solo la empresa del contexto
      displayKey: "RazonSocial",
      disabled: true, // bloqueado para agregar/editar
      defaultValue: empresaId,
    },
    { key: "IDCentroCosto", label: "ID Centro Costo" },
    { key: "CentroCosto", label: "Centro Costo" },
    { key: "PKIDSituacionRegistro", label: "Situación", type: "select", options: situaciones, displayKey: "SituacionRegistro" },
  ];

  return (
    <TableGlobal
      title="Centro de Costo"
      data={rows}
      columns={tableColumns}
      modalColumns={modalColumns}
      onCreate={handleCreate}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
    />
  );
}
