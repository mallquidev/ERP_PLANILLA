# configura_planilla_combos.py
from fastapi import APIRouter, Depends
from database import get_connection
from security import get_current_user

router = APIRouter(prefix="/configura-planilla-combos", tags=["Combos ConfiguraPlanilla"])

@router.get("/empresa/", dependencies=[Depends(get_current_user)])
def combo_empresa():
    conn = get_connection()
    cur = conn.cursor()
    try:
        # OJO: la columna visible es RazonSocial
        cur.execute("""
            SELECT PKID, RazonSocial AS Empresa
            FROM Empresa
            ORDER BY RazonSocial
        """)
        cols = [c[0] for c in cur.description]
        return [dict(zip(cols, r)) for r in cur.fetchall()]
    finally:
        cur.close()
        conn.close()

@router.get("/nomina/", dependencies=[Depends(get_current_user)])
def combo_nomina():
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT PKID, Nomina
            FROM Nomina
            ORDER BY Nomina
        """)
        cols = [c[0] for c in cur.description]
        return [dict(zip(cols, r)) for r in cur.fetchall()]
    finally:
        cur.close()
        conn.close()

@router.get("/situacion/", dependencies=[Depends(get_current_user)])
def combo_situacion():
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT PKID, SituacionRegistro
            FROM SituacionRegistro
            ORDER BY SituacionRegistro
        """)
        cols = [c[0] for c in cur.description]
        return [dict(zip(cols, r)) for r in cur.fetchall()]
    finally:
        cur.close()
        conn.close()
