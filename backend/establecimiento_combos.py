# archivo: establecimiento_combos.py
from fastapi import APIRouter, Depends, HTTPException
import pyodbc

from database import get_connection
from security import get_current_user

router = APIRouter(
    prefix="/establecimiento-combos",
    tags=["Establecimiento-Combos"],
    dependencies=[Depends(get_current_user)],
)

@router.get("/empresa/")
def combo_empresa():
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT PKID, RazonSocial FROM Empresa ORDER BY RazonSocial")
        return [{"PKID": r.PKID, "RazonSocial": r.RazonSocial} for r in cur.fetchall()]
    except pyodbc.Error as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/tipo-establecimiento/")
def combo_tipo_establecimiento():
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT PKID, TipoEstablecimiento FROM TipoEstablecimiento ORDER BY TipoEstablecimiento")
        return [{"PKID": r.PKID, "TipoEstablecimiento": r.TipoEstablecimiento} for r in cur.fetchall()]
    except pyodbc.Error as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/situacion/")
def combo_situacion():
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT PKID, SituacionRegistro FROM SituacionRegistro ORDER BY SituacionRegistro")
        return [{"PKID": r.PKID, "SituacionRegistro": r.SituacionRegistro} for r in cur.fetchall()]
    except pyodbc.Error as e:
        raise HTTPException(status_code=500, detail=str(e))
