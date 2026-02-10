#D:\payroll_project_3\backend\concepto_planilla.py
from fastapi import APIRouter, Depends, HTTPException, Path
from pydantic import BaseModel
from typing import Optional, List
import pyodbc

from database import get_connection
from security import get_current_user

router = APIRouter(prefix="/concepto-planilla", tags=["ConceptoPlanilla"])

# ------------ Modelos ------------
class ConceptoPlanillaCreate(BaseModel):
    IDConceptoPlanilla: int
    ConceptoPlanilla: str
    ConceptoAbreviado: Optional[str] = None
    TipoConcepto: int
    TipoConceptoGasto: Optional[int] = None
    TipoHoraDia: int
    IndicadorSubsidioCheck: Optional[bool] = False
    IndicadorCuentaCorrienteCheck: Optional[bool] = False
    IndicadorDescuentoJudicialCheck: Optional[bool] = False
    IndicadorAfpCheck: Optional[bool] = False
    IndicadorScrtSaludCheck: Optional[bool] = False
    IndicadorScrtPensionCheck: Optional[bool] = False
    IndicadorAporteEssaludCheck: Optional[bool] = False
    IndicadoAporteSenatiCheck: Optional[bool] = False
    IndicadorAporteSCRTCheck: Optional[bool] = False
    IndicadorAporteVidaCheck: Optional[bool] = False
    IndicadorExclusionCostosCheck: Optional[bool] = False
    PKIDPlameConcepto: Optional[int] = None
    PKIDSituacionRegistro: int

class ConceptoPlanillaUpdate(ConceptoPlanillaCreate):
    PKID: int


# ------------ Listar ------------
@router.get("/", dependencies=[Depends(get_current_user)])
def listar_conceptos():
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT
                c.PKID,
                c.IDConceptoPlanilla,
                c.ConceptoPlanilla,
                c.ConceptoAbreviado,
                c.TipoConcepto,
                c.TipoConceptoGasto,
                c.TipoHoraDia,
                c.IndicadorSubsidioCheck,
                c.IndicadorCuentaCorrienteCheck,
                c.IndicadorDescuentoJudicialCheck,
                c.IndicadorAfpCheck,
                c.IndicadorScrtSaludCheck,
                c.IndicadorScrtPensionCheck,
                c.IndicadorAporteEssaludCheck,
                c.IndicadoAporteSenatiCheck,
                c.IndicadorAporteSCRTCheck,
                c.IndicadorAporteVidaCheck,
                c.IndicadorExclusionCostosCheck,
                c.PKIDPlameConcepto,
                pc.PlameConcepto AS PlameConceptoNombre,
                c.PKIDSituacionRegistro,
                s.SituacionRegistro
            FROM ConceptoPlanilla c
            LEFT JOIN PlameConcepto pc ON pc.PKID = c.PKIDPlameConcepto
            INNER JOIN SituacionRegistro s ON s.PKID = c.PKIDSituacionRegistro
            ORDER BY c.IDConceptoPlanilla
        """)
        cols = [c[0] for c in cur.description]
        rows = [dict(zip(cols, r)) for r in cur.fetchall()]
        return rows
    finally:
        cur.close()
        conn.close()


# ------------ Crear ------------
@router.post("/", dependencies=[Depends(get_current_user)])
def crear_concepto(body: ConceptoPlanillaCreate):
    conn = get_connection()
    cur = conn.cursor()
    try:
        # Unicidad por IDConceptoPlanilla
        cur.execute("SELECT 1 FROM ConceptoPlanilla WHERE IDConceptoPlanilla = ?", (body.IDConceptoPlanilla,))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="Ya existe un concepto con ese IDConceptoPlanilla.")

        insert_sql = """
        INSERT INTO ConceptoPlanilla (
            IDConceptoPlanilla, ConceptoPlanilla, ConceptoAbreviado,
            TipoConcepto, TipoConceptoGasto, TipoHoraDia,
            IndicadorSubsidioCheck, IndicadorCuentaCorrienteCheck, IndicadorDescuentoJudicialCheck,
            IndicadorAfpCheck, IndicadorScrtSaludCheck, IndicadorScrtPensionCheck,
            IndicadorAporteEssaludCheck, IndicadoAporteSenatiCheck, IndicadorAporteSCRTCheck,
            IndicadorAporteVidaCheck, IndicadorExclusionCostosCheck,
            PKIDPlameConcepto, PKIDSituacionRegistro
        ) OUTPUT inserted.PKID
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        params = (
            body.IDConceptoPlanilla, body.ConceptoPlanilla, body.ConceptoAbreviado,
            body.TipoConcepto, body.TipoConceptoGasto, body.TipoHoraDia,
            body.IndicadorSubsidioCheck, body.IndicadorCuentaCorrienteCheck, body.IndicadorDescuentoJudicialCheck,
            body.IndicadorAfpCheck, body.IndicadorScrtSaludCheck, body.IndicadorScrtPensionCheck,
            body.IndicadorAporteEssaludCheck, body.IndicadoAporteSenatiCheck, body.IndicadorAporteSCRTCheck,
            body.IndicadorAporteVidaCheck, body.IndicadorExclusionCostosCheck,
            body.PKIDPlameConcepto, body.PKIDSituacionRegistro
        )
        cur.execute(insert_sql, params)
        new_id = cur.fetchone()[0]
        conn.commit()
        return {"PKID": new_id}
    except pyodbc.Error as ex:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(ex))
    finally:
        cur.close()
        conn.close()


# ------------ Actualizar ------------
@router.put("/{PKID}", dependencies=[Depends(get_current_user)])
def actualizar_concepto(PKID: int, body: ConceptoPlanillaUpdate):
    if PKID != body.PKID:
        raise HTTPException(status_code=400, detail="PKID inconsistente.")

    conn = get_connection()
    cur = conn.cursor()
    try:
        update_sql = """
        UPDATE ConceptoPlanilla SET
            IDConceptoPlanilla = ?,
            ConceptoPlanilla = ?,
            ConceptoAbreviado = ?,
            TipoConcepto = ?,
            TipoConceptoGasto = ?,
            TipoHoraDia = ?,
            IndicadorSubsidioCheck = ?,
            IndicadorCuentaCorrienteCheck = ?,
            IndicadorDescuentoJudicialCheck = ?,
            IndicadorAfpCheck = ?,
            IndicadorScrtSaludCheck = ?,
            IndicadorScrtPensionCheck = ?,
            IndicadorAporteEssaludCheck = ?,
            IndicadoAporteSenatiCheck = ?,
            IndicadorAporteSCRTCheck = ?,
            IndicadorAporteVidaCheck = ?,
            IndicadorExclusionCostosCheck = ?,
            PKIDPlameConcepto = ?,
            PKIDSituacionRegistro = ?
        WHERE PKID = ?
        """
        params = (
            body.IDConceptoPlanilla, body.ConceptoPlanilla, body.ConceptoAbreviado,
            body.TipoConcepto, body.TipoConceptoGasto, body.TipoHoraDia,
            body.IndicadorSubsidioCheck, body.IndicadorCuentaCorrienteCheck, body.IndicadorDescuentoJudicialCheck,
            body.IndicadorAfpCheck, body.IndicadorScrtSaludCheck, body.IndicadorScrtPensionCheck,
            body.IndicadorAporteEssaludCheck, body.IndicadoAporteSenatiCheck, body.IndicadorAporteSCRTCheck,
            body.IndicadorAporteVidaCheck, body.IndicadorExclusionCostosCheck,
            body.PKIDPlameConcepto, body.PKIDSituacionRegistro,
            body.PKID
        )
        cur.execute(update_sql, params)
        if cur.rowcount == 0:
            conn.rollback()
            raise HTTPException(status_code=404, detail="Concepto no encontrado.")
        conn.commit()
        return {"ok": True}
    except pyodbc.Error as ex:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(ex))
    finally:
        cur.close()
        conn.close()


# ------------ Eliminar ------------
@router.delete("/{PKID}", dependencies=[Depends(get_current_user)])
def eliminar_concepto(PKID: int = Path(..., gt=0)):
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM ConceptoPlanilla WHERE PKID = ?", (PKID,))
        if cur.rowcount == 0:
            conn.rollback()
            raise HTTPException(status_code=404, detail="Concepto no encontrado.")
        conn.commit()
        return {"ok": True}
    except pyodbc.Error as ex:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(ex))
    finally:
        cur.close()
        conn.close()
