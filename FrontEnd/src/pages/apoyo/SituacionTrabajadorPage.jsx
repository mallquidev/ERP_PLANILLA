import React, { useEffect, useState, useMemo } from "react";
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

export default function SituacionTrabajadorPage() {
  const auth = useAuthAxios();

  const [rows, setRows] = useState([]);
  const [situacionesRegistro, setSituacionesRegistro] = useState([]);

  // =============================
  // CARGAR DATA
  // =============================

  const loadRows = async () => {
    try {
      const res = await auth.get("/situacion_trabajador/");
      setRows(res.data || []);
    } catch (err) {
      alert("Error cargando situaciones trabajador.");
    }
  };

  const loadCombos = async () => {
    try {
      const res = await auth.get("/situacion/");
      setSituacionesRegistro(res.data || []);
    } catch (err) {
      alert("Error cargando situaciones registro.");
    }
  };

  useEffect(() => {
    loadRows();
    loadCombos();
  }, []);

  // =============================
  // CRUD
  // =============================

  const handleCreate = async (formData) => {
    const payload = {
      IDSituacionTrabajador: Number(formData.IDSituacionTrabajador),
      SituacionTrabajador: formData.SituacionTrabajador,
      PKIDSituacionRegistro: Number(formData.PKIDSituacionRegistro),
    };

    if (
      !payload.IDSituacionTrabajador ||
      !payload.SituacionTrabajador?.trim() ||
      !payload.PKIDSituacionRegistro
    ) {
      alert("Todos los campos son obligatorios.");
      return;
    }

    try {
      await auth.post("/situacion_trabajador/", payload);
      await loadRows();
    } catch (err) {
      alert(err?.response?.data?.detail || "Error creando registro.");
    }
  };

  const handleUpdate = async (formData) => {
    const payload = {
      IDSituacionTrabajador: Number(formData.IDSituacionTrabajador),
      SituacionTrabajador: formData.SituacionTrabajador,
      PKIDSituacionRegistro: Number(formData.PKIDSituacionRegistro),
    };

    try {
      await auth.put(`/situacion_trabajador/${formData.PKID}`, payload);
      await loadRows();
    } catch (err) {
      alert(err?.response?.data?.detail || "Error actualizando registro.");
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm("¿Eliminar registro?")) return;

    try {
      await auth.delete(`/situacion_trabajador/${item.PKID}`);
      await loadRows();
    } catch (err) {
      alert(err?.response?.data?.detail || "Error eliminando registro.");
    }
  };

  // =============================
  // COLUMNAS TABLA
  // =============================

  const tableColumns = [
    { key: "PKID", label: "PKID" },
    { key: "IDSituacionTrabajador", label: "ID Situación Trabajador" },
    { key: "SituacionTrabajador", label: "Descripción" },
    {
      key: "PKIDSituacionRegistro",
      label: "Situación Registro",
      type: "select",
      options: situacionesRegistro,
      displayKey: "SituacionRegistro",
    },
  ];

  // =============================
  // COLUMNAS MODAL
  // =============================

  const modalColumns = [
    {
      key: "IDSituacionTrabajador",
      label: "ID Situación Trabajador",
      type: "number",
      disabledOnEdit: true,
    },
    {
      key: "SituacionTrabajador",
      label: "Descripción",
      type: "text",
    },
    {
      key: "PKIDSituacionRegistro",
      label: "Situación Registro",
      type: "select",
      options: situacionesRegistro,
      displayKey: "SituacionRegistro",
    },
  ];

  return (
    <TableGlobal
      title="Situación Trabajador"
      data={rows}
      columns={tableColumns}
      modalColumns={modalColumns}
      onCreate={handleCreate}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
    />
  );
}