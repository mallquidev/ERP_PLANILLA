#D:\payroll_project_3\backend\centro_costo.py
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, List
import pyodbc

from database import get_connection
from security import get_current_user

router = APIRouter(prefix="/centro-costo", tags=["CentroCosto"])

# ---------- Modelos ----------
class CentroCostoCreate(BaseModel):
    PKIDEmpresa: int
    IDCentroCosto: int
    CentroCosto: str
    PKIDSituacionRegistro: int

class CentroCostoUpdate(BaseModel):
    PKID: int = Field(..., gt=0)
    IDCentroCosto: int
    CentroCosto: str
    PKIDSituacionRegistro: int

# ---------- Listar (con filtro por empresa opcional) ----------
@router.get("/", dependencies=[Depends(get_current_user)])
def listar_centros(PKIDEmpresa: Optional[int] = Query(None)):
    conn = get_connection()
    cur = conn.cursor()
    try:
        base_sql = """
        SELECT
            c.PKID,
            c.PKIDEmpresa,
            e.RazonSocial AS Empresa,
            c.IDCentroCosto,
            c.CentroCosto,
            c.PKIDSituacionRegistro,
            s.SituacionRegistro
        FROM CentroCosto c
        INNER JOIN Empresa e ON e.PKID = c.PKIDEmpresa
        INNER JOIN SituacionRegistro s ON s.PKID = c.PKIDSituacionRegistro
        """
        params = []
        if PKIDEmpresa:
            base_sql += " WHERE c.PKIDEmpresa = ?"
            params.append(PKIDEmpresa)
        base_sql += " ORDER BY e.RazonSocial, c.IDCentroCosto"
        cur.execute(base_sql, params)
        cols = [c[0] for c in cur.description]
        rows = [dict(zip(cols, r)) for r in cur.fetchall()]
        return rows
    finally:
        cur.close()
        conn.close()

# ---------- Crear ----------
@router.post("/", dependencies=[Depends(get_current_user)])
def crear_centro(body: CentroCostoCreate):
    conn = get_connection()
    cur = conn.cursor()
    try:
        # Validación de unicidad (PKIDEmpresa + IDCentroCosto)
        cur.execute("""
            SELECT 1 FROM CentroCosto WHERE PKIDEmpresa = ? AND IDCentroCosto = ?
        """, (body.PKIDEmpresa, body.IDCentroCosto))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="Ya existe un centro de costo con ese ID para la empresa.")

        insert_sql = """
        INSERT INTO CentroCosto
            (PKIDEmpresa, IDCentroCosto, CentroCosto, PKIDSituacionRegistro)
        OUTPUT inserted.PKID
        VALUES (?, ?, ?, ?)
        """
        params = (body.PKIDEmpresa, body.IDCentroCosto, body.CentroCosto, body.PKIDSituacionRegistro)
        cur.execute(insert_sql, params)
        new_id = cur.fetchone()[0]
        conn.commit()
        return {"PKID": new_id}
    except pyodbc.Error as ex:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(ex))
    finally:
        cur.close()
        conn.close()

# ---------- Actualizar ----------
@router.put("/{PKID}", dependencies=[Depends(get_current_user)])
def actualizar_centro(PKID: int, body: CentroCostoUpdate):
    if PKID != body.PKID:
        raise HTTPException(status_code=400, detail="PKID inconsistente.")

    conn = get_connection()
    cur = conn.cursor()
    try:
        # No cambiamos PKIDEmpresa (consistencia con contexto). Se puede permitir si lo necesitas.
        update_sql = """
        UPDATE CentroCosto
        SET IDCentroCosto = ?,
            CentroCosto = ?,
            PKIDSituacionRegistro = ?
        WHERE PKID = ?
        """
        params = (body.IDCentroCosto, body.CentroCosto, body.PKIDSituacionRegistro, body.PKID)
        cur.execute(update_sql, params)
        if cur.rowcount == 0:
            conn.rollback()
            raise HTTPException(status_code=404, detail="Centro de costo no encontrado.")
        conn.commit()
        return {"ok": True}
    except pyodbc.Error as ex:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(ex))
    finally:
        cur.close()
        conn.close()

# ---------- Eliminar ----------
@router.delete("/{PKID}", dependencies=[Depends(get_current_user)])
def eliminar_centro(PKID: int):
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM CentroCosto WHERE PKID = ?", (PKID,))
        if cur.rowcount == 0:
            conn.rollback()
            raise HTTPException(status_code=404, detail="Centro de costo no encontrado.")
        conn.commit()
        return {"ok": True}
    except pyodbc.Error as ex:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(ex))
    finally:
        cur.close()
        conn.close()
