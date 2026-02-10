# backend/cuenta_corriente_planillas_combos.py
from fastapi import APIRouter, Depends, HTTPException, Query
import pyodbc

from database import get_connection
from security import get_current_user

router = APIRouter(prefix="/ccp-combos", tags=["CuentaCorrientePlanillas-Combos"])

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

@router.get("/cuenta-contable/", dependencies=[Depends(get_current_user)])
def combo_cuenta_contable():
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT PKID, CuentaContable FROM CuentaContable ORDER BY CuentaContable")
        return [{"PKID": r.PKID, "CuentaContable": r.CuentaContable} for r in cur.fetchall()]
    except pyodbc.Error as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/tipo-comprobante/", dependencies=[Depends(get_current_user)])
def combo_tipo_comprobante():
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT PKID, TipoComprobante FROM TipoComprobante ORDER BY TipoComprobante")
        return [{"PKID": r.PKID, "TipoComprobante": r.TipoComprobante} for r in cur.fetchall()]
    except pyodbc.Error as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/tipo-planilla/", dependencies=[Depends(get_current_user)])
def combo_tipo_planilla():
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT PKID, TipoPlanilla FROM TipoPlanilla ORDER BY TipoPlanilla")
        return [{"PKID": r.PKID, "TipoPlanilla": r.TipoPlanilla} for r in cur.fetchall()]
    except pyodbc.Error as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/nomina/", dependencies=[Depends(get_current_user)])
def combo_nomina():
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT PKID, Nomina FROM Nomina ORDER BY Nomina")
        return [{"PKID": r.PKID, "Nomina": r.Nomina} for r in cur.fetchall()]
    except pyodbc.Error as e:
        raise HTTPException(status_code=500, detail=str(e))
