import React, { useState } from "react";
import axios from "axios";
import API_BASE_URL from "../api";

export default function ConceptosReport() {
  const [tipoConcepto, setTipoConcepto] = useState("");
  const [formato, setFormato] = useState("json");
  const [rows, setRows] = useState([]);
  const [cols, setCols] = useState([]);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");
  const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

  const descargar = async () => {
    if (!token) {
      alert("Sesión expirada. Inicia sesión nuevamente.");
      return;
    }

    setLoading(true);
    try {
      const params = {};
      if (tipoConcepto) params.tipo_concepto = parseInt(tipoConcepto, 10);

      // 1) Limpiar tabla si el formato no es JSON
      if (formato !== "json") {
        setCols([]);
        setRows([]);
      }

      // JSON: ver en tabla
      if (formato === "json") {
        const res = await axios.get(`${API_BASE_URL}/reports/conceptos`, {
          ...axiosConfig,
          params: { ...params, formato },
        });
        setCols(res.data.columns || []);
        setRows(res.data.data || []);
        return;
      }

      // HTML: abrir en nueva pestaña con token
      if (formato === "html") {
        const url = new URL(`${API_BASE_URL}/reports/conceptos`);
        url.searchParams.set("formato", "html");
        if (tipoConcepto) url.searchParams.set("tipo_concepto", tipoConcepto);
        const w = window.open();
        fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } })
          .then((r) => r.text())
          .then((html) => {
            if (w) {
              w.document.open();
              w.document.write(html);
              w.document.close();
            }
          })
          .catch((e) => {
            console.error(e);
            alert("No se pudo abrir la vista HTML.");
          });
        return;
      }

      // PDF: descarga
      if (formato === "pdf") {
        const res = await axios.get(`${API_BASE_URL}/reports/conceptos`, {
          ...axiosConfig,
          params: { ...params, formato: "pdf" },
          responseType: "blob",
        });
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const a = document.createElement("a");
        a.href = url;
        a.download = "conceptos.pdf";
        a.click();
        window.URL.revokeObjectURL(url);
        return;
      }

      // CSV / XLSX: descarga
      const res = await axios.get(`${API_BASE_URL}/reports/conceptos`, {
        ...axiosConfig,
        params: { ...params, formato },
        responseType: "blob",
      });
      const filename = formato === "csv" ? "conceptos.csv" : "conceptos.xlsx";
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error generando reporte:", err);
      alert("No se pudo generar el reporte.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Reporte de Conceptos</h2>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
        <label>
          TipoConcepto:&nbsp;
          <input
            type="number"
            value={tipoConcepto}
            onChange={(e) => setTipoConcepto(e.target.value)}
            style={{ width: 100 }}
            placeholder="(opcional)"
          />
        </label>

        <label>
          Formato:&nbsp;
          <select
            value={formato}
            onChange={(e) => setFormato(e.target.value)}
            style={{ minWidth: 220 }}
          >
            <option value="json">Ver en tabla (JSON)</option>
            <option value="csv">Descargar CSV</option>
            <option value="xlsx">Descargar Excel (XLSX)</option>
            <option value="html">Vista HTML imprimible</option>
            <option value="pdf">Descargar PDF</option>
          </select>
        </label>

        <button onClick={descargar} disabled={loading}>
          {loading ? "Generando..." : "Generar"}
        </button>
      </div>

      {formato === "json" && rows.length > 0 && (
        <div style={{ overflow: "auto", maxHeight: 500, border: "1px solid #ddd" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 12 }}>
            <thead>
              <tr>
                {cols.map((c) => (
                  <th
                    key={c}
                    style={{ border: "1px solid #ccc", padding: "6px", background: "#f7f7f7" }}
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  {cols.map((c) => (
                    <td key={c} style={{ border: "1px solid #eee", padding: "6px" }}>
                      {r[c] !== null ? String(r[c]) : ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {formato === "json" && rows.length === 0 && (
        <p style={{ marginTop: 8, color: "#666" }}>
          {loading ? "" : "No hay datos para mostrar."}
        </p>
      )}
    </div>
  );
}
