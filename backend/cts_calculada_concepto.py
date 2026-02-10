# backend/cts_calculada_concepto.py
from fastapi import APIRouter, Depends, HTTPException, Query, Path
from pydantic import BaseModel
from typing import Optional
import pyodbc

from database import get_connection
from security import get_current_user

router = APIRouter(prefix="/cts-calculada-concepto", tags=["CTSCalculadaConcepto"])

class ConceptoCreate(BaseModel):
    PKIDCTSCalculada: int
    PKIDConceptoPlanilla: int
    BaseImponibleCTS: Optional[float] = None
    FactorCTS: Optional[float] = None
    ImporteCTS: Optional[float] = None
    TipoCalculoCTS: Optional[str] = None  # char(1)
    PKIDSituacionRegistro: int

class ConceptoUpdate(ConceptoCreate):
    PKID: int

@router.get("/", dependencies=[Depends(get_current_user)])
def listar_conceptos(ctsId: int = Query(...)):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT
                d.PKID, d.PKIDCTSCalculada, d.PKIDConceptoPlanilla,
                cp.ConceptoPlanilla,
                d.BaseImponibleCTS, d.FactorCTS, d.ImporteCTS, d.TipoCalculoCTS,
                d.PKIDSituacionRegistro, s.SituacionRegistro
            FROM CTSCalculadaConcepto d
            INNER JOIN ConceptoPlanilla cp ON cp.PKID = d.PKIDConceptoPlanilla
            INNER JOIN SituacionRegistro s ON s.PKID = d.PKIDSituacionRegistro
            WHERE d.PKIDCTSCalculada = ?
            ORDER BY cp.ConceptoPlanilla
        """, (ctsId,))
        rows = cur.fetchall()
        out = []
        for r in rows:
            out.append({
                "PKID": r.PKID,
                "PKIDCTSCalculada": r.PKIDCTSCalculada,
                "PKIDConceptoPlanilla": r.PKIDConceptoPlanilla,
                "ConceptoPlanilla": r.ConceptoPlanilla,
                "BaseImponibleCTS": float(r.BaseImponibleCTS) if r.BaseImponibleCTS is not None else None,
                "FactorCTS": float(r.FactorCTS) if r.FactorCTS is not None else None,
                "ImporteCTS": float(r.ImporteCTS) if r.ImporteCTS is not None else None,
                "TipoCalculoCTS": r.TipoCalculoCTS,
                "PKIDSituacionRegistro": r.PKIDSituacionRegistro,
                "SituacionRegistro": r.SituacionRegistro,
            })
        return out
    except pyodbc.Error as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", dependencies=[Depends(get_current_user)])
def crear_concepto(payload: ConceptoCreate):
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT 1 FROM CTSCalculadaConcepto
            WHERE PKIDCTSCalculada = ? AND PKIDConceptoPlanilla = ?
        """, (payload.PKIDCTSCalculada, payload.PKIDConceptoPlanilla))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="Concepto ya existe para esta CTS.")

        cur.execute("""
            INSERT INTO CTSCalculadaConcepto (
                PKIDCTSCalculada, PKIDConceptoPlanilla, BaseImponibleCTS, FactorCTS, ImporteCTS,
                TipoCalculoCTS, PKIDSituacionRegistro
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            payload.PKIDCTSCalculada, payload.PKIDConceptoPlanilla, payload.BaseImponibleCTS,
            payload.FactorCTS, payload.ImporteCTS, payload.TipoCalculoCTS, payload.PKIDSituacionRegistro
        ))
        conn.commit()
        new_id = cur.execute("SELECT SCOPE_IDENTITY()").fetchval()
        return {"PKID": int(new_id)}
    except HTTPException:
        raise
    except pyodbc.Error as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{pkid}", dependencies=[Depends(get_current_user)])
def actualizar_concepto(pkid: int, payload: ConceptoUpdate):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT 1 FROM CTSCalculadaConcepto WHERE PKID = ?", (pkid,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Concepto no encontrado.")

        cur.execute("""
            SELECT 1 FROM CTSCalculadaConcepto
            WHERE PKIDCTSCalculada = ? AND PKIDConceptoPlanilla = ? AND PKID <> ?
        """, (payload.PKIDCTSCalculada, payload.PKIDConceptoPlanilla, pkid))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="Duplicado para esta CTS.")

        cur.execute("""
            UPDATE CTSCalculadaConcepto
            SET PKIDCTSCalculada=?, PKIDConceptoPlanilla=?, BaseImponibleCTS=?, FactorCTS=?, ImporteCTS=?,
                TipoCalculoCTS=?, PKIDSituacionRegistro=?
            WHERE PKID=?
        """, (
            payload.PKIDCTSCalculada, payload.PKIDConceptoPlanilla, payload.BaseImponibleCTS, payload.FactorCTS,
            payload.ImporteCTS, payload.TipoCalculoCTS, payload.PKIDSituacionRegistro, pkid
        ))
        conn.commit()
        return {"ok": True}
    except pyodbc.Error as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{pkid}", dependencies=[Depends(get_current_user)])
def eliminar_concepto(pkid: int):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("DELETE FROM CTSCalculadaConcepto WHERE PKID = ?", (pkid,))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Concepto no encontrado.")
        conn.commit()
        return {"ok": True}
    except pyodbc.Error as e:
        raise HTTPException(status_code=500, detail=str(e))
