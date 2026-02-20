// archivo: src/components/ConceptoPlanillaComponent.jsx
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

// Opciones estáticas
const tipoConceptoOptions = [
  { PKID: 1, Nombre: "Ingreso" },
  { PKID: 2, Nombre: "Deducción" },
  { PKID: 3, Nombre: "Cuenta Corriente" },
];

const tipoGastoOptions = [
  { PKID: 1, Nombre: "Ingreso" },
  { PKID: 2, Nombre: "Deducción" },
  { PKID: 3, Nombre: "Aporte" },
];

const tipoHoraDiaOptions = [
  { PKID: 1, Nombre: "Hora" },
  { PKID: 2, Nombre: "Dia" },
  { PKID: 3, Nombre: "Cantidad" },
];

export default function ConceptoPlanillaPage() {
  const auth = useAuthAxios();

  const [rows, setRows] = useState([]);
  const [plames, setPlames] = useState([]);
  const [situaciones, setSituaciones] = useState([]);
  const [loading, setLoading] = useState(false);

  // combos
  const loadCombos = async () => {
    try {
      const [pl, si] = await Promise.all([
        auth.get("/concepto-planilla-combos/plame"),
        auth.get("/concepto-planilla-combos/situacion"),
      ]);
      setPlames(pl.data || []);
      setSituaciones(si.data || []);
    } catch {
      alert("No se pudieron cargar los combos.");
    }
  };

  // listado
  const loadRows = async () => {
    try {
      setLoading(true);
      const res = await auth.get("/concepto-planilla/");
      setRows(res.data || []);
    } catch {
      alert("No se pudo listar Conceptos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCombos();
    loadRows();
  }, []);

  // CRUD
  const handleCreate = async (data) => {
    try {
      await auth.post("/concepto-planilla/", normalizePayload(data));
      await loadRows();
    } catch (err) {
      alert(err?.response?.data?.detail || "Error creando.");
    }
  };

  const handleUpdate = async (data) => {
    try {
      await auth.put(
        `/concepto-planilla/${data.PKID}`,
        normalizePayload(data)
      );
      await loadRows();
    } catch (err) {
      alert(err?.response?.data?.detail || "Error actualizando.");
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm("¿Eliminar Concepto?")) return;
    try {
      await auth.delete(`/concepto-planilla/${row.PKID}`);
      await loadRows();
    } catch {
      alert("No se pudo eliminar.");
    }
  };

  const normalizePayload = (form) => ({
    IDConceptoPlanilla: Number(form.IDConceptoPlanilla),
    ConceptoPlanilla: form.ConceptoPlanilla?.trim(),
    ConceptoAbreviado: form.ConceptoAbreviado?.trim() || null,
    TipoConcepto: Number(form.TipoConcepto),
    TipoConceptoGasto:
      form.TipoConceptoGasto === "" ? null : Number(form.TipoConceptoGasto),
    TipoHoraDia: Number(form.TipoHoraDia),
    IndicadorSubsidioCheck: !!form.IndicadorSubsidioCheck,
    IndicadorCuentaCorrienteCheck: !!form.IndicadorCuentaCorrienteCheck,
    IndicadorDescuentoJudicialCheck: !!form.IndicadorDescuentoJudicialCheck,
    IndicadorAfpCheck: !!form.IndicadorAfpCheck,
    IndicadorScrtSaludCheck: !!form.IndicadorScrtSaludCheck,
    IndicadorScrtPensionCheck: !!form.IndicadorScrtPensionCheck,
    IndicadorAporteEssaludCheck: !!form.IndicadorAporteEssaludCheck,
    IndicadoAporteSenatiCheck: !!form.IndicadoAporteSenatiCheck,
    IndicadorAporteSCRTCheck: !!form.IndicadorAporteSCRTCheck,
    IndicadorAporteVidaCheck: !!form.IndicadorAporteVidaCheck,
    IndicadorExclusionCostosCheck: !!form.IndicadorExclusionCostosCheck,
    PKIDPlameConcepto:
      form.PKIDPlameConcepto === "" ? null : Number(form.PKIDPlameConcepto),
    PKIDSituacionRegistro: Number(form.PKIDSituacionRegistro),
  });

  // tabla
  const tableColumns = [
    { key: "IDConceptoPlanilla", label: "ID" },
    { key: "ConceptoPlanilla", label: "Concepto" },
    { key: "ConceptoAbreviado", label: "Abrev." },
    {
      key: "TipoConcepto",
      label: "Tipo",
      render: (row) =>
        tipoConceptoOptions.find((o) => o.PKID === row.TipoConcepto)?.Nombre ||
        row.TipoConcepto,
    },
    {
      key: "TipoHoraDia",
      label: "Hora/Día",
      render: (row) =>
        tipoHoraDiaOptions.find((o) => o.PKID === row.TipoHoraDia)?.Nombre ||
        row.TipoHoraDia,
    },
    { key: "PlameConceptoNombre", label: "Plame" },
    { key: "SituacionRegistro", label: "Situación" },
    {
      key: "IndicadorAfpCheck",
      label: "AFP",
      render: (row) => (row.IndicadorAfpCheck ? "✓" : ""),
    },
    {
      key: "IndicadorAporteEssaludCheck",
      label: "Essalud",
      render: (row) => (row.IndicadorAporteEssaludCheck ? "✓" : ""),
    },
    {
      key: "IndicadorScrtPensionCheck",
      label: "SCRT",
      render: (row) =>
        row.IndicadorScrtPensionCheck || row.IndicadorScrtSaludCheck
          ? "✓"
          : "",
    },
  ];

  // modal
  const modalColumns = [
    { key: "IDConceptoPlanilla", label: "ID Concepto" },
    { key: "ConceptoPlanilla", label: "Concepto" },
    { key: "ConceptoAbreviado", label: "Abreviado" },
    {
      key: "TipoConcepto",
      label: "Tipo Concepto",
      type: "select",
      options: tipoConceptoOptions,
      displayKey: "Nombre",
    },
    {
      key: "TipoConceptoGasto",
      label: "Tipo Concepto Gasto",
      type: "select",
      options: tipoGastoOptions,
      displayKey: "Nombre",
    },
    {
      key: "TipoHoraDia",
      label: "Tipo Hora/Día",
      type: "select",
      options: tipoHoraDiaOptions,
      displayKey: "Nombre",
    },
    {
      key: "PKIDPlameConcepto",
      label: "Plame Concepto",
      type: "select",
      options: plames,
      displayKey: "PlameConcepto",
    },
    {
      key: "PKIDSituacionRegistro",
      label: "Situación",
      type: "select",
      options: situaciones,
      displayKey: "SituacionRegistro",
    },

    // checkboxes
    { key: "IndicadorSubsidioCheck", label: "Subsidio", type: "checkbox" },
    { key: "IndicadorCuentaCorrienteCheck", label: "Cuenta Corriente", type: "checkbox" },
    { key: "IndicadorDescuentoJudicialCheck", label: "Desc. Judicial", type: "checkbox" },
    { key: "IndicadorAfpCheck", label: "AFP", type: "checkbox" },
    { key: "IndicadorScrtSaludCheck", label: "SCRT Salud", type: "checkbox" },
    { key: "IndicadorScrtPensionCheck", label: "SCRT Pensión", type: "checkbox" },
    { key: "IndicadorAporteEssaludCheck", label: "Aporte Essalud", type: "checkbox" },
    { key: "IndicadoAporteSenatiCheck", label: "Aporte Senati", type: "checkbox" },
    { key: "IndicadorAporteSCRTCheck", label: "Aporte SCRT", type: "checkbox" },
    { key: "IndicadorAporteVidaCheck", label: "Aporte Vida", type: "checkbox" },
    { key: "IndicadorExclusionCostosCheck", label: "Exclusión Costos", type: "checkbox" },
  ];

  return (
    <TableGlobal
      title="Concepto de Planilla"
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
