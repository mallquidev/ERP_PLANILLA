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

export default function ContratoLaboralPage() {
  const auth = useAuthAxios();
  const { empresaId, empresaNombre } = useGlobal() || {};

  const [contratos, setContratos] = useState([]);
  const [adendas, setAdendas] = useState([]);
  const [selectedContrato, setSelectedContrato] = useState(null);

  const [trabajadores, setTrabajadores] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [situaciones, setSituaciones] = useState([]);

  // carga de combos
  const loadCombos = async () => {
    if (!empresaId) return;

    const [trab, cargo, modelo, sit] = await Promise.all([
      auth.get(`/contrato-laboral-combos/trabajador/?empresaId=${empresaId}`),
      auth.get(`/contrato-laboral-combos/cargo-empresa/?empresaId=${empresaId}`),
      auth.get(`/contrato-laboral-combos/modelo-contrato/`),
      auth.get(`/contrato-laboral-combos/situacion/`),
    ]);

    setTrabajadores(trab.data || []);
    setCargos(cargo.data || []);
    setModelos(modelo.data || []);
    setSituaciones(sit.data || []);
  };

  // contratos
  const loadContratos = async () => {
    if (!empresaId) return;
    const res = await auth.get(`/contrato-laboral/?empresaId=${empresaId}`);
    setContratos(res.data || []);
  };

  const handleCreateContrato = async (data) => {
    await auth.post(`/contrato-laboral/`, data);
    await loadContratos();
  };

  const handleUpdateContrato = async (data) => {
    await auth.put(`/contrato-laboral/${data.PKID}`, data);
    await loadContratos();
  };

  const handleDeleteContrato = async (row) => {
    await auth.delete(`/contrato-laboral/${row.PKID}`);
    await loadContratos();
  };

  // adendas
  const loadAdendas = async (contratoId) => {
    if (!contratoId) return;
    const res = await auth.get(`/adenda-contrato-laboral/?contratoId=${contratoId}`);
    setAdendas(res.data || []);
  };

  const handleCreateAdenda = async (data) => {
    await auth.post(`/adenda-contrato-laboral/`, {
      ...data,
      PKIDContratoLaboral: selectedContrato?.PKID,
    });
    await loadAdendas(selectedContrato?.PKID);
  };

  const handleUpdateAdenda = async (data) => {
    await auth.put(`/adenda-contrato-laboral/${data.PKID}`, data);
    await loadAdendas(selectedContrato?.PKID);
  };

  const handleDeleteAdenda = async (row) => {
    await auth.delete(`/adenda-contrato-laboral/${row.PKID}`);
    await loadAdendas(selectedContrato?.PKID);
  };

  useEffect(() => {
    loadCombos();
    loadContratos();
  }, [empresaId]);

  useEffect(() => {
    if (selectedContrato) {
      loadAdendas(selectedContrato.PKID);
    }
  }, [selectedContrato]);

  // confi tabla contratos
  const contratoColumns = [
    { key: "Trabajador", label: "Trabajador" },
    { key: "CargoEmpresa", label: "Cargo" },
    { key: "ModeloContratoLaboral", label: "Modelo" },
    { key: "FechaInicioContrato", label: "F. Inicio" },
    { key: "FechaFinContrato", label: "F. Fin" },
    {
      key: "PKIDEmpresa",
      label: "Empresa",
      render: () => empresaNombre, // mostramos el nombre de la empresa en la tabla
    },
  ];

  const contratoModalColumns = [
    {
      key: "PKIDEmpresa",
      label: "Empresa",
      type: "select",
      options: [{ PKID: empresaId, RazonSocial: empresaNombre }], // solo la empresa del contexto
      displayKey: "RazonSocial",
      disabled: true, // bloqueado para agregar/editar
      defaultValue: empresaId,
    },
    {
      key: "PKIDTrabajador",
      label: "Trabajador",
      type: "select",
      options: trabajadores,
      displayKey: "NombreCompleto",
    },
    {
      key: "PKIDCargoEmpresa",
      label: "Cargo Emprsa",
      type: "select",
      options: cargos,
      displayKey: "CargoEmpresa",
    },
    {
      key: "PKIDModeloContratoLaboral",
      label: "Modelo Contrato",
      type: "select",
      options: modelos,
      displayKey: "ModeloContratoLaboral",
    },
    {
      key: "PKIDSituacionRegistro",
      label: "Situación",
      type: "select",
      options: situaciones,
      displayKey: "SituacionRegistro",
    },
    { key: "IDContratoLaboral", label: "ID Contrato" },
    { key: "FechaRegistroContrato", label: "Fecha Registro", type: "date" },
    { key: "FechaInicioContrato", label: "Fecha Inicio", type: "date" },
    { key: "FechaFinContrato", label: "Fecha Fin", type: "date" },
    { key: "GlosaContrato", label: "Glosa" },
  ];


  // confi tabla Adenda
  const adendaColumns = [
    { key: "IDAdendaContratoLaboral", label: "ID Adenda" },
    { key: "GlosaAdenda", label: "Glosa" },
    { key: "FechaInicioAdenda", label: "Inicio" },
    { key: "FechaFinAdenda", label: "Fin" },
  ];

  const adendaModalColumns = [
    { key: "IDAdendaContratoLaboral", label: "ID Adenda" },
    { key: "GlosaAdenda", label: "Glosa" },
    { key: "FechaInicioAdenda", label: "Fecha Inicio", type: "date" },
    { key: "FechaFinAdenda", label: "Fecha Fin", type: "date" },
    {
      key: "PKIDSituacionRegistro",
      label: "Situación",
      type: "select",
      options: situaciones,
      displayKey: "SituacionRegistro",
    },
  ];

  return (
    <div >
      <TableGlobal
        title="Contrato Laboral"
        data={contratos}
        columns={contratoColumns}
        modalColumns={contratoModalColumns}
        onCreate={handleCreateContrato}
        onUpdate={handleUpdateContrato}
        onDelete={handleDeleteContrato}
        onRowClick={(row) => setSelectedContrato(row)}
      />

      {selectedContrato && (
        <div style={{ marginTop: 30 }}>
          <TableGlobal
            title={`Adendas - ID ${selectedContrato.IDContratoLaboral}`}
            data={adendas}
            columns={adendaColumns}
            modalColumns={adendaModalColumns}
            onCreate={handleCreateAdenda}
            onUpdate={handleUpdateAdenda}
            onDelete={handleDeleteAdenda}
          />
        </div>
      )}
    </div>
  );
}
