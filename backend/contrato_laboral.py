# contrato_laboral.py
from fastapi import APIRouter, Depends, HTTPException, Path, Query
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import date
from database import get_connection
from security import get_current_user

router = APIRouter(prefix="/contrato-laboral", tags=["ContratoLaboral"])

class ContratoLaboralCreate(BaseModel):
    IDContratoLaboral: int
    PKIDTrabajador: int
    FechaRegistroContrato: date
    FechaInicioContrato: date
    FechaFinContrato: Optional[date] = None
    PKIDCargoEmpresa: int
    GlosaContrato: str
    PKIDModeloContratoLaboral: int
    PKIDSituacionRegistro: int

class ContratoLaboralUpdate(ContratoLaboralCreate):
    PKID: int

def dicts(cur): 
    cols = [c[0] for c in cur.description]
    return [dict(zip(cols, r)) for r in cur.fetchall()]

@router.get("/", dependencies=[Depends(get_current_user)])
def listar(empresaId: Optional[int] = Query(None, gt=0)):
    """
    Si empresaId viene, filtra por Trabajador.PKIDEmpresa = empresaId
    """
    conn = get_connection(); cur = conn.cursor()
    try:
        if empresaId:
            cur.execute("""
                SELECT c.*, 
                       t.NombreCompleto AS Trabajador,
                       t.PKIDEmpresa,
                       ce.CargoEmpresa,
                       m.ModeloContratoLaboral,
                       s.SituacionRegistro
                  FROM ContratoLaboral c
            INNER JOIN Trabajador t ON t.PKID = c.PKIDTrabajador
             LEFT JOIN CargoEmpresa ce ON ce.PKID = c.PKIDCargoEmpresa
             LEFT JOIN ModeloContratoLaboral m ON m.PKID = c.PKIDModeloContratoLaboral
             LEFT JOIN SituacionRegistro s ON s.PKID = c.PKIDSituacionRegistro
                 WHERE t.PKIDEmpresa = ?
              ORDER BY c.PKID DESC
            """, (empresaId,))
        else:
            cur.execute("""
                SELECT c.*, 
                       t.NombreCompleto AS Trabajador,
                       t.PKIDEmpresa,
                       ce.CargoEmpresa,
                       m.ModeloContratoLaboral,
                       s.SituacionRegistro
                  FROM ContratoLaboral c
            INNER JOIN Trabajador t ON t.PKID = c.PKIDTrabajador
             LEFT JOIN CargoEmpresa ce ON ce.PKID = c.PKIDCargoEmpresa
             LEFT JOIN ModeloContratoLaboral m ON m.PKID = c.PKIDModeloContratoLaboral
             LEFT JOIN SituacionRegistro s ON s.PKID = c.PKIDSituacionRegistro
              ORDER BY c.PKID DESC
            """)
        return dicts(cur)
    finally:
        cur.close(); conn.close()

@router.get("/{PKID}", dependencies=[Depends(get_current_user)])
def obtener(PKID: int = Path(..., gt=0)):
    conn = get_connection(); cur = conn.cursor()
    try:
        cur.execute("""
            SELECT c.*, 
                   t.NombreCompleto AS Trabajador,
                   t.PKIDEmpresa,
                   ce.CargoEmpresa,
                   m.ModeloContratoLaboral,
                   s.SituacionRegistro
              FROM ContratoLaboral c
        INNER JOIN Trabajador t ON t.PKID = c.PKIDTrabajador
         LEFT JOIN CargoEmpresa ce ON ce.PKID = c.PKIDCargoEmpresa
         LEFT JOIN ModeloContratoLaboral m ON m.PKID = c.PKIDModeloContratoLaboral
         LEFT JOIN SituacionRegistro s ON s.PKID = c.PKIDSituacionRegistro
             WHERE c.PKID = ?
        """, (PKID,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Contrato no encontrado")
        cols = [c[0] for c in cur.description]
        return dict(zip(cols, row))
    finally:
        cur.close(); conn.close()

@router.post("/", dependencies=[Depends(get_current_user)])
def crear(body: ContratoLaboralCreate):
    conn = get_connection(); cur = conn.cursor()
    try:
        data = body.dict()
        cols = ", ".join(data.keys())
        placeholders = ", ".join(["?"] * len(data))
        values = tuple(data.values())
        sql = f"INSERT INTO ContratoLaboral ({cols}) OUTPUT inserted.PKID VALUES ({placeholders})"
        cur.execute(sql, values)
        new_id = cur.fetchone()[0]
        conn.commit()
        return {"PKID": new_id}
    finally:
        cur.close(); conn.close()

@router.put("/{PKID}", dependencies=[Depends(get_current_user)])
def actualizar(PKID: int, body: ContratoLaboralUpdate):
    if PKID != body.PKID:
        raise HTTPException(status_code=400, detail="PKID no coincide")
    conn = get_connection(); cur = conn.cursor()
    try:
        data = body.dict()
        data.pop("PKID", None)
        set_clause = ", ".join([f"{k}=?" for k in data.keys()])
        values = tuple(data.values()) + (PKID,)
        sql = f"UPDATE ContratoLaboral SET {set_clause} WHERE PKID = ?"
        cur.execute(sql, values)
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Contrato no encontrado")
        conn.commit()
        return {"ok": True}
    finally:
        cur.close(); conn.close()

@router.delete("/{PKID}", dependencies=[Depends(get_current_user)])
def eliminar(PKID: int = Path(..., gt=0)):
    conn = get_connection(); cur = conn.cursor()
    try:
        cur.execute("DELETE FROM ContratoLaboral WHERE PKID = ?", (PKID,))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Contrato no encontrado")
        conn.commit()
        return {"ok": True}
    finally:
        cur.close(); conn.close()
