// frontend/src/components/BancoCuentaComponent.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import API_BASE_URL from "../../api";
import TableGlobal from "../../ui/table/TableGlobal";
import { useGlobal } from "../../GlobalContext";

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
});

export default function BancoCuenta({ bancoPkid }) {
  const { empresaId } = useGlobal();
  const [cuentas, setCuentas] = useState([]);
  const [situaciones, setSituaciones] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [tiposCuenta, setTiposCuenta] = useState([]);

  const axiosCfg = useMemo(() => ({ headers: authHeaders() }), []);

  useEffect(() => {
    loadCombos();
  }, []);

  useEffect(() => {
    if (bancoPkid && empresaId) {
      loadCuentas();
    }
  }, [bancoPkid, empresaId]);

  const loadCombos = async () => {
    const [rsSit, rsMon, rsTip] = await Promise.all([
      axios.get(`${API_BASE_URL}/banco-combos/situaciones`, axiosCfg),
      axios.get(`${API_BASE_URL}/banco-combos/monedas`, axiosCfg),
      axios.get(`${API_BASE_URL}/banco-combos/tipos-cuenta`, axiosCfg),
    ]);
    setSituaciones(rsSit.data || []);
    setMonedas(rsMon.data || []);
    setTiposCuenta(rsTip.data || []);
  };

  const loadCuentas = async () => {
    const rs = await axios.get(
      `${API_BASE_URL}/banco/${bancoPkid}/cuentas`,
      { ...axiosCfg, params: { IDEmpresa: empresaId } }
    );
    setCuentas(rs.data || []);
  };

  const createCuenta = async (data) => {
    await axios.post(
      `${API_BASE_URL}/banco/${bancoPkid}/cuentas`,
      {
        ...data,
        IDEmpresa: empresaId,
        PKIDMoneda: Number(data.PKIDMoneda),
        PKIDTipoCuentaBanco: Number(data.PKIDTipoCuentaBanco),
        PKIDSituacionRegistro: Number(data.PKIDSituacionRegistro),
      },
      axiosCfg
    );
    loadCuentas();
  };

  const updateCuenta = async (data) => {
    await axios.put(
      `${API_BASE_URL}/banco/cuentas/${data.PKID}`,
      {
        ...data,
        IDEmpresa: empresaId,
        PKIDMoneda: Number(data.PKIDMoneda),
        PKIDTipoCuentaBanco: Number(data.PKIDTipoCuentaBanco),
        PKIDSituacionRegistro: Number(data.PKIDSituacionRegistro),
      },
      axiosCfg
    );
    loadCuentas();
  };

  const deleteCuenta = async (data) => {
    await axios.delete(`${API_BASE_URL}/banco/cuentas/${data.PKID}`, axiosCfg);
    loadCuentas();
  };

  const columns = [
    {
      key: "PKIDMoneda",
      label: "Moneda",
      options: monedas,
      displayKey: "Moneda"
    },
    { key: "NumeroCuenta", label: "Nro Cuenta" },
    { key: "NumeroCuenta2", label: "Nro Cuenta 2" },
    {
      key: "PKIDTipoCuentaBanco",
      label: "Tipo Cuenta",
      options: tiposCuenta,
      displayKey: "TipoCuentaBanco"
    },
    {
      key: "PKIDSituacionRegistro",
      label: "Situación",
      options: situaciones,
      displayKey: "SituacionRegistro"
    }
  ];

  const modalColumns = [
    {
      key: "IDEmpresa",
      label: "Empresa",
      type: "number",
      defaultValue: empresaId,
      disabled: true
    },
    {
      key: "PKIDMoneda",
      label: "Moneda",
      type: "select",
      options: monedas,
      optionLabel: "Moneda",
      optionValue: "PKID"
    },
    { key: "NumeroCuenta", label: "Número Cuenta" },
    { key: "NumeroCuenta2", label: "Número Cuenta 2" },
    {
      key: "PKIDTipoCuentaBanco",
      label: "Tipo Cuenta",
      type: "select",
      options: tiposCuenta,
      optionLabel: "TipoCuentaBanco",
      optionValue: "PKID"
    },
    {
      key: "PKIDSituacionRegistro",
      label: "Situación",
      type: "select",
      options: situaciones,
      optionLabel: "SituacionRegistro",
      optionValue: "PKID"
    }
  ];

  if (!bancoPkid) return null;

  return (
    <TableGlobal
      title="BancoCuenta (Detalle)"
      data={cuentas}
      columns={columns}
      modalColumns={modalColumns}
      onCreate={createCuenta}
      onUpdate={updateCuenta}
      onDelete={deleteCuenta}
    />
  );
}
