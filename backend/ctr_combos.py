#backend/ctr_combos.py
from fastapi import APIRouter, Depends
from database import get_connection
from security import get_current_user

router = APIRouter(prefix="/ctr-combos", tags=["Combos CTR"])

@router.get("/empresas", dependencies=[Depends(get_current_user)])
def combo_empresas():
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT PKID, IDEmpresa, RazonSocial FROM Empresa ORDER BY RazonSocial")
        cols = [c[0] for c in cur.description]
        return [dict(zip(cols, r)) for r in cur.fetchall()]
    finally:
        cur.close()
        conn.close()

@router.get("/nominas", dependencies=[Depends(get_current_user)])
def combo_nominas():
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT PKID, IDNomina, Nomina FROM Nomina ORDER BY Nomina")
        cols = [c[0] for c in cur.description]
        return [dict(zip(cols, r)) for r in cur.fetchall()]
    finally:
        cur.close()
        conn.close()

@router.get("/categorias", dependencies=[Depends(get_current_user)])
def combo_categorias():
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT PKID, IDCategoriaTrabajador, CategoriaTrabajador FROM CategoriaTrabajador ORDER BY CategoriaTrabajador")
        cols = [c[0] for c in cur.description]
        return [dict(zip(cols, r)) for r in cur.fetchall()]
    finally:
        cur.close()
        conn.close()

@router.get("/situaciones", dependencies=[Depends(get_current_user)])
def combo_situaciones():
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT PKID, IDSituacionRegistro, SituacionRegistro FROM SituacionRegistro ORDER BY SituacionRegistro")
        cols = [c[0] for c in cur.description]
        return [dict(zip(cols, r)) for r in cur.fetchall()]
    finally:
        cur.close()
        conn.close()
