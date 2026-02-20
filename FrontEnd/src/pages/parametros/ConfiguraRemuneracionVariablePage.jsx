// src/components/ConfiguraRemuneracionVariableComponent.jsx
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

function prettyError(err) {
  const d = err?.response?.data;
  if (!d) return err?.message || "Error";
  if (Array.isArray(d.detail))
    return d.detail.map((e) => `• ${e.msg}`).join("\n");
  return String(d.detail || "Error");
}

export default function ConfiguraRemuneracionVariablePage() {
  const auth = useAuthAxios();

  const [rows, setRows] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [tiposProceso, setTiposProceso] = useState([]);
  const [situaciones, setSituaciones] = useState([]);
  const [loading, setLoading] = useState(false);

  // combos
  const loadCombos = async () => {
    try {
      const [emp, tipo, sit] = await Promise.all([
        auth.get("/configura-remuneracion-variable-combos/empresa/"),
        auth.get("/configura-remuneracion-variable-combos/tipoproceso/"),
        auth.get("/configura-remuneracion-variable-combos/situacion/"),
      ]);
      setEmpresas(emp.data || []);
      setTiposProceso(tipo.data || []);
      setSituaciones(sit.data || []);
    } catch (err) {
      alert("No se pudieron cargar los combos.");
    }
  };

  // Listado
  const loadRows = async () => {
    try {
      setLoading(true);
      const res = await auth.get("/configura-remuneracion-variable/");
      setRows(res.data || []);
    } catch (err) {
      alert("No se pudo listar la configuración.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCombos();
    loadRows();
  }, []);

  // crud
  const handleCreate = async (data) => {
    try {
      await auth.post("/configura-remuneracion-variable/", {
        PKIDEmpresa: Number(data.PKIDEmpresa),
        Ano: Number(data.Ano),
        Mes: Number(data.Mes),
        Transaccion: String(data.Transaccion).slice(0, 4),
        Descripcion: String(data.Descripcion || "").trim(),
        NumeroMesesAnterior: Number(data.NumeroMesesAnterior || 0),
        NumeroMesesMinimos: Number(data.NumeroMesesMinimos || 0),
        FactorDivision: Number(data.FactorDivision || 0),
        PKIDTipoProceso: Number(data.PKIDTipoProceso),
        APartirMesAnterior: !!data.APartirMesAnterior,
        FactorTiempoServicio: Number(data.FactorTiempoServicio || 0),
        CondiserarInicioPeriodo: !!data.CondiserarInicioPeriodo,
        ConsiderarSoloVariables: !!data.ConsiderarSoloVariables,
        GuardarDatosCalculo: !!data.GuardarDatosCalculo,
        AplicarComisionPromedio: !!data.AplicarComisionPromedio,
        PKIDSituacionRegistro: Number(data.PKIDSituacionRegistro),
      });
      await loadRows();
    } catch (err) {
      alert(prettyError(err));
    }
  };

  const handleUpdate = async (data) => {
    try {
      await auth.put(`/configura-remuneracion-variable/${data.PKID}`, {
        PKID: data.PKID,
        PKIDEmpresa: Number(data.PKIDEmpresa),
        Ano: Number(data.Ano),
        Mes: Number(data.Mes),
        Transaccion: String(data.Transaccion).slice(0, 4),
        Descripcion: String(data.Descripcion || "").trim(),
        NumeroMesesAnterior: Number(data.NumeroMesesAnterior || 0),
        NumeroMesesMinimos: Number(data.NumeroMesesMinimos || 0),
        FactorDivision: Number(data.FactorDivision || 0),
        PKIDTipoProceso: Number(data.PKIDTipoProceso),
        APartirMesAnterior: !!data.APartirMesAnterior,
        FactorTiempoServicio: Number(data.FactorTiempoServicio || 0),
        CondiserarInicioPeriodo: !!data.CondiserarInicioPeriodo,
        ConsiderarSoloVariables: !!data.ConsiderarSoloVariables,
        GuardarDatosCalculo: !!data.GuardarDatosCalculo,
        AplicarComisionPromedio: !!data.AplicarComisionPromedio,
        PKIDSituacionRegistro: Number(data.PKIDSituacionRegistro),
      });
      await loadRows();
    } catch (err) {
      alert(prettyError(err));
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm("¿Eliminar configuración?")) return;
    try {
      await auth.delete(`/configura-remuneracion-variable/${row.PKID}`);
      await loadRows();
    } catch (err) {
      alert(prettyError(err));
    }
  };

  // columnada de tabla
  const tableColumns = [
    { key: "Ano", label: "Año" },
    { key: "Mes", label: "Mes" },
    { key: "Transaccion", label: "Transacción" },
    { key: "Descripcion", label: "Descripción" },
    { key: "Empresa", label: "Empresa" },
    { key: "TipoProceso", label: "Tipo Proceso" },
    { key: "SituacionRegistro", label: "Situación" },
  ];

  // Columna modal
  const modalColumns = [
    {
      key: "PKIDEmpresa",
      label: "Empresa",
      type: "select",
      options: empresas,
      displayKey: "Empresa",
    },
    { key: "Ano", label: "Año", type: "number" },
    { key: "Mes", label: "Mes", type: "number" },
    { key: "Transaccion", label: "Transacción" },
    { key: "Descripcion", label: "Descripción" },
    { key: "NumeroMesesAnterior", label: "N° Meses Anterior", type: "number" },
    { key: "NumeroMesesMinimos", label: "N° Meses Mínimos", type: "number" },
    { key: "FactorDivision", label: "Factor División", type: "number" },
    {
      key: "PKIDTipoProceso",
      label: "Tipo Proceso",
      type: "select",
      options: tiposProceso,
      displayKey: "TipoProceso",
    },
    { key: "FactorTiempoServicio", label: "Factor Tiempo Servicio", type: "number" },
    { key: "APartirMesAnterior", label: "A partir mes anterior", type: "checkbox" },
    { key: "CondiserarInicioPeriodo", label: "Considerar inicio periodo", type: "checkbox" },
    { key: "ConsiderarSoloVariables", label: "Considerar solo variables", type: "checkbox" },
    { key: "GuardarDatosCalculo", label: "Guardar datos cálculo", type: "checkbox" },
    { key: "AplicarComisionPromedio", label: "Aplicar comisión promedio", type: "checkbox" },
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
      title={`Configuración Remuneración Variable`}
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