# backend/cts_calculada_combos.py
from fastapi import APIRouter, Depends, HTTPException, Query
import pyodbc

from database import get_connection
from security import get_current_user

router = APIRouter(prefix="/cts-calculada-combos", tags=["CTSCalculadaCombos"])

@router.get("/periodocts/", dependencies=[Depends(get_current_user)])
def combo_periodocts(empresaId: int = Query(...)):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT PKID, Ano, Mes
            FROM PeriodoCTS
            WHERE PKIDEmpresa = ?
            ORDER BY Ano DESC, Mes DESC
        """, (empresaId,))
        return [{"PKID": r.PKID, "Ano": r.Ano, "Mes": r.Mes} for r in cur.fetchall()]
    except pyodbc.Error as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/trabajador/", dependencies=[Depends(get_current_user)])
def combo_trabajador(empresaId: int = Query(...)):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT PKID, NombreCompleto
            FROM Trabajador
            WHERE PKIDEmpresa = ?
            ORDER BY NombreCompleto
        """, (empresaId,))
        return [{"PKID": r.PKID, "NombreCompleto": r.NombreCompleto} for r in cur.fetchall()]
    except pyodbc.Error as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/banco/", dependencies=[Depends(get_current_user)])
def combo_banco():
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT PKID, Banco FROM Banco ORDER BY Banco")
        return [{"PKID": r.PKID, "Banco": r.Banco} for r in cur.fetchall()]
    except pyodbc.Error as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/moneda/", dependencies=[Depends(get_current_user)])
def combo_moneda():
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT PKID, Moneda FROM Moneda ORDER BY Moneda")
        return [{"PKID": r.PKID, "Moneda": r.Moneda} for r in cur.fetchall()]
    except pyodbc.Error as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/situacion/", dependencies=[Depends(get_current_user)])
def combo_situacion():
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT PKID, SituacionRegistro FROM SituacionRegistro ORDER BY SituacionRegistro")
        return [{"PKID": r.PKID, "SituacionRegistro": r.SituacionRegistro} for r in cur.fetchall()]
    except pyodbc.Error as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/concepto-planilla/", dependencies=[Depends(get_current_user)])
def combo_concepto_planilla():
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT PKID, ConceptoPlanilla FROM ConceptoPlanilla ORDER BY ConceptoPlanilla")
        return [{"PKID": r.PKID, "ConceptoPlanilla": r.ConceptoPlanilla} for r in cur.fetchall()]
    except pyodbc.Error as e:
        raise HTTPException(status_code=500, detail=str(e))
