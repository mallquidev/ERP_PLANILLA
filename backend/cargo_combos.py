#backend/cargo_combos.py
from fastapi import APIRouter, Depends
from database import get_connection
from security import get_current_user

router = APIRouter(prefix="/cargo-combos", tags=["cargo-combos"])

@router.get("/situaciones")
def combo_situaciones(user: dict = Depends(get_current_user)):
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT PKID, SituacionRegistro FROM dbo.SituacionRegistro ORDER BY PKID")
        rows = cur.fetchall()
        return [{"PKID": r[0], "SituacionRegistro": r[1]} for r in rows]
    finally:
        cur.close()
        conn.close()
