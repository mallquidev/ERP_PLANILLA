#configura_remuneracion_variable_combos.py
from fastapi import APIRouter, Depends
from database import get_connection
from security import get_current_user

router = APIRouter(prefix="/configura-remuneracion-variable-combos", tags=["Combos ConfiguraRemuneracionVariable"])

@router.get("/empresa", dependencies=[Depends(get_current_user)])
def combo_empresa():
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT PKID, RazonSocial as Empresa FROM Empresa ORDER BY Empresa")
        cols = [c[0] for c in cur.description]
        return [dict(zip(cols, r)) for r in cur.fetchall()]
    finally:
        cur.close()
        conn.close()

@router.get("/tipoproceso", dependencies=[Depends(get_current_user)])
def combo_tipoproceso():
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT PKID, TipoProceso FROM TipoProceso ORDER BY TipoProceso")
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
        cur.execute("SELECT PKID, SituacionRegistro FROM SituacionRegistro ORDER BY SituacionRegistro")
        cols = [c[0] for c in cur.description]
        return [dict(zip(cols, r)) for r in cur.fetchall()]
    finally:
        cur.close()
        conn.close()
