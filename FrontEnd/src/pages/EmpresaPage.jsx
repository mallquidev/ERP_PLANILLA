// archivo: src/components/EmpresaComponent.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import API_BASE_URL from "../api";
import TableGlobal from "../ui/table/TableGlobal";

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
    return d.detail.map((e) => `• ${(Array.isArray(e.loc) ? e.loc.join(".") : e.loc)}: ${e.msg}`).join("\n");
  return String(d.detail || "Error");
}

export default function EmpresaPage() {
  const auth = useAuthAxios();

  const [rows, setRows] = useState([]);
  const [regimenes, setRegimenes] = useState([]);
  const [sectores, setSectores] = useState([]);
  const [situaciones, setSituaciones] = useState([]);
  const [otrasEmpresas, setOtrasEmpresas] = useState([]);

  // Cargar combos
  const loadCombos = async () => {
    try {
      const [c1, c2, c3, c4] = await Promise.all([
        auth.get(`/empresa-combos/regimen/`),
        auth.get(`/empresa-combos/sector/`),
        auth.get(`/empresa-combos/situacion/`),
        auth.get(`/empresa-combos/otra-empresa/`)
      ]);

      setRegimenes(c1.data || []);
      setSectores(c2.data || []);
      setSituaciones(c3.data || []);
      setOtrasEmpresas(c4.data || []);
    } catch (err) {
      alert("No se pudieron cargar los combos.");
    }
  };

  // CARGAR EMPRESAS
  const loadRows = async () => {
    try {
      const res = await auth.get(`/empresa/`);
      setRows(res.data || []);
    } catch (err) {
      alert("No se pudo listar empresas.");
    }
  };

  useEffect(() => {
    loadCombos();
    loadRows();
  }, []);

  // crear
  const handleCreate = async (formData) => {
    try {
      const payload = {
        IDEmpresa: Number(formData.IDEmpresa),
        RazonSocial: formData.RazonSocial,
        NumeroRuc: formData.NumeroRuc,
        PKIDRegimenTributario: Number(formData.PKIDRegimenTributario),
        PKIDSituacionRegistro: Number(formData.PKIDSituacionRegistro),
        PKIDSectorEconomico: Number(formData.PKIDSectorEconomico),
        Direccion: formData.Direccion,
        RegistroPatronal: formData.RegistroPatronal || null,
        PKIDOtraEmpresa: formData.PKIDOtraEmpresa || null,
        Siglas: formData.Siglas || null,
      };

      await auth.post(`/empresa/`, payload);
      await loadRows();
    } catch (err) {
      alert(prettyError(err));
    }
  };

  // actualizar
  const handleUpdate = async (formData) => {
    try {
      const payload = {
        IDEmpresa: Number(formData.IDEmpresa),
        RazonSocial: formData.RazonSocial,
        NumeroRuc: formData.NumeroRuc,
        PKIDRegimenTributario: Number(formData.PKIDRegimenTributario),
        PKIDSituacionRegistro: Number(formData.PKIDSituacionRegistro),
        PKIDSectorEconomico: Number(formData.PKIDSectorEconomico),
        Direccion: formData.Direccion,
        RegistroPatronal: formData.RegistroPatronal || null,
        PKIDOtraEmpresa: formData.PKIDOtraEmpresa || null,
        Siglas: formData.Siglas || null,
      };

      await auth.put(`/empresa/${formData.PKID}`, payload);
      await loadRows();
    } catch (err) {
      alert(prettyError(err));
    }
  };

  // Eliminar
  const handleDelete = async (item) => {
    try {
      await auth.delete(`/empresa/${item.PKID}`);
      await loadRows();
    } catch (err) {
      alert(prettyError(err));
    }
  };

    const columns = [
        { key: "IDEmpresa", label: "ID Empresa", type: "number" },
        { key: "RazonSocial", label: "Razón Social" },
        { key: "NumeroRuc", label: "RUC" }, 
        {
          key: "PKIDRegimenTributario",       // usado para form y select
          label: "Régimen",
          type: "select",
          options: regimenes,
          displayKey: "RegimenTributario"    // usado para mostrar en la tabla
        },  
        {
          key: "PKIDSectorEconomico",
          label: "Sector",
          type: "select",
          options: sectores,
          displayKey: "SectorEconomico"
        },  
        {
          key: "PKIDSituacionRegistro",
          label: "Situación",
          type: "select",
          options: situaciones,
          displayKey: "SituacionRegistro"
        },  
        {
          key: "PKIDOtraEmpresa",
          label: "Otra Empresa",
          type: "select",
          options: otrasEmpresas,
          displayKey: "RazonSocial"
        },
    ];


  return (
    <TableGlobal
      title="Empresas"
      data={rows}
      columns={columns}
      onCreate={handleCreate}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
    />
  );
}
