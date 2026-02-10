# condicion_trabajador_combos.py
from fastapi import APIRouter, Depends
from database import get_connection
from security import get_current_user

router = APIRouter(prefix="/condicion-trabajador-combos", tags=["Combos CondicionTrabajador"])

@router.get("/situacion", dependencies=[Depends(get_current_user)])
def combo_situacion():
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT PKID, IDSituacionRegistro, SituacionRegistro
            FROM SituacionRegistro
            ORDER BY SituacionRegistro
        """)
        cols = [c[0] for c in cur.description]
        return [dict(zip(cols, r)) for r in cur.fetchall()]
    finally:
        cur.close()
        conn.close()