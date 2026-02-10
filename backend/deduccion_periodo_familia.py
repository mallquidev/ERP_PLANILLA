# deduccion_periodo_familia.py
from fastapi import APIRouter, Depends, HTTPException, Path, Query
from pydantic import BaseModel
from typing import Optional
import pyodbc

from database import get_connection
from security import get_current_user

router = APIRouter(prefix="/deduccion-periodo-familia", tags=["DeduccionPeriodoFamilia"])

class FamiliaBase(BaseModel):
    PKIDDeduccionPeriodo: int
    PKIDFamilia: int
    FactorPago: Optional[float] = None
    FactorDivision: Optional[float] = None
    PKIDSituacionregistro: int
    IndicadorFijoCheck: Optional[int] = None  # 1/0

class FamiliaCreate(FamiliaBase):
    pass

class FamiliaUpdate(BaseModel):
    PKIDFamilia: int
    FactorPago: Optional[float] = None
    FactorDivision: Optional[float] = None
    PKIDSituacionregistro: int
    IndicadorFijoCheck: Optional[int] = None

@router.get("/", dependencies=[Depends(get_current_user)])
def listar(pkid_deduccion_periodo: int = Query(...)):
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT f.PKID, f.PKIDDeduccionPeriodo, f.PKIDFamilia, fa.Familia,
                   f.FactorPago, f.FactorDivision, f.PKIDSituacionregistro, s.SituacionRegistro,
                   f.IndicadorFijoCheck
            FROM DeduccionPeriodoFamilia f
            INNER JOIN Familia fa ON fa.PKID = f.PKIDFamilia
            INNER JOIN SituacionRegistro s ON s.PKID = f.PKIDSituacionregistro
            WHERE f.PKIDDeduccionPeriodo = ?
            ORDER BY fa.Familia
        """, (pkid_deduccion_periodo,))
        cols = [c[0] for c in cur.description]
        return [dict(zip(cols, r)) for r in cur.fetchall()]
    finally:
        cur.close()
        conn.close()

@router.post("/", dependencies=[Depends(get_current_user)])
def crear(body: FamiliaCreate):
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            INSERT INTO DeduccionPeriodoFamilia (
                PKIDDeduccionPeriodo, PKIDFamilia, FactorPago, FactorDivision, PKIDSituacionregistro, IndicadorFijoCheck
            ) OUTPUT inserted.PKID
            VALUES (?, ?, ?, ?, ?, ?)
        """, (body.PKIDDeduccionPeriodo, body.PKIDFamilia, body.FactorPago, body.FactorDivision,
              body.PKIDSituacionregistro, body.IndicadorFijoCheck))
        new_id = cur.fetchone()[0]
        conn.commit()
        return {"PKID": new_id}
    except pyodbc.Error as ex:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(ex))
    finally:
        cur.close()
        conn.close()

@router.put("/{PKID}", dependencies=[Depends(get_current_user)])
def actualizar(PKID: int = Path(...), body: FamiliaUpdate = None):
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            UPDATE DeduccionPeriodoFamilia
            SET PKIDFamilia = ?, FactorPago = ?, FactorDivision = ?, PKIDSituacionregistro = ?, IndicadorFijoCheck = ?
            WHERE PKID = ?
        """, (body.PKIDFamilia, body.FactorPago, body.FactorDivision, body.PKIDSituacionregistro,
              body.IndicadorFijoCheck, PKID))
        if cur.rowcount == 0:
            conn.rollback()
            raise HTTPException(status_code=404, detail="Detalle no encontrado.")
        conn.commit()
        return {"ok": True}
    except pyodbc.Error as ex:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(ex))
    finally:
        cur.close()
        conn.close()

@router.delete("/{PKID}", dependencies=[Depends(get_current_user)])
def eliminar(PKID: int = Path(...)):
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM DeduccionPeriodoFamilia WHERE PKID = ?", (PKID,))
        if cur.rowcount == 0:
            conn.rollback()
            raise HTTPException(status_code=404, detail="Detalle no encontrado.")
        conn.commit()
        return {"ok": True}
    except pyodbc.Error as ex:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(ex))
    finally:
        cur.close()
        conn.close()
