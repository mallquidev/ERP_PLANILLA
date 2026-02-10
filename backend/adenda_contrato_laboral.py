# adenda_contrato_laboral.py
from fastapi import APIRouter, Depends, HTTPException, Path, Query
from pydantic import BaseModel
from typing import Optional
from datetime import date
from database import get_connection
from security import get_current_user

router = APIRouter(prefix="/adenda-contrato-laboral", tags=["Adenda ContratoLaboral"])

class AdendaCreate(BaseModel):
    PKIDContratoLaboral: int
    IDAdendaContratoLaboral: int
    GlosaAdenda: str
    FechaInicioAdenda: date
    FechaFinAdenda: date
    InicioSuspensionPerfecta: Optional[date] = None
    FinSuspensionPerfecta: Optional[date] = None
    PKIDSituacionRegistro: int

class AdendaUpdate(AdendaCreate):
    PKID: int

def rows_to_dicts(cur):
    cols = [c[0] for c in cur.description]
    return [dict(zip(cols, r)) for r in cur.fetchall()]

@router.get("/", dependencies=[Depends(get_current_user)])
def listar(contratoId: int = Query(..., gt=0)):
    conn = get_connection(); cur = conn.cursor()
    try:
        cur.execute("""
            SELECT a.*,
                   s.SituacionRegistro
              FROM AdendaContratoLaboral a
         LEFT JOIN SituacionRegistro s ON s.PKID = a.PKIDSituacionRegistro
             WHERE a.PKIDContratoLaboral = ?
          ORDER BY a.PKID DESC
        """, (contratoId,))
        return rows_to_dicts(cur)
    finally:
        cur.close(); conn.close()

@router.get("/{PKID}", dependencies=[Depends(get_current_user)])
def obtener(PKID: int = Path(..., gt=0)):
    conn = get_connection(); cur = conn.cursor()
    try:
        cur.execute("""
            SELECT a.*,
                   s.SituacionRegistro
              FROM AdendaContratoLaboral a
         LEFT JOIN SituacionRegistro s ON s.PKID = a.PKIDSituacionRegistro
             WHERE a.PKID = ?
        """, (PKID,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Adenda no encontrada")
        cols = [c[0] for c in cur.description]
        return dict(zip(cols, row))
    finally:
        cur.close(); conn.close()

@router.post("/", dependencies=[Depends(get_current_user)])
def crear(body: AdendaCreate):
    conn = get_connection(); cur = conn.cursor()
    try:
        # Unicidad (PKIDContratoLaboral, IDAdendaContratoLaboral)
        cur.execute("""
            SELECT 1 FROM AdendaContratoLaboral
             WHERE PKIDContratoLaboral = ? AND IDAdendaContratoLaboral = ?
        """, (body.PKIDContratoLaboral, body.IDAdendaContratoLaboral))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="Ya existe esa Adenda para el contrato.")

        data = body.dict()
        cols = ", ".join(data.keys())
        placeholders = ", ".join(["?"] * len(data))
        values = tuple(data.values())
        sql = f"INSERT INTO AdendaContratoLaboral ({cols}) OUTPUT inserted.PKID VALUES ({placeholders})"
        cur.execute(sql, values)
        new_id = cur.fetchone()[0]
        conn.commit()
        return {"PKID": new_id}
    finally:
        cur.close(); conn.close()

@router.put("/{PKID}", dependencies=[Depends(get_current_user)])
def actualizar(PKID: int, body: AdendaUpdate):
    if PKID != body.PKID:
        raise HTTPException(status_code=400, detail="PKID no coincide")
    conn = get_connection(); cur = conn.cursor()
    try:
        # Validar unicidad si cambian compuestos
        cur.execute("""
            SELECT 1 FROM AdendaContratoLaboral
             WHERE PKIDContratoLaboral = ? AND IDAdendaContratoLaboral = ? AND PKID <> ?
        """, (body.PKIDContratoLaboral, body.IDAdendaContratoLaboral, PKID))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="Ya existe esa Adenda para el contrato.")

        data = body.dict()
        data.pop("PKID", None)
        set_clause = ", ".join([f"{k}=?" for k in data.keys()])
        values = tuple(data.values()) + (PKID,)
        sql = f"UPDATE AdendaContratoLaboral SET {set_clause} WHERE PKID = ?"
        cur.execute(sql, values)
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Adenda no encontrada")
        conn.commit()
        return {"ok": True}
    finally:
        cur.close(); conn.close()

@router.delete("/{PKID}", dependencies=[Depends(get_current_user)])
def eliminar(PKID: int = Path(..., gt=0)):
    conn = get_connection(); cur = conn.cursor()
    try:
        cur.execute("DELETE FROM AdendaContratoLaboral WHERE PKID = ?", (PKID,))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Adenda no encontrada")
        conn.commit()
        return {"ok": True}
    finally:
        cur.close(); conn.close()
