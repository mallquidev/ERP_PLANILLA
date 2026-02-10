#concepto_planilla_combos.py
from fastapi import APIRouter, Depends
from database import get_connection
from security import get_current_user

router = APIRouter(prefix="/concepto-planilla-combos", tags=["Combos ConceptoPlanilla"])

@router.get("/plame", dependencies=[Depends(get_current_user)])
def combo_plame_concepto():
    conn = get_connection()
    cur = conn.cursor()
    try:
        # Ajusta la selección a los nombres reales de columnas en PlameConcepto
        cur.execute("""
            SELECT PKID, PlameConcepto
            FROM PlameConcepto
            ORDER BY PlameConcepto
        """)
        cols = [c[0] for c in cur.description]
        return [dict(zip(cols, r)) for r in cur.fetchall()]
    finally:
        cur.close()
        conn.close()

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
