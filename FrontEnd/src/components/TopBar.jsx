// src/components/TopBar.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGlobal } from "../GlobalContext";

export default function TopBar() {
  const navigate = useNavigate();
  const { empresaNombre, nominaNombre, periodo } = useGlobal();

  const username =
    localStorage.getItem("username") ||
    localStorage.getItem("user") ||
    localStorage.getItem("Usuario") ||
    "";

  const handleLogout = () => {
    if (window.confirm("¿Deseas cerrar sesión?")) {
      localStorage.removeItem("token");
      navigate("/login", { replace: true });
    }
  };

  const handleChangeContext = () => {
    navigate("/context", { replace: true });
  };

  const periodoText =
    periodo && periodo.ano && periodo.mes && periodo.secuencia
      ? `${periodo.ano}-${String(periodo.mes).padStart(2, "0")} (Sec ${periodo.secuencia})`
      : "—";

  // estado para hover de botones
  const [hoverBtn, setHoverBtn] = useState(null);

  return (
    <div style={containerStyle}>
      {/* Lado izquierdo: info de contexto */}
      <div style={leftBlock}>
        <div style={lineItem}>
          <span style={label}>Empresa:</span>
          <span style={value}>{empresaNombre || "—"}</span>
        </div>
        <div style={separator} />
        <div style={lineItem}>
          <span style={label}>Nómina:</span>
          <span style={value}>{nominaNombre || "—"}</span>
        </div>
        <div style={separator} />
        <div style={lineItem}>
          <span style={label}>Periodo:</span>
          <span style={value}>{periodoText}</span>
        </div>
      </div>

      {/* Lado derecho: usuario y botones */}
      <div style={rightBlock}>
        <div style={{ marginRight: 12, fontWeight: 600, color: "#fff" }}>
          {username ? `👤 ${username}` : ""}
        </div>

        <button
          onClick={handleChangeContext}
          style={{
            ...btnWarning,
            background: hoverBtn === "context" ? "#f59e0b" : btnWarning.background,
          }}
          onMouseEnter={() => setHoverBtn("context")}
          onMouseLeave={() => setHoverBtn(null)}
        >
          Cambiar contexto
        </button>

        <button
          onClick={handleLogout}
          style={{
            ...btnDanger,
            background: hoverBtn === "logout" ? "#d32f2f" : btnDanger.background,
          }}
          onMouseEnter={() => setHoverBtn("logout")}
          onMouseLeave={() => setHoverBtn(null)}
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

/* ---------- styles ---------- */
const containerStyle = {
  height: 56,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 16px",
  background: "#1e3a8a", // azul oscuro
  borderBottom: "1px solid #1e40af",
  position: "sticky",
  top: 0,
  zIndex: 100,
};

const leftBlock = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap",
};

const rightBlock = {
  display: "flex",
  alignItems: "center",
};

const lineItem = {
  display: "flex",
  alignItems: "center",
  gap: 6,
};

const label = {
  color: "#dbeafe", // azul claro
  fontWeight: 600,
  fontSize: 13,
};

const value = {
  color: "#ffffff",
  fontWeight: 600,
  fontSize: 13,
};

const separator = {
  width: 1,
  height: 18,
  background: "#3b82f6", // celeste
  margin: "0 8px",
};

const btnDanger = {
  marginLeft: 8,
  background: "#f44336",
  color: "#fff",
  border: "none",
  padding: "8px 12px",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: 600,
  transition: "background 0.2s ease",
};

const btnWarning = {
  marginLeft: 8,
  background: "#fbbf24",
  color: "#000",
  border: "none",
  padding: "8px 12px",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: 600,
  transition: "background 0.2s ease",
};
