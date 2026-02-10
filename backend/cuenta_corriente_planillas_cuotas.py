# backend/cuenta_corriente_planillas_cuotas.py
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
import pyodbc

from database import get_connection
from security import get_current_user

router = APIRouter(prefix="/ccp-cuotas", tags=["CuentaCorrientePlanillasCuotas"])

class CCPCreate(BaseModel):
    PKIDCuentaCorrientePlanillas: int
    NumeroCuota: int
    ano: int
    mes: int
    PKIDTipoPlanilla: int
    Semana: Optional[int] = None
    FechaCuotaEstimada: str
    ImporteCuota: float
    ImporteAplicado: Optional[float] = None
    PKIDNomina: int
    anoaplicacion: Optional[int] = None
    mesaplicacion: Optional[int] = None
    semanaaplicacion: Optional[int] = None
    SecuenciaAnoMesAplicacion: Optional[int] = None
    TipoPago: Optional[str] = None  # char(3)
    IndicadorProceso: Optional[int] = None
    PKIDSituacionRegistro: int

class CCPEdit(CCPCreate):
    PKID: int

@router.get("/", dependencies=[Depends(get_current_user)])
def listar(ccId: int = Query(...)):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT q.PKID, q.PKIDCuentaCorrientePlanillas, q.NumeroCuota,
                   q.ano, q.mes, q.PKIDTipoPlanilla, tp.TipoPlanilla,
                   q.Semana, q.FechaCuotaEstimada,
                   q.ImporteCuota, q.ImporteAplicado,
                   q.PKIDNomina, n.Nomina,
                   q.anoaplicacion, q.mesaplicacion, q.semanaaplicacion,
                   q.SecuenciaAnoMesAplicacion, q.TipoPago, q.IndicadorProceso,
                   q.PKIDSituacionRegistro, s.SituacionRegistro
            FROM CuentaCorrientePlanillasCuotas q
            INNER JOIN TipoPlanilla tp ON tp.PKID = q.PKIDTipoPlanilla
            INNER JOIN Nomina n ON n.PKID = q.PKIDNomina
            INNER JOIN SituacionRegistro s ON s.PKID = q.PKIDSituacionRegistro
            WHERE q.PKIDCuentaCorrientePlanillas = ?
            ORDER BY q.NumeroCuota
        """, (ccId,))
        rows = cur.fetchall()
        return [{
            "PKID": r.PKID,
            "PKIDCuentaCorrientePlanillas": r.PKIDCuentaCorrientePlanillas,
            "NumeroCuota": r.NumeroCuota,
            "ano": r.ano,
            "mes": r.mes,
            "PKIDTipoPlanilla": r.PKIDTipoPlanilla,
            "TipoPlanilla": r.TipoPlanilla,
            "Semana": r.Semana,
            "FechaCuotaEstimada": r.FechaCuotaEstimada.isoformat() if r.FechaCuotaEstimada else None,
            "ImporteCuota": float(r.ImporteCuota) if r.ImporteCuota is not None else None,
            "ImporteAplicado": float(r.ImporteAplicado) if r.ImporteAplicado is not None else None,
            "PKIDNomina": r.PKIDNomina,
            "Nomina": r.Nomina,
            "anoaplicacion": r.anoaplicacion,
            "mesaplicacion": r.mesaplicacion,
            "semanaaplicacion": r.semanaaplicacion,
            "SecuenciaAnoMesAplicacion": r.SecuenciaAnoMesAplicacion,
            "TipoPago": r.TipoPago,
            "IndicadorProceso": r.IndicadorProceso,
            "PKIDSituacionRegistro": r.PKIDSituacionRegistro,
            "SituacionRegistro": r.SituacionRegistro,
        } for r in rows]
    except pyodbc.Error as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", dependencies=[Depends(get_current_user)])
def crear(payload: CCPCreate):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT 1 FROM CuentaCorrientePlanillasCuotas
            WHERE PKIDCuentaCorrientePlanillas=? AND NumeroCuota=?
        """, (payload.PKIDCuentaCorrientePlanillas, payload.NumeroCuota))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="La cuota ya existe para la cuenta.")
        cur.execute("""
            INSERT INTO CuentaCorrientePlanillasCuotas (
                PKIDCuentaCorrientePlanillas, NumeroCuota, ano, mes, PKIDTipoPlanilla, Semana,
                FechaCuotaEstimada, ImporteCuota, ImporteAplicado, PKIDNomina,
                anoaplicacion, mesaplicacion, semanaaplicacion, SecuenciaAnoMesAplicacion, TipoPago,
                IndicadorProceso, PKIDSituacionRegistro
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            payload.PKIDCuentaCorrientePlanillas, payload.NumeroCuota, payload.ano, payload.mes, payload.PKIDTipoPlanilla, payload.Semana,
            payload.FechaCuotaEstimada, payload.ImporteCuota, payload.ImporteAplicado, payload.PKIDNomina,
            payload.anoaplicacion, payload.mesaplicacion, payload.semanaaplicacion, payload.SecuenciaAnoMesAplicacion, payload.TipoPago,
            payload.IndicadorProceso, payload.PKIDSituacionRegistro
        ))
        conn.commit()
        new_id = cur.execute("SELECT SCOPE_IDENTITY()").fetchval()
        return {"PKID": int(new_id)}
    except HTTPException:
        raise
    except pyodbc.Error as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{pkid}", dependencies=[Depends(get_current_user)])
def actualizar(pkid: int, payload: CCPEdit):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT 1 FROM CuentaCorrientePlanillasCuotas WHERE PKID=?", (pkid,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Registro no encontrado.")
        cur.execute("""
            SELECT 1 FROM CuentaCorrientePlanillasCuotas
            WHERE PKIDCuentaCorrientePlanillas=? AND NumeroCuota=? AND PKID<>?
        """, (payload.PKIDCuentaCorrientePlanillas, payload.NumeroCuota, pkid))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="Duplicado de cuota para la cuenta.")
        cur.execute("""
            UPDATE CuentaCorrientePlanillasCuotas
            SET PKIDCuentaCorrientePlanillas=?, NumeroCuota=?, ano=?, mes=?, PKIDTipoPlanilla=?, Semana=?,
                FechaCuotaEstimada=?, ImporteCuota=?, ImporteAplicado=?, PKIDNomina=?,
                anoaplicacion=?, mesaplicacion=?, semanaaplicacion=?, SecuenciaAnoMesAplicacion=?, TipoPago=?,
                IndicadorProceso=?, PKIDSituacionRegistro=?
            WHERE PKID=?
        """, (
            payload.PKIDCuentaCorrientePlanillas, payload.NumeroCuota, payload.ano, payload.mes, payload.PKIDTipoPlanilla, payload.Semana,
            payload.FechaCuotaEstimada, payload.ImporteCuota, payload.ImporteAplicado, payload.PKIDNomina,
            payload.anoaplicacion, payload.mesaplicacion, payload.semanaaplicacion, payload.SecuenciaAnoMesAplicacion, payload.TipoPago,
            payload.IndicadorProceso, payload.PKIDSituacionRegistro, pkid
        ))
        conn.commit()
        return {"ok": True}
    except pyodbc.Error as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{pkid}", dependencies=[Depends(get_current_user)])
def eliminar(pkid: int):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("DELETE FROM CuentaCorrientePlanillasCuotas WHERE PKID=?", (pkid,))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Registro no encontrado.")
        conn.commit()
        return {"ok": True}
    except pyodbc.Error as e:
        raise HTTPException(status_code=500, detail=str(e))
