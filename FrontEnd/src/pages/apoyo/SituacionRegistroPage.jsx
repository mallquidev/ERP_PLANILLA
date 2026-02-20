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

export default function SituacionRegistroPage() {
  const auth = useAuthAxios();

  const [rows, setRows] = useState([]);

  // =============================
  // CARGAR DATA
  // =============================
  const loadRows = async () => {
    try {
      const res = await auth.get("/situacion/");
      setRows(res.data || []);
    } catch (err) {
      alert("Error al cargar las situaciones.");
    }
  };

  useEffect(() => {
    loadRows();
  }, []);

  // =============================
  // CRUD
  // =============================

  const handleCreate = async (formData) => {
    const id = parseInt(formData.IDSituacionRegistro);

    if (isNaN(id) || !formData.SituacionRegistro?.trim()) {
      alert("Todos los campos son obligatorios y el ID debe ser numérico.");
      return;
    }

    try {
      await auth.post("/situacion/", formData);
      await loadRows();
    } catch (err) {
      alert(err?.response?.data?.detail || "Error creando situación.");
    }
  };

  const handleUpdate = async (formData) => {
    const id = parseInt(formData.IDSituacionRegistro);

    if (isNaN(id) || !formData.SituacionRegistro?.trim()) {
      alert("Datos inválidos.");
      return;
    }

    try {
      await auth.put(`/situacion/${id}`, formData);
      await loadRows();
    } catch (err) {
      alert(err?.response?.data?.detail || "Error actualizando situación.");
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm("¿Eliminar situación?")) return;

    try {
      await auth.delete(`/situacion/${item.IDSituacionRegistro}`);
      await loadRows();
    } catch (err) {
      alert(err?.response?.data?.detail || "Error eliminando situación.");
    }
  };

  // =============================
  // COLUMNAS TABLA
  // =============================

  const tableColumns = [
    { key: "IDSituacionRegistro", label: "ID" },
    { key: "SituacionRegistro", label: "Descripción" },
  ];

  // =============================
  // COLUMNAS MODAL
  // =============================

  const modalColumns = [
    {
      key: "IDSituacionRegistro",
      label: "ID Situación",
      type: "number",
      disabledOnEdit: true, // si tu TableGlobal soporta esta bandera
    },
    {
      key: "SituacionRegistro",
      label: "Descripción",
      type: "text",
    },
  ];

  return (
    <TableGlobal
      title="Situación de Registro"
      data={rows}
      columns={tableColumns}
      modalColumns={modalColumns}
      onCreate={handleCreate}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
    />
  );
}