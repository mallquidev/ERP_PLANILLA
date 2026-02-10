# backend/control_vacacional_combos.py
from fastapi import APIRouter, Depends, HTTPException, Query
import pyodbc

from database import get_connection
from security import get_current_user

router = APIRouter(prefix="/control-vacacional-combos", tags=["ControlVacacionalCombos"])

@router.get("/trabajador/", dependencies=[Depends(get_current_user)])
def combo_trabajador(empresaId: int = Query(..., description="Filtrar por empresa")):
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

@router.get("/situacion/", dependencies=[Depends(get_current_user)])
def combo_situacion():
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT PKID, SituacionRegistro FROM SituacionRegistro ORDER BY SituacionRegistro")
        return [{"PKID": r.PKID, "SituacionRegistro": r.SituacionRegistro} for r in cur.fetchall()]
    except pyodbc.Error as e:
        raise HTTPException(status_code=500, detail=str(e))
