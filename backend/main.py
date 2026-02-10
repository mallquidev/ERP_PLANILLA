
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from auth import router as auth_router
from payroll import router as payroll_router

from situacion import router as situacion_router
from situacion_trabajador import router as situacion_trabajador_router

from empresa import router as empresa_router
from empresa_combos import router as empresa_combos_router

from afp import router as afp_router
from afp_combos import router as afp_combos_router

from dashboard import router as dashboard_router   # <-- importar

from reports import router as reports_router

from listanomina import router as lista_nomina_router
from listaperiodo import router as lista_periodo_router

from persona_natural import router as persona_natural_router
from persona_natural_combos import router as persona_natural_combos_router

from area import router as area_router
from area_combos import router as area_combos_router

from banco import router as banco_router
from banco_combos import router as banco_combos_router

from cargo_empresa import router as cargo_empresa_router
from cargo_combos import router as cargo_combos_router
from categoria_trabajador import router as categoria_trabajador_router
from categoria_trabajador_combos import router as categoria_trabajador_combos_router 
from ctr_combos import router as ctr_combos_router
from categoria_trabajador_reintegro import router as ctr_router
from centro_costo import router as centro_costo_router
from cc_combos import router as cc_combos_router
from concepto_planilla import router as concepto_planilla_router
from concepto_planilla_combos import router as cp_combos_router
# Agregar imports
from condicion_trabajador import router as condicion_trabajador_router
from condicion_trabajador_combos import router as condicion_trabajador_combos_router

from configura_remuneracion_variable import router as remunvar_router
from configura_remuneracion_variable_combos import router as remunvar_combos_router

from configura_planilla import router as configura_planilla_router
from configura_planilla_combos import router as configura_planilla_combos_router

from contrato_laboral import router as contrato_laboral_router
from contrato_laboral_combos import router as contrato_laboral_combos_router
from adenda_contrato_laboral import router as adenda_contrato_laboral_router

from control_vacacional import router as control_vacacional_router
from control_vacacional_periodo import router as control_vacacional_periodo_router
from control_vacacional_combos import router as control_vacacional_combos_router

from cts_calculada import router as cts_calculada_router
from cts_calculada_concepto import router as cts_calculada_concepto_router
from cts_calculada_combos import router as cts_calculada_combos_router

from cuenta_corriente_planillas import router as ccp_router
from cuenta_corriente_planillas_aplicacion import router as ccp_aplicacion_router
from cuenta_corriente_planillas_cuotas import router as ccp_cuotas_router
from cuenta_corriente_planillas_combos import router as ccp_combos_router

from cuenta_contable import router as cuenta_contable_router
from cuenta_contable_combos import router as cuenta_contable_combos_router

from dias_utiles_mes import router as dias_utiles_mes_router
from dias_utiles_mes_combos import router as dias_utiles_mes_combos_router

from dias_utiles_semana import router as dias_utiles_semana_router
from dias_utiles_semana_combos import router as dias_utiles_semana_combos_router

from deduccion_periodo import router as deduccion_periodo_router
from deduccion_periodo_familia import router as deduccion_periodo_familia_router
from deducciones_periodo_nomina_cuenta_contable import router as deducciones_nomina_cta_router
from deduccion_periodo_combos import router as deduccion_periodo_combos_router

from entidad_eps import router as entidad_eps_router
from entidad_eps_combos import router as entidad_eps_combos_router

from establecimiento import router as establecimiento_router
from establecimiento_combos import router as establecimiento_combos_router

from estado_civil import router as estado_civil_router
from estado_civil_combos import router as estado_civil_combos_router

from familia import router as familia_router
from familia_combos import router as familia_combos_router

from familia_remuneracion_variable import router as frv_router
from familia_remuneracion_variable_combos import router as frv_combo_router

from fecha_vigencia_impuesto import router as fvi_router
from fecha_vigencia_impuesto_combos import router as fvi_combo_router

from frecuencia import router as frecuencia_router
from frecuencia_combos import router as frecuencia_combo_router

from grado_academico import router as grado_academico_router
from grado_academico_combos import router as grado_academico_combos_router

from grupo_gasto import router as grupo_gasto_router
from grupo_gasto_combos import router as grupo_gasto_combos_router

from grupo_operativo import router as grupo_operativo_router
from grupo_operativo_combos import router as grupo_operativo_combos_router


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],  # Authorization y Content-Type incluidos
)


app.include_router(auth_router)
app.include_router(payroll_router)
app.include_router(situacion_router)
app.include_router(situacion_trabajador_router)
app.include_router(empresa_router)
app.include_router(empresa_combos_router)

# ✅ monta AFP
app.include_router(afp_router)
app.include_router(afp_combos_router)
app.include_router(dashboard_router) 
app.include_router(reports_router)


# 🔽 MONTA LAS RUTAS DE LISTA-NOMINA / LISTA-PERIODO
app.include_router(lista_nomina_router)
app.include_router(lista_periodo_router)

app.include_router(persona_natural_router)
app.include_router(persona_natural_combos_router)
app.include_router(area_router)
app.include_router(area_combos_router)

app.include_router(banco_router)
app.include_router(banco_combos_router)

app.include_router(cargo_empresa_router)
app.include_router(cargo_combos_router)

app.include_router(categoria_trabajador_router)
app.include_router(categoria_trabajador_combos_router)

app.include_router(ctr_combos_router)
app.include_router(ctr_router)

app.include_router(cc_combos_router)
app.include_router(centro_costo_router)

app.include_router(cp_combos_router)
app.include_router(concepto_planilla_router)

# Agregar routers
app.include_router(condicion_trabajador_router)
app.include_router(condicion_trabajador_combos_router)

app.include_router(remunvar_router)
app.include_router(remunvar_combos_router)

app.include_router(configura_planilla_router)
app.include_router(configura_planilla_combos_router)

app.include_router(contrato_laboral_router)
app.include_router(contrato_laboral_combos_router)
app.include_router(adenda_contrato_laboral_router)

app.include_router(control_vacacional_combos_router)
app.include_router(control_vacacional_router)
app.include_router(control_vacacional_periodo_router)

app.include_router(cts_calculada_combos_router)
app.include_router(cts_calculada_router)
app.include_router(cts_calculada_concepto_router)

app.include_router(ccp_combos_router)
app.include_router(ccp_router)
app.include_router(ccp_aplicacion_router)
app.include_router(ccp_cuotas_router)

app.include_router(cuenta_contable_router)
app.include_router(cuenta_contable_combos_router)

app.include_router(dias_utiles_mes_router)
app.include_router(dias_utiles_mes_combos_router)

app.include_router(dias_utiles_semana_router)
app.include_router(dias_utiles_semana_combos_router)

app.include_router(deduccion_periodo_router)
app.include_router(deduccion_periodo_familia_router)
app.include_router(deducciones_nomina_cta_router)
app.include_router(deduccion_periodo_combos_router)

app.include_router(entidad_eps_router)
app.include_router(entidad_eps_combos_router)

app.include_router(establecimiento_router)
app.include_router(establecimiento_combos_router)

app.include_router(estado_civil_router)
app.include_router(estado_civil_combos_router)

app.include_router(familia_router)
app.include_router(familia_combos_router)

app.include_router(frv_router)
app.include_router(frv_combo_router)

app.include_router(frecuencia_router)
app.include_router(frecuencia_combo_router)

app.include_router(grado_academico_router)
app.include_router(grado_academico_combos_router)

app.include_router(grupo_gasto_router)
app.include_router(grupo_gasto_combos_router)

app.include_router(grupo_operativo_router)
app.include_router(grupo_operativo_combos_router)