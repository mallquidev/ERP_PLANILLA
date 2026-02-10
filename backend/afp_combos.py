from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict
from database import get_connection
from security import get_current_user

router = APIRouter(prefix="/afp-combos", tags=["AFP Combos"])

def rows_to_dicts(cursor, rows):
    cols = [c[0] for c in cursor.description]
    return [dict(zip(cols, r)) for r in rows]

@router.get("/conceptos", response_model=List[Dict])
def combo_conceptos(user: dict = Depends(get_current_user)):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT PKID, ConceptoPlanilla
            FROM ConceptoPlanilla
            ORDER BY ConceptoPlanilla
        """)
        data = rows_to_dicts(cur, cur.fetchall())
        cur.close(); conn.close()
        return data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/situaciones", response_model=List[Dict])
def combo_situaciones(user: dict = Depends(get_current_user)):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT PKID, SituacionRegistro
            FROM SituacionRegistro
            ORDER BY SituacionRegistro
        """)
        data = rows_to_dicts(cur, cur.fetchall())
        cur.close(); conn.close()
        return data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/cuentas", response_model=List[Dict])
def combo_cuentas(user: dict = Depends(get_current_user)):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT PKID, CuentaContable
            FROM CuentaContable
            ORDER BY CuentaContable
        """)
        data = rows_to_dicts(cur, cur.fetchall())
        cur.close(); conn.close()
        return data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
