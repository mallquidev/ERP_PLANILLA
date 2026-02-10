# archivo: deduccion_periodo_combos.py
from fastapi import APIRouter, Depends, HTTPException, Query
import pyodbc

from database import get_connection
from security import get_current_user

router = APIRouter(prefix="/deduccion-periodo-combos", tags=["DeduccionPeriodo-Combos"])

@router.get("/concepto/", dependencies=[Depends(get_current_user)])
def combo_concepto():
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT PKID, ConceptoPlanilla
            FROM ConceptoPlanilla
            ORDER BY ConceptoPlanilla
        """)
        return [{"PKID": r.PKID, "ConceptoPlanilla": r.ConceptoPlanilla} for r in cur.fetchall()]
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

@router.get("/hora/", dependencies=[Depends(get_current_user)])
def combo_hora():
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT PKID, HoraPlanilla FROM HoraPlanilla ORDER BY HoraPlanilla")
        return [{"PKID": r.PKID, "HoraPlanilla": r.HoraPlanilla} for r in cur.fetchall()]
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

# ------- Hijo 1: Familia -------
@router.get("/familia/", dependencies=[Depends(get_current_user)])
def combo_familia():
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT PKID, Familia FROM Familia ORDER BY Familia")
        return [{"PKID": r.PKID, "Familia": r.Familia} for r in cur.fetchall()]
    except pyodbc.Error as e:
        raise HTTPException(status_code=500, detail=str(e))

# ------- Hijo 2: Nómina & Cuentas -------
@router.get("/nomina/", dependencies=[Depends(get_current_user)])
def combo_nomina():
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT PKID, Nomina
            FROM Nomina
            ORDER BY Nomina
        """)
        return [{"PKID": r.PKID, "Nomina": r.Nomina} for r in cur.fetchall()]
    except pyodbc.Error as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/cuenta-contable/", dependencies=[Depends(get_current_user)])
def combo_cuenta_contable(empresaId: int = Query(...)):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT PKID, IDCuentaContable, CuentaContable
            FROM CuentaContable
            WHERE PKIDEmpresa = ?
            ORDER BY CuentaContable
        """, (empresaId,))
        return [
            {"PKID": r.PKID, "IDCuentaContable": r.IDCuentaContable, "CuentaContable": r.CuentaContable}
            for r in cur.fetchall()
        ]
    except pyodbc.Error as e:
        raise HTTPException(status_code=500, detail=str(e))
