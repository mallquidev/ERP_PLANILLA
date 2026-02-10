# configura_planilla.py
from fastapi import APIRouter, Depends, HTTPException, Path
from pydantic import BaseModel
from typing import Optional, Dict, Any
import pyodbc

from database import get_connection
from security import get_current_user

router = APIRouter(prefix="/configura-planilla", tags=["ConfiguraPlanilla"])

# ------------------- MODELOS -------------------
class ConfiguraPlanillaCreate(BaseModel):
    PKIDEmpresa: int
    PKIDNomina: int
    PlanillaIntegradaCheck: Optional[bool] = None
    ConceptoVacaciones: Optional[int] = None
    ConceptoQuincena: Optional[int] = None
    ConceptoGratificacion: Optional[int] = None
    ConceptoOtraGratificacion1: Optional[int] = None
    PorcentajeQuincena: Optional[float] = None
    PorcenjateGratificacion: Optional[float] = None
    ConceptoGratificacionTrunca: Optional[int] = None
    ConceptoOtraGratificacion2: Optional[int] = None
    IndicadorRemuneracionDolares: Optional[bool] = None
    ConceptoCTS: Optional[int] = None
    OrigenContablePlanilla: Optional[str] = None
    OrigenContablePrestamos: Optional[str] = None
    PeriodoInicioContable: Optional[str] = None
    ConceptoAsignacionFamiliar: Optional[int] = None
    ConceptoBasico: Optional[int] = None
    HoraAdelantoVacaciones: Optional[int] = None
    CuentaBancariaSoles: Optional[str] = None
    CuentaBancariaDolares: Optional[str] = None
    IndicadorRedondeo: Optional[bool] = None
    ConceptoVacacionAdelantada: Optional[int] = None
    ConceptoAdelantoQuincena: Optional[int] = None
    ConceptoAdelantoGratificacion: Optional[int] = None
    ConceptoAdelantoVacaciones: Optional[int] = None
    ConceptoVacacionesTrunca: Optional[int] = None
    ConceptoUtilidades: Optional[int] = None
    ConceptoAdelantoUtilidades: Optional[int] = None
    PeriodoInicioControlVacacional: Optional[str] = None
    ModoControlVacacional: Optional[int] = None
    ConceptoIndeminizable: Optional[int] = None
    IndicadorOtraCia: Optional[bool] = None
    IDOtraCia: Optional[int] = None
    ConceptoPromedioRemuneracionVariable: Optional[int] = None
    PeriodoInicioPlanilla: Optional[str] = None
    ConceptoCtsRIA: Optional[int] = None
    HoraBasico: Optional[int] = None
    HoraSubsidio: Optional[int] = None
    CuentaContableNetoLBS: Optional[int] = None
    OrigenContableLBS: Optional[str] = None
    DiferenciaCambio: Optional[float] = None
    CuentaContableAjusteDebe: Optional[int] = None
    CuentaContableAjusteHaber: Optional[int] = None
    CuentaContableNetoPlanillas: Optional[int] = None
    CentroCostoAjuste: Optional[int] = None
    ConceptoVacacionesPromedio: Optional[int] = None
    ConceptoBonificacionVacaciones: Optional[int] = None
    TItmod: Optional[int] = None
    TTrnro: Optional[int] = None
    TItnrel: Optional[int] = None
    BonificacionGraciosa: Optional[int] = None
    PeriodoInicioPlame: Optional[str] = None
    ConceptoDevolucionRenta: Optional[int] = None
    IndicadorDevolucionRenta: Optional[bool] = None
    ConceptoPromedioHorasExtras: Optional[int] = None
    ConceptoBasicoIntegral: Optional[int] = None
    ImporteRemuneracionMinivaVital: Optional[float] = None
    EdadJubilacion: Optional[int] = None
    TiempoServicioVidaLey: Optional[int] = None
    DiasMinimoSubsidioCtsVac: Optional[int] = None
    DiasMaximoSubsidioCtsVac: Optional[int] = None
    LongitudCuentaContable: Optional[int] = None
    OrigenContableProvisionVacaciones: Optional[str] = None
    OrigenContableProvisionGratificaciones: Optional[str] = None
    OrigenContableProvisionCTS: Optional[str] = None
    LongitudCodigoCorrelativo: Optional[int] = None
    ConceptoOtrosIngresos: Optional[int] = None
    ConceptoBonificacionNocturna: Optional[int] = None
    JornalesPorMesDiciembre: Optional[int] = None
    JornalesPorMesJulio: Optional[int] = None
    NumeroJornales: Optional[int] = None
    ConceptoPrimaTextil: Optional[int] = None
    ConceptoSobregiroOtorgado: Optional[int] = None
    ConceptoSobregiroPendiente: Optional[int] = None
    ConceptoEssaludVida: Optional[int] = None
    ConceptoEssaludVidaEmpleador: Optional[int] = None
    ConceptoCtsIntegral: Optional[int] = None
    ConceptoGratificacionIntegral: Optional[int] = None
    ConceptoVacacionesIntegral: Optional[int] = None
    DiasMinimoUtilidades: Optional[int] = None
    IndicadorAfpEmpleador: Optional[bool] = None
    PorcentajeJornadaNocturna: Optional[float] = None
    PrefijoCodigo: Optional[str] = None
    OrigenContableUtilidades: Optional[str] = None
    ConceptoConsumoComedor: Optional[int] = None
    TopeRemuneracionUtilidades: Optional[int] = None
    ConceptoComision: Optional[int] = None
    AplicaIGVDescuentoEPS: Optional[bool] = None
    TasaIgv: Optional[float] = None
    ConceptoPromedioVacacionesAdelantadas: Optional[int] = None
    PKIDSituacionRegistro: Optional[int] = None
    ConceptoVacacionesAdelantadas: Optional[int] = None
    ConceptoBonificacionNoche: Optional[int] = None
    ConceptoPromedioCompraVacaciones: Optional[int] = None
    ConceptoIngresoEPS: Optional[int] = None
    ConceptoDescuentoEPS: Optional[int] = None
    ConceptoAporteEPS: Optional[int] = None
    IndicadorPymeCheck: Optional[bool] = None
    PorcentajeGratificacionPyme: Optional[float] = None
    PorcentajeCtsPyme: Optional[float] = None
    PorcentajeVacacionPyme: Optional[float] = None
    ConceptoVariableLiquidacion: Optional[int] = None

class ConfiguraPlanillaUpdate(ConfiguraPlanillaCreate):
    PKID: int

# ------------------- HELPERS -------------------
def dict_from_cursor(cur) -> list[Dict[str, Any]]:
    cols = [c[0] for c in cur.description]
    return [dict(zip(cols, r)) for r in cur.fetchall()]

# ------------------- LISTAR -------------------
@router.get("/", dependencies=[Depends(get_current_user)])
def listar():
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT c.*, 
                   e.RazonSocial AS Empresa,
                   n.Nomina AS Nomina,
                   s.SituacionRegistro
              FROM ConfiguraPlanilla c
         LEFT JOIN Empresa e  ON e.PKID  = c.PKIDEmpresa
         LEFT JOIN Nomina  n  ON n.PKID  = c.PKIDNomina
         LEFT JOIN SituacionRegistro s ON s.PKID = c.PKIDSituacionRegistro
          ORDER BY c.PKID DESC
        """)
        return dict_from_cursor(cur)
    finally:
        cur.close()
        conn.close()

# ------------------- OBTENER POR ID -------------------
@router.get("/{PKID}", dependencies=[Depends(get_current_user)])
def obtener(PKID: int = Path(..., gt=0)):
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT c.*, 
                   e.RazonSocial AS Empresa,
                   n.Nomina AS Nomina,
                   s.SituacionRegistro
              FROM ConfiguraPlanilla c
         LEFT JOIN Empresa e  ON e.PKID  = c.PKIDEmpresa
         LEFT JOIN Nomina  n  ON n.PKID  = c.PKIDNomina
         LEFT JOIN SituacionRegistro s ON s.PKID = c.PKIDSituacionRegistro
             WHERE c.PKID = ?
        """, (PKID,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Configuración no encontrada")
        cols = [c[0] for c in cur.description]
        return dict(zip(cols, row))
    finally:
        cur.close()
        conn.close()

# ------------------- CREAR -------------------
@router.post("/", dependencies=[Depends(get_current_user)])
def crear(body: ConfiguraPlanillaCreate):
    conn = get_connection()
    cur = conn.cursor()
    try:
        # validación de unicidad (empresa + nómina)
        cur.execute("SELECT 1 FROM ConfiguraPlanilla WHERE PKIDEmpresa = ? AND PKIDNomina = ?",
                    (body.PKIDEmpresa, body.PKIDNomina))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="Ya existe una configuración para esa Empresa y Nómina.")

        data = body.dict()
        cols = ", ".join(data.keys())
        placeholders = ", ".join(["?"] * len(data))
        values = tuple(data.values())

        sql = f"INSERT INTO ConfiguraPlanilla ({cols}) OUTPUT inserted.PKID VALUES ({placeholders})"
        cur.execute(sql, values)
        new_id = cur.fetchone()[0]
        conn.commit()
        return {"PKID": new_id}
    finally:
        cur.close()
        conn.close()

# ------------------- ACTUALIZAR -------------------
@router.put("/{PKID}", dependencies=[Depends(get_current_user)])
def actualizar(PKID: int, body: ConfiguraPlanillaUpdate):
    if PKID != body.PKID:
        raise HTTPException(status_code=400, detail="PKID no coincide con el body")

    conn = get_connection()
    cur = conn.cursor()
    try:
        # si cambia Empresa/Nómina, revisar unicidad
        cur.execute("""
            SELECT 1 FROM ConfiguraPlanilla 
            WHERE PKIDEmpresa = ? AND PKIDNomina = ? AND PKID <> ?
        """, (body.PKIDEmpresa, body.PKIDNomina, PKID))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="Ya existe una configuración para esa Empresa y Nómina.")

        data = body.dict()
        data.pop("PKID", None)

        set_clause = ", ".join([f"{k}=?" for k in data.keys()])
        values = tuple(data.values()) + (PKID,)

        sql = f"UPDATE ConfiguraPlanilla SET {set_clause} WHERE PKID = ?"
        cur.execute(sql, values)
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Configuración no encontrada")
        conn.commit()
        return {"ok": True}
    finally:
        cur.close()
        conn.close()

# ------------------- ELIMINAR -------------------
@router.delete("/{PKID}", dependencies=[Depends(get_current_user)])
def eliminar(PKID: int = Path(..., gt=0)):
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM ConfiguraPlanilla WHERE PKID = ?", (PKID,))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Configuración no encontrada")
        conn.commit()
        return {"ok": True}
    finally:
        cur.close()
        conn.close()
