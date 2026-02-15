import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import API_BASE_URL from "../api";
import { useGlobal } from "../GlobalContext";

export default function AfpComponent() {
  const token = localStorage.getItem("token");
  const { periodo } = useGlobal(); // { ano, mes, secuencia }
  const headers = useMemo(() => ({
    Authorization: `Bearer ${token}`,
  }), [token]);

  // --------------------------
  // Combos
  // --------------------------
  const [comboConceptos, setComboConceptos] = useState([]);
  const [comboSituaciones, setComboSituaciones] = useState([]);
  const [comboCuentas, setComboCuentas] = useState([]);

  // --------------------------
  // Cabecera AFP
  // --------------------------
  const [afps, setAfps] = useState([]);
  const [formAfp, setFormAfp] = useState({
    IDAfp: "",
    Afp: "",
    IndicadorPublicoPrivado: "",
    PKIDCuentaContable: "",
    PKIDSituacionRegistro: "",
  });
  const [editAfpId, setEditAfpId] = useState(null);

  // --------------------------
  // Detalle AFPPeriodo
  // --------------------------
  const [selectedAfp, setSelectedAfp] = useState(null); // guarda PKID de la AFP seleccionada
  const [periodos, setPeriodos] = useState([]);

  const [formPeriodo, setFormPeriodo] = useState({
    Ano: "",
    Mes: "",
    PKIDConceptoPlanilla: "",
    PorcentajeTrabajador: "",
    PorcentajeMixta: "",
    PKIDSituacionRegistro: "",
    TopeAfp: "",
  });
  const [editPeriodoId, setEditPeriodoId] = useState(null);

  // --------------------------
  // Load combos on first render
  // --------------------------
  useEffect(() => {
    const loadCombos = async () => {
      try {
        const [c1, c2, c3] = await Promise.all([
          axios.get(`${API_BASE_URL}/afp-combos/conceptos`, { headers }),
          axios.get(`${API_BASE_URL}/afp-combos/situaciones`, { headers }),
          axios.get(`${API_BASE_URL}/afp-combos/cuentas`, { headers }),
        ]);
        setComboConceptos(c1.data || []);
        setComboSituaciones(c2.data || []);
        setComboCuentas(c3.data || []);
      } catch (err) {
        console.error("❌ Error combos:", err);
        alert("No se pudieron cargar combos.");
      }
    };
    if (token) loadCombos();
  }, [token, headers]);

  // --------------------------
  // Load AFP list on first render
  // --------------------------
  useEffect(() => {
    const loadAfps = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/afp/`, { headers });
        setAfps(res.data || []);
      } catch (err) {
        console.error("❌ Error list AFP:", err);
        alert("No se pudieron cargar las AFP.");
      }
    };
    if (token) loadAfps();
  }, [token, headers]);

  // --------------------------
  // When selected AFP or periodo changes, load detail filtered by año/mes
  // --------------------------
  useEffect(() => {
    const loadPeriodos = async () => {
      if (!selectedAfp || !periodo?.ano || !periodo?.mes) {
        setPeriodos([]);
        return;
      }
      try {
        const res = await axios.get(
          `${API_BASE_URL}/afp/${selectedAfp}/periodos`,
          {
            params: { Ano: periodo.ano, Mes: periodo.mes },
            headers,
          }
        );
        setPeriodos(res.data || []);
      } catch (err) {
        console.error("❌ Error list periodos:", err);
        alert("No se pudieron cargar los periodos.");
      }
    };
    loadPeriodos();
  }, [selectedAfp, periodo, headers]);

  // --------------------------
  // Helpers
  // --------------------------
  const conceptNameById = (id) => {
    const x = comboConceptos.find((c) => c.PKID === id);
    return x ? x.ConceptoPlanilla : "";
    };
  const situacionNameById = (id) => {
    const x = comboSituaciones.find((s) => s.PKID === id);
    return x ? x.SituacionRegistro : "";
  };
  const cuentaNameById = (id) => {
    const x = comboCuentas.find((c) => c.PKID === id);
    return x ? x.CuentaContable : "";
  };

  // ==========================
  // CABECERA: Handlers
  // ==========================
  const onChangeAfp = (e) => {
    const { name, value } = e.target;
    setFormAfp((p) => ({ ...p, [name]: value }));
  };

  const guardarAfp = async () => {
    const payload = {
      IDAfp: parseInt(formAfp.IDAfp),
      Afp: formAfp.Afp,
      IndicadorPublicoPrivado: formAfp.IndicadorPublicoPrivado || "PRIVADO",
      PKIDCuentaContable: formAfp.PKIDCuentaContable ? parseInt(formAfp.PKIDCuentaContable) : null,
      PKIDSituacionRegistro: parseInt(formAfp.PKIDSituacionRegistro),
    };
    try {
      if (!payload.IDAfp || !payload.Afp || !payload.PKIDSituacionRegistro) {
        alert("Complete IDAfp, Afp y Situación.");
        return;
      }
      if (editAfpId) {
        const res = await axios.put(`${API_BASE_URL}/afp/${editAfpId}`, payload, { headers });
        const updated = res.data;
        setAfps((prev) => prev.map((a) => (a.PKID === editAfpId ? updated : a)));
        alert("AFP actualizada.");
      } else {
        const res = await axios.post(`${API_BASE_URL}/afp/`, payload, { headers });
        const created = res.data;
        setAfps((prev) => [...prev, created]);
        alert("AFP creada.");
      }
      setFormAfp({
        IDAfp: "",
        Afp: "",
        IndicadorPublicoPrivado: "",
        PKIDCuentaContable: "",
        PKIDSituacionRegistro: "",
      });
      setEditAfpId(null);
    } catch (err) {
      console.error("❌ Error guardando AFP:", err);
      const detail = err?.response?.data?.detail || err?.message || "Error desconocido al guardar";
      alert(`No se pudo guardar la AFP.\nDetalle: ${detail}`);
    }
  };

  const editarAfp = (afp) => {
    setEditAfpId(afp.PKID);
    setFormAfp({
      IDAfp: afp.IDAfp,
      Afp: afp.Afp,
      IndicadorPublicoPrivado: afp.IndicadorPublicoPrivado || "PRIVADO",
      PKIDCuentaContable: afp.PKIDCuentaContable || "",
      PKIDSituacionRegistro: afp.PKIDSituacionRegistro,
    });
  };

  const eliminarAfp = async (pkid) => {
    if (!window.confirm("¿Eliminar AFP?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/afp/${pkid}`, { headers });
      setAfps((prev) => prev.filter((a) => a.PKID !== pkid));
      if (selectedAfp === pkid) {
        setSelectedAfp(null);
        setPeriodos([]);
      }
    } catch (err) {
      console.error("❌ Error eliminando AFP:", err);
      alert("No se pudo eliminar la AFP.");
    }
  };

  // ==========================
  // DETALLE: Handlers
  // ==========================
  const iniciarNuevoPeriodo = () => {
    if (!selectedAfp) {
      alert("Seleccione primero una AFP.");
      return;
    }
    if (!periodo?.ano || !periodo?.mes) {
      alert("El contexto no tiene Año/Mes seleccionado.");
      return;
    }
    setEditPeriodoId(null);
    setFormPeriodo({
      Ano: periodo.ano,
      Mes: periodo.mes,
      PKIDConceptoPlanilla: "",
      PorcentajeTrabajador: "",
      PorcentajeMixta: "",
      PKIDSituacionRegistro: "",
      TopeAfp: "",
    });
  };

  const editarPeriodo = (p) => {
    setEditPeriodoId(p.PKID);
    setFormPeriodo({
      Ano: p.Ano,
      Mes: p.Mes,
      PKIDConceptoPlanilla: p.PKIDConceptoPlanilla,
      PorcentajeTrabajador: p.PorcentajeTrabajador,
      PorcentajeMixta: p.PorcentajeMixta,
      PKIDSituacionRegistro: p.PKIDSituacionRegistro,
      TopeAfp: p.TopeAfp ?? "",
    });
  };

  const onChangePeriodo = (e) => {
    const { name, value } = e.target;
    setFormPeriodo((prev) => ({ ...prev, [name]: value }));
  };

  const guardarPeriodo = async () => {
    if (!selectedAfp) {
      alert("Seleccione una AFP.");
      return;
    }
    const payload = {
      Ano: parseInt(formPeriodo.Ano),
      Mes: parseInt(formPeriodo.Mes),
      PKIDConceptoPlanilla: parseInt(formPeriodo.PKIDConceptoPlanilla),
      PorcentajeTrabajador: parseFloat(formPeriodo.PorcentajeTrabajador || 0),
      PorcentajeMixta: parseFloat(formPeriodo.PorcentajeMixta || 0),
      PKIDSituacionRegistro: parseInt(formPeriodo.PKIDSituacionRegistro),
      TopeAfp: formPeriodo.TopeAfp !== "" ? parseFloat(formPeriodo.TopeAfp) : null,
    };
    try {
      if (editPeriodoId) {
        const res = await axios.put(`${API_BASE_URL}/afp/periodos/${editPeriodoId}`, payload, { headers });
        const updated = res.data;
        setPeriodos((prev) => prev.map((x) => (x.PKID === editPeriodoId ? updated : x)));
        alert("Periodo actualizado.");
      } else {
        const res = await axios.post(`${API_BASE_URL}/afp/${selectedAfp}/periodos`, payload, { headers });
        const created = res.data;
        setPeriodos((prev) => [...prev, created]);
        alert("Periodo creado.");
      }
      setEditPeriodoId(null);
      setFormPeriodo({
        Ano: periodo.ano,
        Mes: periodo.mes,
        PKIDConceptoPlanilla: "",
        PorcentajeTrabajador: "",
        PorcentajeMixta: "",
        PKIDSituacionRegistro: "",
        TopeAfp: "",
      });
    } catch (err) {
      console.error("❌ Error guardando periodo:", err);
      const detail = err?.response?.data?.detail || err?.message || "Error desconocido al guardar";
      alert(`No se pudo guardar el periodo.\nDetalle: ${detail}`);
    }
  };

  const eliminarPeriodo = async (pid) => {
    if (!window.confirm("¿Eliminar línea del periodo?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/afp/periodos/${pid}`, { headers });
      setPeriodos((prev) => prev.filter((x) => x.PKID !== pid));
    } catch (err) {
      console.error("❌ Error eliminando periodo:", err);
      alert("No se pudo eliminar el periodo.");
    }
  };

  // ==========================
  // Render
  // ==========================
  return (
    <div style={{ padding: 16 }}>
      <h2>AFP (Cabecera) + AFPPeriodo (Detalle)</h2>

      <section style={{ border: "1px solid #ddd", padding: 12, marginBottom: 20 }}>
        <h3>CABECERA AFP</h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <div>
            <label>ID AFP</label><br />
            <input
              name="IDAfp"
              type="number"
              value={formAfp.IDAfp}
              onChange={onChangeAfp}
              style={{ width: 120 }}
            />
          </div>
          <div>
            <label>Nombre AFP</label><br />
            <input
              name="Afp"
              value={formAfp.Afp}
              onChange={onChangeAfp}
              style={{ width: 220 }}
            />
          </div>
          <div>
            <label>Indicador</label><br />
            <select
              name="IndicadorPublicoPrivado"
              value={formAfp.IndicadorPublicoPrivado}
              onChange={onChangeAfp}
              style={{ width: 140 }}
            >
              <option value="PRIVADO">PRIVADO</option>
              <option value="PUBLICO">PUBLICO</option>
            </select>
          </div>
          <div>
            <label>Cuenta Contable</label><br />
            <select
              name="PKIDCuentaContable"
              value={formAfp.PKIDCuentaContable}
              onChange={onChangeAfp}
              style={{ width: 260 }}
            >
              <option value="">--Seleccione--</option>
              {comboCuentas.map((c) => (
                <option key={c.PKID} value={c.PKID}>
                  {c.CuentaContable}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Situación</label><br />
            <select
              name="PKIDSituacionRegistro"
              value={formAfp.PKIDSituacionRegistro}
              onChange={onChangeAfp}
              style={{ width: 220 }}
            >
              <option value="">--Seleccione--</option>
              {comboSituaciones.map((s) => (
                <option key={s.PKID} value={s.PKID}>
                  {s.SituacionRegistro}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ marginTop: 10 }}>
          <button onClick={guardarAfp}>
            {editAfpId ? "Actualizar AFP" : "Crear AFP"}
          </button>{" "}
          {editAfpId && (
            <button
              onClick={() => {
                setEditAfpId(null);
                setFormAfp({
                  IDAfp: "",
                  Afp: "",
                  IndicadorPublicoPrivado: "",
                  PKIDCuentaContable: "",
                  PKIDSituacionRegistro: "",
                });
              }}
            >
              Cancelar
            </button>
          )}
        </div>

        <table border="1" cellPadding="5" style={{ marginTop: 12, fontSize: 13, width: "100%" }}>
          <thead>
            <tr>
              <th>Sel</th>
              <th>IDAfp</th>
              <th>AFP</th>
              <th>Indicador</th>
              <th>Cuenta Contable</th>
              <th>Situación</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {afps.map((a) => (
              <tr key={a.PKID}>
                <td>
                  <input
                    type="radio"
                    name="selAfp"
                    checked={selectedAfp === a.PKID}
                    onChange={() => setSelectedAfp(a.PKID)}
                  />
                </td>
                <td>{a.IDAfp}</td>
                <td>{a.Afp}</td>
                <td>{a.IndicadorPublicoPrivado}</td>
                <td>{a.CuentaContable || cuentaNameById(a.PKIDCuentaContable)}</td>
                <td>{a.SituacionRegistro || situacionNameById(a.PKIDSituacionRegistro)}</td>
                <td>
                  <button onClick={() => editarAfp(a)}>✏️</button>{" "}
                  <button onClick={() => eliminarAfp(a.PKID)}>🗑️</button>
                </td>
              </tr>
            ))}
            {afps.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: "center" }}>
                  (Sin AFP)
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section style={{ border: "1px solid #ddd", padding: 12 }}>
        <h3>DETALLE AFPPeriodo (Año/Mes del Contexto)</h3>
        <div style={{ marginBottom: 8 }}>
          <strong>Año:</strong> {periodo?.ano ?? "-"} &nbsp;&nbsp;
          <strong>Mes:</strong> {periodo?.mes ?? "-"}
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <div>
            <label>Año</label><br />
            <input
              name="Ano"
              type="number"
              value={formPeriodo.Ano}
              onChange={onChangePeriodo}
              disabled
              style={{ width: 90 }}
            />
          </div>
          <div>
            <label>Mes</label><br />
            <input
              name="Mes"
              type="number"
              value={formPeriodo.Mes}
              onChange={onChangePeriodo}
              disabled
              style={{ width: 70 }}
            />
          </div>
          <div>
            <label>Concepto</label><br />
            <select
              name="PKIDConceptoPlanilla"
              value={formPeriodo.PKIDConceptoPlanilla}
              onChange={onChangePeriodo}
              style={{ width: 260 }}
            >
              <option value="">--Seleccione--</option>
              {comboConceptos.map((c) => (
                <option key={c.PKID} value={c.PKID}>
                  {c.ConceptoPlanilla}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>% Trabajador</label><br />
            <input
              name="PorcentajeTrabajador"
              type="number"
              step="0.0001"
              value={formPeriodo.PorcentajeTrabajador}
              onChange={onChangePeriodo}
              style={{ width: 120 }}
            />
          </div>
          <div>
            <label>% Mixta</label><br />
            <input
              name="PorcentajeMixta"
              type="number"
              step="0.0001"
              value={formPeriodo.PorcentajeMixta}
              onChange={onChangePeriodo}
              style={{ width: 120 }}
            />
          </div>
          <div>
            <label>Situación</label><br />
            <select
              name="PKIDSituacionRegistro"
              value={formPeriodo.PKIDSituacionRegistro}
              onChange={onChangePeriodo}
              style={{ width: 220 }}
            >
              <option value="">--Seleccione--</option>
              {comboSituaciones.map((s) => (
                <option key={s.PKID} value={s.PKID}>
                  {s.SituacionRegistro}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Tope AFP</label><br />
            <input
              name="TopeAfp"
              type="number"
              step="0.01"
              value={formPeriodo.TopeAfp}
              onChange={onChangePeriodo}
              style={{ width: 120 }}
            />
          </div>
        </div>

        <div style={{ marginTop: 10 }}>
          <button onClick={iniciarNuevoPeriodo}>Nueva línea</button>{" "}
          <button onClick={guardarPeriodo}>
            {editPeriodoId ? "Actualizar línea" : "Guardar línea"}
          </button>{" "}
          {editPeriodoId && (
            <button
              onClick={() => {
                setEditPeriodoId(null);
                setFormPeriodo({
                  Ano: periodo?.ano ?? "",
                  Mes: periodo?.mes ?? "",
                  PKIDConceptoPlanilla: "",
                  PorcentajeTrabajador: "",
                  PorcentajeMixta: "",
                  PKIDSituacionRegistro: "",
                  TopeAfp: "",
                });
              }}
            >
              Cancelar
            </button>
          )}
        </div>

        <table border="1" cellPadding="5" style={{ marginTop: 12, fontSize: 13, width: "100%" }}>
          <thead>
            <tr>
              <th>Año</th>
              <th>Mes</th>
              <th>Concepto</th>
              <th>% Trabajador</th>
              <th>% Mixta</th>
              <th>Situación</th>
              <th>Tope AFP</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {(periodos || []).map((p) => (
              <tr key={p.PKID}>
                <td>{p.Ano}</td>
                <td>{p.Mes}</td>
                <td>{p.ConceptoPlanilla || conceptNameById(p.PKIDConceptoPlanilla)}</td>
                <td>{p.PorcentajeTrabajador}</td>
                <td>{p.PorcentajeMixta}</td>
                <td>{p.SituacionRegistro || situacionNameById(p.PKIDSituacionRegistro)}</td>
                <td>{p.TopeAfp ?? ""}</td>
                <td>
                  <button onClick={() => editarPeriodo(p)}>✏️</button>{" "}
                  <button onClick={() => eliminarPeriodo(p.PKID)}>🗑️</button>
                </td>
              </tr>
            ))}
            {(!periodos || periodos.length === 0) && (
              <tr>
                <td colSpan="8" style={{ textAlign: "center" }}>
                  (Sin líneas para Año/Mes seleccionado)
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
