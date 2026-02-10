# archivo: empresa_combos.py
from fastapi import APIRouter, Depends, HTTPException, Query
import pyodbc

from database import get_connection
from security import get_current_user

router = APIRouter(prefix="/empresa-combos", tags=["Empresa-Combos"], dependencies=[Depends(get_current_user)])

@router.get("/regimen/")
def combo_regimen():
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT PKID, RegimenTributario FROM RegimenTributario ORDER BY RegimenTributario")
        return [{"PKID": r.PKID, "RegimenTributario": r.RegimenTributario} for r in cur.fetchall()]
    except pyodbc.Error as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sector/")
def combo_sector():
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT PKID, SectorEconomico FROM SectorEconomico ORDER BY SectorEconomico")
        return [{"PKID": r.PKID, "SectorEconomico": r.SectorEconomico} for r in cur.fetchall()]
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

@router.get("/otra-empresa/")
def combo_otra_empresa(exclude_id: int | None = Query(default=None)):
    """
    Devuelve empresas para 'PKIDOtraEmpresa'. Si exclude_id viene,
    no incluye esa misma empresa (para evitar seleccionarse a sí misma en edición).
    """
    try:
        conn = get_connection()
        cur = conn.cursor()
        if exclude_id:
            cur.execute("""
                SELECT PKID, RazonSocial
                  FROM Empresa
                 WHERE PKID <> ?
                 ORDER BY RazonSocial
            """, (exclude_id,))
        else:
            cur.execute("SELECT PKID, RazonSocial FROM Empresa ORDER BY RazonSocial")
        return [{"PKID": r.PKID, "RazonSocial": r.RazonSocial} for r in cur.fetchall()]
    except pyodbc.Error as e:
        raise HTTPException(status_code=500, detail=str(e))
