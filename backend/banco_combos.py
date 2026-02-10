# banco_combos.py
from fastapi import APIRouter, Depends
from database import get_connection
from security import get_current_user

router = APIRouter(prefix="/banco-combos", tags=["banco-combos"])

@router.get("/monedas")
def combo_monedas(user: dict = Depends(get_current_user)):
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT PKID, Moneda FROM dbo.Moneda ORDER BY PKID")
        rows = cur.fetchall()
        return [{"PKID": r[0], "Moneda": r[1]} for r in rows]
    finally:
        cur.close()
        conn.close()

@router.get("/tipos-cuenta")
def combo_tipos_cuenta(user: dict = Depends(get_current_user)):
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT PKID, TipoCuentaBanco FROM dbo.TipoCuentaBanco ORDER BY PKID")
        rows = cur.fetchall()
        return [{"PKID": r[0], "TipoCuentaBanco": r[1]} for r in rows]
    finally:
        cur.close()
        conn.close()

@router.get("/situaciones")
def combo_situaciones(user: dict = Depends(get_current_user)):
    """Combito PROPIO para SituacionRegistro (PKID + SituacionRegistro)."""
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT PKID, SituacionRegistro
            FROM dbo.SituacionRegistro
            ORDER BY PKID
        """)
        rows = cur.fetchall()
        return [{"PKID": r[0], "SituacionRegistro": r[1]} for r in rows]
    finally:
        cur.close()
        conn.close()
