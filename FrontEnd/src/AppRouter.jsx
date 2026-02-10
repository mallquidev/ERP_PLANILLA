// src/AppRouter.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useGlobal } from "./GlobalContext";

// Layout (sidebar + topbar) — solo para rutas protegidas
import Layout from "./Layout";

// Páginas
import LoginForm from "./components/LoginForm";
import ContextSelector from "./components/ContextSelector";
import EmployeeForm from "./components/EmployeeForm";
import EmpresaComponent from "./components/EmpresaComponent";
import AfpComponent from "./components/AfpComponent";
import SituacionRegistroComponent from "./components/SituacionRegistro_component";
import SituacionTrabajadorComponent from "./components/SituacionTrabajadorComponent";
import Dashboard from "./components/Dashboard";
import ConceptosReport from "./components/ConceptosReport";
import PersonaNaturalComponent from "./components/PersonaNaturalComponent";
import AreaComponent from "./components/AreaComponent";
import BancoComponent from "./components/BancoComponent";
import CargoEmpresaComponent from "./components/CargoEmpresaComponent";
import CategoriaTrabajadorComponent from "./components/CategoriaTrabajadorComponent";
import MainMenu from "./components/MainMenu";
import CategoriaTrabajadorReintegroComponent from "./components/CategoriaTrabajadorReintegroComponent";
import CentroCostoComponent from "./components/CentroCostoComponent";
import ConceptoPlanillaComponent from "./components/ConceptoPlanillaComponent";
import CondicionTrabajadorComponent from "./components/CondicionTrabajadorComponent";
import ConfiguraPlanillaComponent from "./components/ConfiguraPlanillaComponent";
import ConfiguraRemuneracionVariableComponent from "./components/ConfiguraRemuneracionVariableComponent";
import ContratoLaboralComponent from "./components/ContratoLaboralComponent";
import ControlVacacionalComponent from "./components/ControlVacacionalComponent";
import CTSCalculadaComponent from "./components/CTSCalculadaComponent";
import CuentaCorrientePlanillasComponent from "./components/CuentaCorrientePlanillasComponent";
import CuentaContableComponent from "./components/CuentaContableComponent";
import DiasUtilesMesComponent from "./components/DiasUtilesMesComponent";
import DiasUtilesSemanaComponent from "./components/DiasUtilesSemanaComponent";
import DeduccionPeriodoComponent from "./components/DeduccionPeriodoComponent";
import EntidadEpsComponent from "./components/EntidadEpsComponent";
import EstablecimientoComponent from "./components/EstablecimientoComponent";
import EstadoCivilComponent from "./components/EstadoCivilComponent";
import FamiliaComponent from "./components/FamiliaComponent";
import FamiliaRemuneracionVariableComponent from "./components/FamiliaRemuneracionVariableComponent";
import FechaVigenciaImpuestoComponent from "./components/FechaVigenciaImpuestoComponent";
import FrecuenciaComponent from "./components/FrecuenciaComponent";
import GradoAcademicoComponent from "./components/GradoAcademicoComponent";
import GrupoGastoComponent from "./components/GrupoGastoComponent";
import GrupoOperativoComponent from "./components/GrupoOperativoComponent";

// Protección
function ProtectedRoute({ children, requireContext = false }) {
  const token = localStorage.getItem("token");
  const { empresaId, nominaId, periodo } = useGlobal();
  if (!token) return <Navigate to="/login" replace />;

  const hasContext =
    !!empresaId && !!nominaId && !!periodo?.ano && !!periodo?.mes && !!periodo?.secuencia;
  if (requireContext && !hasContext) return <Navigate to="/context" replace />;

  return children;
}

// Decisión inteligente para "/" o rutas desconocidas
function SmartHome() {
  const token = localStorage.getItem("token");
  const { empresaId, nominaId, periodo } = useGlobal();
  const hasContext =
    !!empresaId && !!nominaId && !!periodo?.ano && !!periodo?.mes && !!periodo?.secuencia;

  if (!token) return <Navigate to="/login" replace />;
  if (!hasContext) return <Navigate to="/context" replace />;
  return <Navigate to="/dashboard" replace />;
}

export default function AppRouter() {
  return (
    <Routes>
      {/* Públicas (sin Layout) */}
      <Route path="/login" element={<LoginForm />} />
      <Route
        path="/context"
        element={
          <ProtectedRoute requireContext={false}>
            <ContextSelector />
          </ProtectedRoute>
        }
      />

      {/* Protegidas (con Layout persistente) */}
      <Route
        element={
          <ProtectedRoute requireContext={true}>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/menu" element={<MainMenu />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/consulta" element={<EmployeeForm />} />
        <Route path="/empresa" element={<EmpresaComponent />} />
        <Route path="/afp" element={<AfpComponent />} />
        <Route path="/persona-natural" element={<PersonaNaturalComponent />} />
        <Route path="/situacion-registro" element={<SituacionRegistroComponent />} />
        <Route path="/situacion-trabajador" element={<SituacionTrabajadorComponent />} />
        <Route path="/area" element={<AreaComponent />} />
        <Route path="/banco" element={<BancoComponent />} />
        <Route path="/cargo-empresa" element={<CargoEmpresaComponent />} />
        <Route path="/categoria-trabajador" element={<CategoriaTrabajadorComponent />} />
        <Route path="/categoria-reintegro" element={<CategoriaTrabajadorReintegroComponent />} />
        <Route path="/centro-costo" element={<CentroCostoComponent />} />
        <Route path="/concepto-planilla" element={<ConceptoPlanillaComponent />} />
        <Route path="/condicion-trabajador" element={<CondicionTrabajadorComponent />} />
        <Route path="/configura-planilla" element={<ConfiguraPlanillaComponent />} />
        <Route path="/configura-remuneracion-variable" element={<ConfiguraRemuneracionVariableComponent />} />
        <Route path="/contrato-laboral" element={<ContratoLaboralComponent />} />
        <Route path="/control-vacacional" element={<ControlVacacionalComponent />} />
        <Route path="/cts-calculada" element={<CTSCalculadaComponent />} />
        <Route path="/cuenta-corriente-planillas" element={<CuentaCorrientePlanillasComponent />} />
        <Route path="/cuenta-contable" element={<CuentaContableComponent />} />
        <Route path="dias-utiles-mes" element={<DiasUtilesMesComponent />} />
        <Route path="/dias-utiles-semana" element={<DiasUtilesSemanaComponent />} />
        <Route path="/deduccion-periodo" element={<DeduccionPeriodoComponent />} />
        <Route path="/entidad-eps" element={<EntidadEpsComponent />} />
        <Route path="/establecimientos" element={<EstablecimientoComponent />} />
        <Route path="/estado-civil" element={<EstadoCivilComponent />} />
        <Route path="/familias" element={<FamiliaComponent />} />
        <Route path="/familia-remuneracion-variable" element={<FamiliaRemuneracionVariableComponent />} />
        <Route path="/fecha-vigencia-impuesto" element={<FechaVigenciaImpuestoComponent />} />
        <Route path="/frecuencia" element={<FrecuenciaComponent  />} />
        <Route path="/grado-academico" element={<GradoAcademicoComponent />} />
        <Route path="/grupo-gasto" element={<GrupoGastoComponent />} />
        <Route path="/grupo-operativo" element={<GrupoOperativoComponent />} />
        <Route path="/reportes/conceptos" element={<ConceptosReport />} />
      </Route>

      {/* Home & 404 */}
      <Route path="/" element={<SmartHome />} />
      <Route path="*" element={<SmartHome />} />
    </Routes>
  );
}
