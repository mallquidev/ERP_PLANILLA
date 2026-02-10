#backend/categoria_trabajador_combos.py
from fastapi import APIRouter, Depends
from typing import List, Dict, Any
from database import get_connection
from security import get_current_user

router = APIRouter(prefix="/categoria-trabajador-combos", tags=["categoria-trabajador-combos"])

@router.get("/situaciones", response_model=List[Dict[str, Any]])
def situaciones(user: dict = Depends(get_current_user)):
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT PKID, IDSituacionRegistro, SituacionRegistro FROM dbo.SituacionRegistro ORDER BY IDSituacionRegistro")
        rows = cur.fetchall() or []
        cols = [d[0] for d in cur.description]
        return [dict(zip(cols, r)) for r in rows]
    finally:
        cur.close()
        conn.close()
