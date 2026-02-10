# archivo: estado_civil_combos.py
from fastapi import APIRouter, Depends, HTTPException
import pyodbc

from database import get_connection
from security import get_current_user

router = APIRouter(
    prefix="/estado-civil-combos",
    tags=["EstadoCivil-Combos"],
    dependencies=[Depends(get_current_user)],
)

@router.get("/situacion/")
def combo_situacion():
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT PKID, SituacionRegistro FROM SituacionRegistro ORDER BY SituacionRegistro")
        return [{"PKID": r.PKID, "SituacionRegistro": r.SituacionRegistro} for r in cur.fetchall()]
    except pyodbc.Error as e:
        raise HTTPException(status_code=500, detail=str(e))
