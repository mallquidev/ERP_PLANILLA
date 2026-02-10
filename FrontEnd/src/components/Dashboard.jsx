import React, { useEffect, useState } from "react";
import axios from "axios";
import API_BASE_URL from "../api";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale,
  BarElement, Title, Tooltip, Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// ---- helpers de color (mismo color por etiqueta) ----
function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0; // a 32 bits
  }
  return Math.abs(h);
}
function colorFromLabel(label, alpha = 0.75) {
  const hue = hashString(label) % 360;      // 0..359
  const sat = 70;                           // %
  const light = 55;                         // %
  const bg = `hsl(${hue} ${sat}% ${light}% / ${alpha})`;
  const border = `hsl(${hue} ${sat}% ${Math.max(light - 10, 30)}% / 1)`;
  return { bg, border };
}

export default function Dashboard() {
  const [empresa, setEmpresa] = useState(1);
  const [ano, setAno] = useState(2024);
  const [top, setTop] = useState(10);

  const [conceptosData, setConceptosData] = useState(null);
  const [trabajadoresData, setTrabajadoresData] = useState(null);
  const token = localStorage.getItem("token");
  const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

  const stackedOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: false }
    },
    scales: { x: { stacked: true }, y: { stacked: true } },
  };

  // Convierte series [{label, data[]}] en datasets Chart.js con colores únicos
  const toDatasets = (series) =>
    series.map((s) => {
      const { bg, border } = colorFromLabel(s.label);
      return {
        label: s.label,
        data: s.data,
        backgroundColor: bg,
        borderColor: border,
        borderWidth: 1,
      };
    });

  const loadCharts = async () => {
    try {
      // Gráfico 1: conceptos
      const r1 = await axios.get(
        `${API_BASE_URL}/dashboard/ingresos-por-concepto`,
        { ...axiosConfig, params: { IDEmpresa: empresa, Ano: ano } }
      );
      setConceptosData({
        labels: r1.data.labels.map((m) => `Mes ${m}`),
        datasets: toDatasets(r1.data.series),
      });

      // Gráfico 2: trabajadores (top N)
      const r2 = await axios.get(
        `${API_BASE_URL}/dashboard/ingresos-por-trabajador`,
        { ...axiosConfig, params: { IDEmpresa: empresa, Ano: ano, top } }
      );
      setTrabajadoresData({
        labels: r2.data.labels.map((m) => `Mes ${m}`),
        datasets: toDatasets(r2.data.series),
      });
    } catch (err) {
      console.error("Error cargando dashboard:", err);
      alert("Error al cargar gráficos");
    }
  };

  useEffect(() => {
    loadCharts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>Dashboard</h2>

      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <label>
          Empresa:
          <input
            type="number"
            value={empresa}
            onChange={(e) => setEmpresa(parseInt(e.target.value || "0", 10))}
            style={{ marginLeft: 6, width: 80 }}
          />
        </label>

        <label>
          Año:
          <input
            type="number"
            value={ano}
            onChange={(e) => setAno(parseInt(e.target.value || "0", 10))}
            style={{ marginLeft: 6, width: 80 }}
          />
        </label>

        <label>
          Top Trabajadores:
          <input
            type="number"
            value={top}
            min={1}
            max={50}
            onChange={(e) => setTop(parseInt(e.target.value || "10", 10))}
            style={{ marginLeft: 6, width: 80 }}
          />
        </label>

        <button onClick={loadCharts}>Actualizar</button>
      </div>

      <div style={{ marginBottom: 40 }}>
        <h3>Ingreso mensual por Conceptos</h3>
        {conceptosData ? (
          <Bar data={conceptosData} options={stackedOptions} />
        ) : (
          <p>Cargando…</p>
        )}
      </div>

      <div>
        <h3>Ingreso mensual por Trabajador (Top {top})</h3>
        {trabajadoresData ? (
          <Bar data={trabajadoresData} options={stackedOptions} />
        ) : (
          <p>Cargando…</p>
        )}
      </div>
    </div>
  );
}
