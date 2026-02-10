//frontend/src/components/BancoComponent.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import API_BASE_URL from "../api";
import { useGlobal } from "../GlobalContext";

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
});

export default function BancoComponent() {
  const { empresaId } = useGlobal(); // IDEmpresa (global)
  const ideEmpresa = empresaId;
  const [bancos, setBancos] = useState([]);
  const [formBanco, setFormBanco] = useState({
    IDBanco: "",
    Banco: "",
    SiglasBanco: "",
    PKIDSituacionRegistro: "",
  });
  const [editingBancoPkid, setEditingBancoPkid] = useState(null);

  const [cuentas, setCuentas] = useState([]);
  const [selectedBancoPkid, setSelectedBancoPkid] = useState(null);

  // combos
  const [situaciones, setSituaciones] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [tiposCuenta, setTiposCuenta] = useState([]);

  const [formCuenta, setFormCuenta] = useState({
    IDEmpresa: ideEmpresa, // no editable, viene del contexto
    PKIDMoneda: "",
    NumeroCuenta: "",
    NumeroCuenta2: "",
    PKIDSituacionRegistro: "",
    PKIDTipoCuentaBanco: "",
  });
  const [editingCuentaPkid, setEditingCuentaPkid] = useState(null);

  const axiosCfg = useMemo(() => ({ headers: authHeaders() }), []);

  // ------ CARGAS ------
  useEffect(() => {
    loadCombos();
    loadBancos();
  }, []); // eslint-disable-line

  useEffect(() => {
    // si cambia empresa, y hay banco seleccionado, recarga detalle
    if (selectedBancoPkid && ideEmpresa) {
      loadCuentas(selectedBancoPkid);
    }
    // y actualiza el formCuenta con IDEmpresa
    setFormCuenta((prev) => ({ ...prev, IDEmpresa: ideEmpresa }));
  }, [ideEmpresa, selectedBancoPkid]); // eslint-disable-line

  const loadCombos = async () => {
    try {
      const [rsSit, rsMon, rsTip] = await Promise.all([
        axios.get(`${API_BASE_URL}/banco-combos/situaciones`, axiosCfg),
        axios.get(`${API_BASE_URL}/banco-combos/monedas`, axiosCfg),
        axios.get(`${API_BASE_URL}/banco-combos/tipos-cuenta`, axiosCfg),
      ]);
      setSituaciones(rsSit.data || []);
      setMonedas(rsMon.data || []);
      setTiposCuenta(rsTip.data || []);
    } catch (err) {
      console.error("❌ Error cargando combos:", err);
      alert("No fue posible cargar combos (situación/monedas/tipos).");
    }
  };

  const loadBancos = async () => {
    try {
      const rs = await axios.get(`${API_BASE_URL}/banco/`, axiosCfg);
      setBancos(rs.data || []);
    } catch (err) {
      console.error("❌ Error listando bancos:", err);
      alert("No fue posible listar bancos.");
    }
  };

  const loadCuentas = async (pkidBanco) => {
    if (!ideEmpresa) {
      setCuentas([]);
      return;
    }
    try {
      const rs = await axios.get(
        `${API_BASE_URL}/banco/${pkidBanco}/cuentas`,
        { ...axiosCfg, params: { IDEmpresa: ideEmpresa } }
      );
      setCuentas(rs.data || []);
    } catch (err) {
      console.error("❌ Error listando cuentas:", err);
      alert("No fue posible listar cuentas.");
    }
  };

  // ------ HANDLERS BANCO ------
  const handleBancoChange = (e) => {
    const { name, value } = e.target;
    setFormBanco((prev) => ({ ...prev, [name]: value }));
  };

  const guardarBanco = async () => {
    const payload = {
      IDBanco: Number(formBanco.IDBanco),
      Banco: (formBanco.Banco || "").trim(),
      SiglasBanco: (formBanco.SiglasBanco || "").trim() || null,
      PKIDSituacionRegistro: formBanco.PKIDSituacionRegistro ? Number(formBanco.PKIDSituacionRegistro) : null,
    };

    if (!payload.IDBanco || !payload.Banco) {
      alert("IDBanco y Banco son obligatorios.");
      return;
    }

    try {
      if (editingBancoPkid) {
        await axios.put(`${API_BASE_URL}/banco/${editingBancoPkid}`, payload, axiosCfg);
        alert("✅ Banco actualizado");
      } else {
        await axios.post(`${API_BASE_URL}/banco/`, payload, axiosCfg);
        alert("✅ Banco registrado");
      }
      setFormBanco({ IDBanco: "", Banco: "", SiglasBanco: "", PKIDSituacionRegistro: "" });
      setEditingBancoPkid(null);
      loadBancos();
    } catch (err) {
      console.error("❌ Error guardando banco:", err);
      const detail = err?.response?.data?.detail || err?.message || "Error desconocido";
      alert(`No se pudo guardar el banco.\n${detail}`);
    }
  };

  const editarBanco = (b) => {
    setEditingBancoPkid(b.PKID);
    setFormBanco({
      IDBanco: b.IDBanco,
      Banco: b.Banco,
      SiglasBanco: b.SiglasBanco || "",
      PKIDSituacionRegistro: b.PKIDSituacionRegistro || "",
    });
  };

  const eliminarBanco = async (pkid) => {
    if (!window.confirm("¿Eliminar banco? También fallará si tiene cuentas asociadas (por FK).")) return;
    try {
      await axios.delete(`${API_BASE_URL}/banco/${pkid}`, axiosCfg);
      alert("🗑️ Banco eliminado");
      if (selectedBancoPkid === pkid) {
        setSelectedBancoPkid(null);
        setCuentas([]);
      }
      loadBancos();
    } catch (err) {
      console.error("❌ Error eliminando banco:", err);
      const detail = err?.response?.data?.detail || err?.message || "Error desconocido";
      alert(`No se pudo eliminar.\n${detail}`);
    }
  };

  // ------ HANDLERS CUENTA ------
  const handleCuentaChange = (e) => {
    const { name, value } = e.target;
    setFormCuenta((prev) => ({ ...prev, [name]: value }));
  };

  const guardarCuenta = async () => {
    if (!selectedBancoPkid) {
      alert("Seleccione un banco en la tabla superior para gestionar cuentas.");
      return;
    }
    const payload = {
      IDEmpresa: Number(ideEmpresa),
      PKIDMoneda: Number(formCuenta.PKIDMoneda),
      NumeroCuenta: (formCuenta.NumeroCuenta || "").trim(),
      NumeroCuenta2: (formCuenta.NumeroCuenta2 || "").trim() || null,
      PKIDSituacionRegistro: formCuenta.PKIDSituacionRegistro ? Number(formCuenta.PKIDSituacionRegistro) : null,
      PKIDTipoCuentaBanco: formCuenta.PKIDTipoCuentaBanco ? Number(formCuenta.PKIDTipoCuentaBanco) : null,
    };

    if (!payload.IDEmpresa || !payload.PKIDMoneda || !payload.NumeroCuenta) {
      alert("IDEmpresa, Moneda y Número de Cuenta son obligatorios.");
      return;
    }

    try {
      if (editingCuentaPkid) {
        await axios.put(`${API_BASE_URL}/banco/cuentas/${editingCuentaPkid}`, payload, axiosCfg);
        alert("✅ Cuenta actualizada");
      } else {
        await axios.post(`${API_BASE_URL}/banco/${selectedBancoPkid}/cuentas`, payload, axiosCfg);
        alert("✅ Cuenta registrada");
      }
      setFormCuenta({
        IDEmpresa: ideEmpresa,
        PKIDMoneda: "",
        NumeroCuenta: "",
        NumeroCuenta2: "",
        PKIDSituacionRegistro: "",
        PKIDTipoCuentaBanco: "",
      });
      setEditingCuentaPkid(null);
      loadCuentas(selectedBancoPkid);
    } catch (err) {
      console.error("❌ Error guardando cuenta:", err);
      const detail = err?.response?.data?.detail || err?.message || "Error desconocido";
      alert(`No se pudo guardar la cuenta.\n${detail}`);
    }
  };

  const editarCuenta = (c) => {
    setEditingCuentaPkid(c.PKID);
    setFormCuenta({
      IDEmpresa: ideEmpresa,
      PKIDMoneda: c.PKIDMoneda || "",
      NumeroCuenta: c.NumeroCuenta || "",
      NumeroCuenta2: c.NumeroCuenta2 || "",
      PKIDSituacionRegistro: c.PKIDSituacionRegistro || "",
      PKIDTipoCuentaBanco: c.PKIDTipoCuentaBanco || "",
    });
  };

  const eliminarCuenta = async (pkid) => {
    if (!window.confirm("¿Eliminar cuenta?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/banco/cuentas/${pkid}`, axiosCfg);
      alert("🗑️ Cuenta eliminada");
      loadCuentas(selectedBancoPkid);
    } catch (err) {
      console.error("❌ Error eliminando cuenta:", err);
      const detail = err?.response?.data?.detail || err?.message || "Error desconocido";
      alert(`No se pudo eliminar.\n${detail}`);
    }
  };

  // ------ RENDER ------
  return (
    <div style={{ padding: 20 }}>
      <h2>Banco (Cabecera)</h2>

      <div style={{ display: "grid", gap: 10, maxWidth: 600, gridTemplateColumns: "1fr 1fr" }}>
        <div>
          <label>IDBanco</label>
          <input
            name="IDBanco"
            type="number"
            value={formBanco.IDBanco}
            onChange={handleBancoChange}
          />
        </div>
        <div>
          <label>Banco</label>
          <input
            name="Banco"
            value={formBanco.Banco}
            onChange={handleBancoChange}
          />
        </div>
        <div>
          <label>Siglas</label>
          <input
            name="SiglasBanco"
            value={formBanco.SiglasBanco}
            onChange={handleBancoChange}
          />
        </div>
        <div>
          <label>Situación</label>
          <select
            name="PKIDSituacionRegistro"
            value={formBanco.PKIDSituacionRegistro}
            onChange={handleBancoChange}
          >
            <option value="">-- Seleccione --</option>
            {situaciones.map((s) => (
              <option key={s.PKID} value={s.PKID}>{s.SituacionRegistro}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ marginTop: 10 }}>
        <button onClick={guardarBanco}>
          {editingBancoPkid ? "Actualizar Banco" : "Agregar Banco"}
        </button>
        {editingBancoPkid && (
          <button
            style={{ marginLeft: 8 }}
            onClick={() => {
              setEditingBancoPkid(null);
              setFormBanco({ IDBanco: "", Banco: "", SiglasBanco: "", PKIDSituacionRegistro: "" });
            }}
          >
            Cancelar
          </button>
        )}
      </div>

      <h3 style={{ marginTop: 30 }}>Listado de Bancos</h3>
      <table border="1" cellPadding="5" style={{ fontSize: 13, width: "100%", maxWidth: 900 }}>
        <thead>
          <tr>
            <th>PKID</th>
            <th>IDBanco</th>
            <th>Banco</th>
            <th>Siglas</th>
            <th>Situación</th>
            <th>Acciones</th>
            <th>Ver Cuentas</th>
          </tr>
        </thead>
        <tbody>
          {bancos.map((b) => (
            <tr key={b.PKID}>
              <td>{b.PKID}</td>
              <td>{b.IDBanco}</td>
              <td>{b.Banco}</td>
              <td>{b.SiglasBanco || ""}</td>
              <td>{b.SituacionRegistro || ""}</td>
              <td>
                <button onClick={() => editarBanco(b)}>✏️</button>
                <button onClick={() => eliminarBanco(b.PKID)} style={{ marginLeft: 6 }}>🗑️</button>
              </td>
              <td>
                <button onClick={() => {
                  setSelectedBancoPkid(b.PKID);
                  loadCuentas(b.PKID);
                }}>
                  📂 Cuentas
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* DETALLE */}
      <h2 style={{ marginTop: 40 }}>BancoCuenta (Detalle)</h2>
      <div style={{ marginBottom: 8 }}>
        <strong>IDEmpresa (contexto):</strong> {ideEmpresa || "(no definido)"}
      </div>

      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(3, 1fr)", maxWidth: 900 }}>
        <div>
          <label>Moneda</label>
          <select
            name="PKIDMoneda"
            value={formCuenta.PKIDMoneda}
            onChange={handleCuentaChange}
          >
            <option value="">-- Seleccione --</option>
            {monedas.map((m) => (
              <option key={m.PKID} value={m.PKID}>{m.Moneda}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Número Cuenta</label>
          <input
            name="NumeroCuenta"
            value={formCuenta.NumeroCuenta}
            onChange={handleCuentaChange}
          />
        </div>
        <div>
          <label>Número Cuenta 2</label>
          <input
            name="NumeroCuenta2"
            value={formCuenta.NumeroCuenta2}
            onChange={handleCuentaChange}
          />
        </div>
        <div>
          <label>Situación</label>
          <select
            name="PKIDSituacionRegistro"
            value={formCuenta.PKIDSituacionRegistro}
            onChange={handleCuentaChange}
          >
            <option value="">-- Seleccione --</option>
            {situaciones.map((s) => (
              <option key={s.PKID} value={s.PKID}>{s.SituacionRegistro}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Tipo Cuenta</label>
          <select
            name="PKIDTipoCuentaBanco"
            value={formCuenta.PKIDTipoCuentaBanco}
            onChange={handleCuentaChange}
          >
            <option value="">-- Seleccione --</option>
            {tiposCuenta.map((t) => (
              <option key={t.PKID} value={t.PKID}>{t.TipoCuentaBanco}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ marginTop: 10 }}>
        <button onClick={guardarCuenta} disabled={!selectedBancoPkid}>
          {editingCuentaPkid ? "Actualizar Cuenta" : "Agregar Cuenta"}
        </button>
        {editingCuentaPkid && (
          <button
            style={{ marginLeft: 8 }}
            onClick={() => {
              setEditingCuentaPkid(null);
              setFormCuenta({
                IDEmpresa: ideEmpresa,
                PKIDMoneda: "",
                NumeroCuenta: "",
                NumeroCuenta2: "",
                PKIDSituacionRegistro: "",
                PKIDTipoCuentaBanco: "",
              });
            }}
          >
            Cancelar
          </button>
        )}
      </div>

      <h3 style={{ marginTop: 30 }}>Cuentas del Banco seleccionado</h3>
      {!selectedBancoPkid ? (
        <p>Seleccione un banco en la tabla superior para ver sus cuentas.</p>
      ) : (
        <table border="1" cellPadding="5" style={{ fontSize: 13, width: "100%", maxWidth: 900 }}>
          <thead>
            <tr>
              <th>PKID</th>
              <th>Moneda</th>
              <th>Nro Cuenta</th>
              <th>Nro Cuenta 2</th>
              <th>Tipo Cuenta</th>
              <th>Situación</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cuentas.map((c) => (
              <tr key={c.PKID}>
                <td>{c.PKID}</td>
                <td>{c.Moneda || c.PKIDMoneda}</td>
                <td>{c.NumeroCuenta}</td>
                <td>{c.NumeroCuenta2 || ""}</td>
                <td>{c.TipoCuentaBanco || c.PKIDTipoCuentaBanco}</td>
                <td>{c.SituacionRegistro || c.PKIDSituacionRegistro}</td>
                <td>
                  <button onClick={() => editarCuenta(c)}>✏️</button>
                  <button onClick={() => eliminarCuenta(c.PKID)} style={{ marginLeft: 6 }}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
