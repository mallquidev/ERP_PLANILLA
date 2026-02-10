from fastapi import APIRouter, Depends
from database import get_connection
from security import get_current_user

router = APIRouter(prefix="/area-combos", tags=["area-combos"])

@router.get("/situacion")
def combo_situacion(user: dict = Depends(get_current_user)):
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT PKID, SituacionRegistro FROM dbo.SituacionRegistro ORDER BY IDSituacionRegistro")
        rows = cur.fetchall()
        return [{"PKID": r[0], "SituacionRegistro": r[1]} for r in rows]
    finally:
        cur.close()
        conn.close()
