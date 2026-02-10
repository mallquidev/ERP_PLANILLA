# condicion_trabajador.py
from fastapi import APIRouter, Depends, HTTPException, Path
from pydantic import BaseModel
from typing import Optional
import pyodbc

from database import get_connection
from security import get_current_user

router = APIRouter(prefix="/condicion-trabajador", tags=["CondicionTrabajador"])

# ------------ Modelos ------------
class CondicionTrabajadorCreate(BaseModel):
    IDCondicionTrabajador: int
    CondicionTrabajador: str
    PKIDSituacionRegistro: int
    LetraCondicionTrabajador: str

class CondicionTrabajadorUpdate(CondicionTrabajadorCreate):
    PKID: int

# ------------ Listar ------------
@router.get("/", dependencies=[Depends(get_current_user)])
def listar_condiciones_trabajador():
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT 
                ct.PKID,
                ct.IDCondicionTrabajador,
                ct.CondicionTrabajador,
                ct.PKIDSituacionRegistro,
                ct.LetraCondicionTrabajador,
                sr.SituacionRegistro
            FROM CondicionTrabajador ct
            INNER JOIN SituacionRegistro sr ON sr.PKID = ct.PKIDSituacionRegistro
            ORDER BY ct.IDCondicionTrabajador
        """)
        cols = [c[0] for c in cur.description]
        rows = [dict(zip(cols, r)) for r in cur.fetchall()]
        return rows
    finally:
        cur.close()
        conn.close()

# ------------ Crear ------------
@router.post("/", dependencies=[Depends(get_current_user)])
def crear_condicion_trabajador(body: CondicionTrabajadorCreate):
    conn = get_connection()
    cur = conn.cursor()
    try:
        # Validar unicidad por IDCondicionTrabajador
        cur.execute("SELECT 1 FROM CondicionTrabajador WHERE IDCondicionTrabajador = ?", (body.IDCondicionTrabajador,))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="Ya existe una condición de trabajador con ese ID.")
        
        # Validar que la situación de registro existe
        cur.execute("SELECT 1 FROM SituacionRegistro WHERE PKID = ?", (body.PKIDSituacionRegistro,))
        if not cur.fetchone():
            raise HTTPException(status_code=400, detail="La situación de registro especificada no existe.")

        insert_sql = """
        INSERT INTO CondicionTrabajador (
            IDCondicionTrabajador, CondicionTrabajador, PKIDSituacionRegistro, LetraCondicionTrabajador
        ) OUTPUT inserted.PKID
        VALUES (?, ?, ?, ?)
        """
        params = (
            body.IDCondicionTrabajador, 
            body.CondicionTrabajador, 
            body.PKIDSituacionRegistro,
            body.LetraCondicionTrabajador
        )
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

# ------------ Actualizar ------------
@router.put("/{PKID}", dependencies=[Depends(get_current_user)])
def actualizar_condicion_trabajador(PKID: int, body: CondicionTrabajadorUpdate):
    if PKID != body.PKID:
        raise HTTPException(status_code=400, detail="PKID inconsistente.")

    conn = get_connection()
    cur = conn.cursor()
    try:
        # Validar que la situación de registro existe
        cur.execute("SELECT 1 FROM SituacionRegistro WHERE PKID = ?", (body.PKIDSituacionRegistro,))
        if not cur.fetchone():
            raise HTTPException(status_code=400, detail="La situación de registro especificada no existe.")

        update_sql = """
        UPDATE CondicionTrabajador SET
            IDCondicionTrabajador = ?,
            CondicionTrabajador = ?,
            PKIDSituacionRegistro = ?,
            LetraCondicionTrabajador = ?
        WHERE PKID = ?
        """
        params = (
            body.IDCondicionTrabajador, 
            body.CondicionTrabajador, 
            body.PKIDSituacionRegistro,
            body.LetraCondicionTrabajador,
            body.PKID
        )
        cur.execute(update_sql, params)
        if cur.rowcount == 0:
            conn.rollback()
            raise HTTPException(status_code=404, detail="Condición de trabajador no encontrada.")
        conn.commit()
        return {"ok": True}
    except pyodbc.Error as ex:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(ex))
    finally:
        cur.close()
        conn.close()

# ------------ Eliminar ------------
@router.delete("/{PKID}", dependencies=[Depends(get_current_user)])
def eliminar_condicion_trabajador(PKID: int = Path(..., gt=0)):
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM CondicionTrabajador WHERE PKID = ?", (PKID,))
        if cur.rowcount == 0:
            conn.rollback()
            raise HTTPException(status_code=404, detail="Condición de trabajador no encontrada.")
        conn.commit()
        return {"ok": True}
    except pyodbc.Error as ex:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(ex))
    finally:
        cur.close()
        conn.close()