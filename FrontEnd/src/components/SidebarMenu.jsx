// src/components/SidebarMenu.jsx
import React, { useState } from "react";
import { NavLink } from "react-router-dom";

const Group = ({ title, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="group">
      <button
        className="group-header"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <span className="chev">▶</span>
        <span>{title}</span>
      </button>
      {open && <div className="group-content">{children}</div>}
    </div>
  );
};

const LinkItem = ({ to, children }) => (
  <NavLink
    to={to}
    className={({ isActive }) => "link" + (isActive ? " active" : "")}
  >
    {children}
  </NavLink>
);

export default function SidebarMenu() {
  return (
    <nav className="sidebar-menu">
      <div className="sidebar-title">Menú</div>

      <Group title="Maestros">
        <LinkItem to="/empresa">Empresas</LinkItem>
        <LinkItem to="/persona-natural">Persona Natural</LinkItem>
        {/* <LinkItem to="/pruebas">Pruebas</LinkItem> */}
        <LinkItem to="/centro-costo">Centro de Costo</LinkItem>
        <LinkItem to="/contrato-laboral">Contrato Laboral</LinkItem>
        <LinkItem to="/cuenta-contable">Cuenta Contable</LinkItem>
        <LinkItem to="/establecimientos">Establecimientos</LinkItem>
      </Group>

      <Group title="Parámetros">
        <LinkItem to="/afp">AFP</LinkItem>
        <LinkItem to="/banco">Banco</LinkItem>
        <LinkItem to="/concepto-planilla">Concepto Planilla</LinkItem>
        <LinkItem to="/configura-planilla">Configuración Planilla</LinkItem>
        <LinkItem to="/configura-remuneracion-variable">Remuneración Variable</LinkItem>
        <LinkItem to="/deduccion-periodo">Deduccion Periodo</LinkItem>
      </Group>

      <Group title="Vacaciones">
        <LinkItem to="/control-vacacional">Control Vacacional</LinkItem>
      </Group>

      <Group title="CTS">
        <LinkItem to="/cts-calculada">Cts Calculada</LinkItem>
      </Group>
      
      <Group title="Cuenta Coriente">
        <LinkItem to="/cuenta-corriente-planillas">Prestamos</LinkItem>
      </Group>

      <Group title="Tablas de Apoyo">
        <LinkItem to="/area">Área</LinkItem>
        <LinkItem to="/cargo-empresa">Cargo</LinkItem>
        <LinkItem to="/categoria-trabajador">Categoría Trabajador</LinkItem>
        <LinkItem to="/categoria-reintegro">Categoría Reintegro</LinkItem>
        <LinkItem to="/condicion-trabajador">Condición Trabajador</LinkItem>
        <LinkItem to="/situacion-registro">Situación Registro</LinkItem>
        <LinkItem to="/situacion-trabajador">Situación Trabajador</LinkItem>
        <LinkItem to="/dias-utiles-mes">Dias Utiles Mes</LinkItem>
        <LinkItem to="/dias-utiles-semana">Dias Utiles Semana</LinkItem>
        <LinkItem to="/entidad-eps">Entidad EPS</LinkItem>
        <LinkItem to="/estado-civil">Estado Civil</LinkItem>
        <LinkItem to="/familias">Familia </LinkItem>
        <LinkItem to="/familia-remuneracion-variable">Familia Remuneración Variable </LinkItem>
        <LinkItem to="/fecha-vigencia-impuesto">Fecha Vigencia Impuesto </LinkItem>
        <LinkItem to="/frecuencia">Frecuencia </LinkItem>
        <LinkItem to="/grado-academico">Grado Academico </LinkItem>
        <LinkItem to="/grupo-gasto">Grupo Gasto </LinkItem>
        <LinkItem to="/grupo-operativo">Grupo Operativo </LinkItem>
      </Group>

      <Group title="Reportes">
        <LinkItem to="/reportes/conceptos">Reporte de Conceptos</LinkItem>
      </Group>

      <Group title="Consultas">
        <LinkItem to="/consulta">Consulta Planilla</LinkItem>
      </Group>

      <Group title="Dashboard">
        <LinkItem to="/dashboard">Dashboard</LinkItem>
      </Group>

      <Group title="Contexto" defaultOpen={false}>
        <LinkItem to="/context">Cambiar contexto</LinkItem>
      </Group>
    </nav>
  );
}
