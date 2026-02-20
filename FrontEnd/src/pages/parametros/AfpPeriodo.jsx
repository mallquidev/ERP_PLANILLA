// archivo: src/components/AfpPeriodoComponent.jsx
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

export default function AfpPeriodo({ selectedAfp }) {
  const auth = useAuthAxios();
  const { periodo } = useGlobal();

  const [rows, setRows] = useState([]);
  const [comboConceptos, setComboConceptos] = useState([]);
  const [comboSituaciones, setComboSituaciones] = useState([]);
  const [loading, setLoading] = useState(false);

  // combos
  const loadCombos = async () => {
    const [c1, c2] = await Promise.all([
      auth.get("/afp-combos/conceptos"),
      auth.get("/afp-combos/situaciones"),
    ]);
    setComboConceptos(c1.data || []);
    setComboSituaciones(c2.data || []);
  };

  // Listado
  const loadRows = async () => {
    if (!selectedAfp || !periodo?.ano || !periodo?.mes) {
      setRows([]);
      return;
    }

    setLoading(true);
    const res = await auth.get(`/afp/${selectedAfp}/periodos`, {
      params: { Ano: periodo.ano, Mes: periodo.mes },
    });
    setRows(res.data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadCombos();
  }, []);

  useEffect(() => {
    loadRows();
  }, [selectedAfp, periodo]);

  // crud
  const handleCreate = async (data) => {
    await auth.post(`/afp/${selectedAfp}/periodos`, {
      ...data,
      Ano: periodo.ano,
      Mes: periodo.mes,
    });
    await loadRows();
  };

  const handleUpdate = async (data) => {
    await auth.put(`/afp/periodos/${data.PKID}`, data);
    await loadRows();
  };

  const handleDelete = async (row) => {
    if (!window.confirm("¿Eliminar línea?")) return;
    await auth.delete(`/afp/periodos/${row.PKID}`);
    await loadRows();
  };

  // columnada de tabla
  const tableColumns = [
    { key: "Ano", label: "Año" },
    { key: "Mes", label: "Mes" },
    { key: "ConceptoPlanilla", label: "Concepto" },
    { key: "PorcentajeTrabajador", label: "% Trabajador" },
    { key: "PorcentajeMixta", label: "% Mixta" },
    { key: "SituacionRegistro", label: "Situación" },
    { key: "TopeAfp", label: "Tope AFP" },
  ];

  // Columna modal
  const modalColumns = [
    {
      key: "Ano",
      label: "Año",
      defaultValue: periodo?.ano,
      disabled: true,
    },
    {
      key: "Mes",
      label: "Mes",
      defaultValue: periodo?.mes,
      disabled: true,
    },
    {
      key: "PKIDConceptoPlanilla",
      label: "Concepto",
      type: "select",
      options: comboConceptos,
      displayKey: "ConceptoPlanilla",
    },
    { key: "PorcentajeTrabajador", label: "% Trabajador" },
    { key: "PorcentajeMixta", label: "% Mixta" },
    {
      key: "PKIDSituacionRegistro",
      label: "Situación",
      type: "select",
      options: comboSituaciones,
      displayKey: "SituacionRegistro",
    },
    { key: "TopeAfp", label: "Tope AFP" },
  ];

  return (
    <TableGlobal
      title={`AFP Periodo`}
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
