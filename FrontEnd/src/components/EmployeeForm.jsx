import React, { useState } from 'react';
import axios from 'axios';
import API_BASE_URL from '../api';

function EmployeeForm() {
  const [form, setForm] = useState({
    CIA_CODCIA: '',
    ANO_CODANO: '',
    MES_CODMES: '',
    TPL_CODTPL: '',
    PPE_CORPPE: '',
    P_CODAUX: ''
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    for (const [key, value] of Object.entries(form)) {
      if (!value || isNaN(parseInt(value))) {
        alert(`El campo ${key} es obligatorio y debe ser numérico`);
        return;
      }
    }

    setLoading(true);
    setResult(null);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        alert("⚠️ No se encontró un token. Inicie sesión nuevamente.");
        setLoading(false);
        return;
      }

      const res = await axios.post(
        `${API_BASE_URL}/payroll/video`,
        {
          ...form,
          CIA_CODCIA: parseInt(form.CIA_CODCIA),
          ANO_CODANO: parseInt(form.ANO_CODANO),
          MES_CODMES: parseInt(form.MES_CODMES),
          TPL_CODTPL: parseInt(form.TPL_CODTPL),
          PPE_CORPPE: parseInt(form.PPE_CORPPE),
          P_CODAUX: parseInt(form.P_CODAUX)
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = res.data?.data || [];

      console.log("✅ Respuesta completa del backend:", res.data);
      console.log("📦 Datos para mostrar:", data);

      if (
        data.length === 0 ||
        (data.length === 1 && Object.values(data[0]).every((v) => v === null || v === ""))
      ) {
        alert("⚠️ El SP devolvió una fila vacía o sin datos relevantes.");
      }

      setResult(data);
    } catch (error) {
      console.error("❌ Error consultando el SP:", error);
      setResult([{ Error: "Error al consultar el SP." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {Object.keys(form).map((key) => (
        <div key={key}>
          <label>{key}: </label>
          <input name={key} value={form[key]} onChange={handleChange} />
        </div>
      ))}
      <button onClick={handleSubmit} disabled={loading}>
        {loading ? "Consultando..." : "Consultar"}
      </button>

      {result !== null && result.length === 0 && (
        <p style={{ marginTop: 20 }}>⚠️ No se encontraron resultados para los parámetros ingresados.</p>
      )}

      {result && result.length > 0 && Object.keys(result[0]).length > 0 && (
        <table border="1" cellPadding="5" style={{ marginTop: 20, fontSize: '12px' }}>
          <thead>
            <tr>
              {Object.keys(result[0]).map((col) => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.map((row, idx) => (
              <tr key={idx}>
                {Object.values(row).map((val, i) => (
                  <td key={i}>{val !== null ? val : ""}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default EmployeeForm;
