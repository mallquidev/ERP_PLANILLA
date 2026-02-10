# backend/cuenta_corriente_planillas_aplicacion.py
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
import pyodbc

from database import get_connection
from security import get_current_user

router = APIRouter(prefix="/ccp-aplicacion", tags=["CuentaCorrientePlanillasAplicacion"])

class CCPACreate(BaseModel):
    PKIDCuentaCorrientePlanillas: int
    PKIDTipoPlanilla: int
    PKIDSituacionRegistro: int

class CCPAUpdate(CCPACreate):
    PKID: int

@router.get("/", dependencies=[Depends(get_current_user)])
def listar(ccId: int = Query(...)):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT a.PKID, a.PKIDCuentaCorrientePlanillas, a.PKIDTipoPlanilla, tp.TipoPlanilla,
                   a.PKIDSituacionRegistro, s.SituacionRegistro
            FROM CuentaCorrientePlanillasAplicacion a
            INNER JOIN TipoPlanilla tp ON tp.PKID = a.PKIDTipoPlanilla
            INNER JOIN SituacionRegistro s ON s.PKID = a.PKIDSituacionRegistro
            WHERE a.PKIDCuentaCorrientePlanillas = ?
            ORDER BY tp.TipoPlanilla
        """, (ccId,))
        rows = cur.fetchall()
        return [{
            "PKID": r.PKID,
            "PKIDCuentaCorrientePlanillas": r.PKIDCuentaCorrientePlanillas,
            "PKIDTipoPlanilla": r.PKIDTipoPlanilla,
            "TipoPlanilla": r.TipoPlanilla,
            "PKIDSituacionRegistro": r.PKIDSituacionRegistro,
            "SituacionRegistro": r.SituacionRegistro
        } for r in rows]
    except pyodbc.Error as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", dependencies=[Depends(get_current_user)])
def crear(payload: CCPACreate):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT 1 FROM CuentaCorrientePlanillasAplicacion
            WHERE PKIDCuentaCorrientePlanillas=? AND PKIDTipoPlanilla=?
        """, (payload.PKIDCuentaCorrientePlanillas, payload.PKIDTipoPlanilla))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="Ya existe esa TipoPlanilla para la cuenta.")
        cur.execute("""
            INSERT INTO CuentaCorrientePlanillasAplicacion (
                PKIDCuentaCorrientePlanillas, PKIDTipoPlanilla, PKIDSituacionRegistro
            ) VALUES (?, ?, ?)
        """, (payload.PKIDCuentaCorrientePlanillas, payload.PKIDTipoPlanilla, payload.PKIDSituacionRegistro))
        conn.commit()
        new_id = cur.execute("SELECT SCOPE_IDENTITY()").fetchval()
        return {"PKID": int(new_id)}
    except HTTPException:
        raise
    except pyodbc.Error as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{pkid}", dependencies=[Depends(get_current_user)])
def actualizar(pkid: int, payload: CCPAUpdate):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT 1 FROM CuentaCorrientePlanillasAplicacion WHERE PKID=?", (pkid,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Registro no encontrado.")
        cur.execute("""
            SELECT 1 FROM CuentaCorrientePlanillasAplicacion
            WHERE PKIDCuentaCorrientePlanillas=? AND PKIDTipoPlanilla=? AND PKID<>?
        """, (payload.PKIDCuentaCorrientePlanillas, payload.PKIDTipoPlanilla, pkid))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="Duplicado para esa cuenta.")
        cur.execute("""
            UPDATE CuentaCorrientePlanillasAplicacion
            SET PKIDCuentaCorrientePlanillas=?, PKIDTipoPlanilla=?, PKIDSituacionRegistro=?
            WHERE PKID=?
        """, (payload.PKIDCuentaCorrientePlanillas, payload.PKIDTipoPlanilla, payload.PKIDSituacionRegistro, pkid))
        conn.commit()
        return {"ok": True}
    except pyodbc.Error as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{pkid}", dependencies=[Depends(get_current_user)])
def eliminar(pkid: int):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("DELETE FROM CuentaCorrientePlanillasAplicacion WHERE PKID=?", (pkid,))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Registro no encontrado.")
        conn.commit()
        return {"ok": True}
    except pyodbc.Error as e:
        raise HTTPException(status_code=500, detail=str(e))
