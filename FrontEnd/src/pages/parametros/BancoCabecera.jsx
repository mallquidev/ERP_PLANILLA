// frontend/src/components/BancoCabeceraComponent.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import API_BASE_URL from "../../api";
import TableGlobal from "../../ui/table/TableGlobal";

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
});

export default function BancoCabecera({ onSelectBanco }) {
  const [bancos, setBancos] = useState([]);
  const [situaciones, setSituaciones] = useState([]);

  const axiosCfg = useMemo(() => ({ headers: authHeaders() }), []);

  // ---------------- LOAD ----------------
  useEffect(() => {
    loadBancos();
    loadSituaciones();
  }, []);

  const loadSituaciones = async () => {
    const rs = await axios.get(`${API_BASE_URL}/banco-combos/situaciones`, axiosCfg);
    setSituaciones(rs.data || []);
  };

  const loadBancos = async () => {
    const rs = await axios.get(`${API_BASE_URL}/banco/`, axiosCfg);
    setBancos(rs.data || []);
  };

  // ---------------- CRUD ----------------
  const createBanco = async (data) => {
    await axios.post(`${API_BASE_URL}/banco/`, {
      ...data,
      IDBanco: Number(data.IDBanco),
      PKIDSituacionRegistro: Number(data.PKIDSituacionRegistro)
    }, axiosCfg);
    loadBancos();
  };

  const updateBanco = async (data) => {
    await axios.put(`${API_BASE_URL}/banco/${data.PKID}`, {
      ...data,
      IDBanco: Number(data.IDBanco),
      PKIDSituacionRegistro: Number(data.PKIDSituacionRegistro)
    }, axiosCfg);
    loadBancos();
  };

  const deleteBanco = async (data) => {
    await axios.delete(`${API_BASE_URL}/banco/${data.PKID}`, axiosCfg);
    loadBancos();
  };

  // ---------------- TABLE CONFIG ----------------
  const columns = [
    { key: "IDBanco", label: "IDBanco" },
    { key: "Banco", label: "Banco" },
    { key: "SiglasBanco", label: "Siglas" },
    {
      key: "PKIDSituacionRegistro",
      label: "Situación",
      options: situaciones,
      displayKey: "SituacionRegistro"
    },
    {
      key: "select",
      label: "Ver Cuentas",
      render: (row) => (
        <button
          className="text-blue-600 underline"
          onClick={() => onSelectBanco(row.PKID)}
        >
          📂
        </button>
      )
    }
  ];

  const modalColumns = [
    { key: "IDBanco", label: "IDBanco", type: "number" },
    { key: "Banco", label: "Banco" },
    { key: "SiglasBanco", label: "Siglas" },
    {
      key: "PKIDSituacionRegistro",
      label: "Situación",
      type: "select",
      options: situaciones,
      optionLabel: "SituacionRegistro",
      optionValue: "PKID"
    }
  ];

  return (
    <TableGlobal
      title="Banco (Cabecera)"
      data={bancos}
      columns={columns}
      modalColumns={modalColumns}
      onCreate={createBanco}
      onUpdate={updateBanco}
      onDelete={deleteBanco}
    />
  );
}
