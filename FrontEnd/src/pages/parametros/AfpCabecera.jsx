// archivo: src/components/AfpCabeceraComponent.jsx
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

export default function AfpCabecera({ onSelectAfp }) {
  const auth = useAuthAxios();

  const [rows, setRows] = useState([]);
  const [comboSituaciones, setComboSituaciones] = useState([]);
  const [comboCuentas, setComboCuentas] = useState([]);
  const [loading, setLoading] = useState(false);

  // combos
  const loadCombos = async () => {
    try {
      const [c1, c2] = await Promise.all([
        auth.get("/afp-combos/situaciones"),
        auth.get("/afp-combos/cuentas"),
      ]);
      setComboSituaciones(c1.data || []);
      setComboCuentas(c2.data || []);
    } catch {
      alert("No se pudieron cargar combos.");
    }
  };

  // Listado
  const loadRows = async () => {
    try {
      setLoading(true);
      const res = await auth.get("/afp/");
      setRows(res.data || []);
    } catch {
      alert("No se pudo listar AFP.");
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
      await auth.post("/afp/", {
        ...data,
        IDAfp: Number(data.IDAfp),
        PKIDCuentaContable: data.PKIDCuentaContable || null,
        PKIDSituacionRegistro: Number(data.PKIDSituacionRegistro),
      });
      await loadRows();
    } catch (err) {
      alert(prettyError(err));
    }
  };

  const handleUpdate = async (data) => {
    try {
      await auth.put(`/afp/${data.PKID}`, {
        ...data,
        IDAfp: Number(data.IDAfp),
        PKIDCuentaContable: data.PKIDCuentaContable || null,
        PKIDSituacionRegistro: Number(data.PKIDSituacionRegistro),
      });
      await loadRows();
    } catch (err) {
      alert(prettyError(err));
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm("¿Eliminar AFP?")) return;
    try {
      await auth.delete(`/afp/${row.PKID}`);
      await loadRows();
    } catch (err) {
      alert(prettyError(err));
    }
  };

  // columnada de tabla
  const tableColumns = [
    {
      key: "select",
      label: "Sel",
      render: (row) => (
        <input
          type="radio"
          name="afpSelect"
          onChange={() => onSelectAfp(row.PKID)}
        />
      ),
    },
    { key: "IDAfp", label: "ID" },
    { key: "Afp", label: "AFP" },
    { key: "IndicadorPublicoPrivado", label: "Indicador" },
    { key: "CuentaContable", label: "Cuenta" },
    { key: "SituacionRegistro", label: "Situación" },
  ];

  // Columna modal
  const modalColumns = [
    { key: "IDAfp", label: "ID AFP" },
    { key: "Afp", label: "Nombre AFP" },
    {
      key: "IndicadorPublicoPrivado",
      label: "Indicador",
      type: "select",
      options: [
        { PKID: "PRIVADO", value: "PRIVADO" },
        { PKID: "PUBLICO", value: "PUBLICO" },
      ],
      displayKey: "value",
    },
    {
      key: "PKIDCuentaContable",
      label: "Cuenta Contable",
      type: "select",
      options: comboCuentas,
      displayKey: "CuentaContable",
    },
    {
      key: "PKIDSituacionRegistro",
      label: "Situación",
      type: "select",
      options: comboSituaciones,
      displayKey: "SituacionRegistro",
    },
  ];

  return (
    <TableGlobal
      title={`AFP`}
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
