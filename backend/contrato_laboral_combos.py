# contrato_laboral_combos.py
from fastapi import APIRouter, Depends, Query, HTTPException
from database import get_connection
from security import get_current_user

router = APIRouter(prefix="/contrato-laboral-combos", tags=["Combos ContratoLaboral"])

def rows_to_dicts(cur):
    cols = [c[0] for c in cur.description]
    return [dict(zip(cols, r)) for r in cur.fetchall()]

@router.get("/trabajador/", dependencies=[Depends(get_current_user)])
def combo_trabajador(empresaId: int = Query(..., gt=0)):
    conn = get_connection(); cur = conn.cursor()
    try:
        # Filtra trabajadores por empresa actual
        cur.execute("""
            SELECT PKID, NombreCompleto
              FROM Trabajador
             WHERE PKIDEmpresa = ?
             ORDER BY NombreCompleto
        """, (empresaId,))
        return rows_to_dicts(cur)
    finally:
        cur.close(); conn.close()

@router.get("/cargo-empresa/", dependencies=[Depends(get_current_user)])
def combo_cargo_empresa(empresaId: int = Query(..., gt=0)):
    conn = get_connection(); cur = conn.cursor()
    try:
        # Suponiendo que CargoEmpresa tiene PKIDEmpresa
        cur.execute("""
            SELECT PKID, CargoEmpresa
              FROM CargoEmpresa
             WHERE PKIDEmpresa = ?
             ORDER BY CargoEmpresa
        """, (empresaId,))
        return rows_to_dicts(cur)
    finally:
        cur.close(); conn.close()

@router.get("/modelo-contrato/", dependencies=[Depends(get_current_user)])
def combo_modelo_contrato():
    conn = get_connection(); cur = conn.cursor()
    try:
        cur.execute("""
            SELECT PKID, ModeloContratoLaboral
              FROM ModeloContratoLaboral
             ORDER BY ModeloContratoLaboral
        """)
        return rows_to_dicts(cur)
    finally:
        cur.close(); conn.close()

@router.get("/situacion/", dependencies=[Depends(get_current_user)])
def combo_situacion():
    conn = get_connection(); cur = conn.cursor()
    try:
        cur.execute("""
            SELECT PKID, SituacionRegistro
              FROM SituacionRegistro
             ORDER BY SituacionRegistro
        """)
        return rows_to_dicts(cur)
    finally:
        cur.close(); conn.close()
