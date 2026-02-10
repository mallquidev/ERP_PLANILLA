#backend/categoria_trabajador_reintegro.py
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
import pyodbc
from typing import Optional, List
from database import get_connection
from security import get_current_user

router = APIRouter(prefix="/ctr", tags=["CategoriaTrabajadorReintegro"])

# ---------- Modelos ----------
class CTRCreate(BaseModel):
    PKIDEmpresa: int
    Ano: int
    Mes: int
    PKIDNomina: int
    PKIDCategoriaTrabajador: int
    ImporteReintegro1: Optional[float] = 0
    ImporteReintegro2: Optional[float] = 0
    ImporteReintegro3: Optional[float] = 0
    ImporteReintegro4: Optional[float] = 0
    ImporteReintegro5: Optional[float] = 0
    ImporteReintegro6: Optional[float] = 0
    PKIDSituacionRegistro: int

class CTRUpdate(BaseModel):
    PKID: int = Field(..., gt=0)
    PKIDCategoriaTrabajador: int
    ImporteReintegro1: Optional[float] = 0
    ImporteReintegro2: Optional[float] = 0
    ImporteReintegro3: Optional[float] = 0
    ImporteReintegro4: Optional[float] = 0
    ImporteReintegro5: Optional[float] = 0
    ImporteReintegro6: Optional[float] = 0
    PKIDSituacionRegistro: int

# ---------- Listar con filtros de contexto ----------
@router.get("/", dependencies=[Depends(get_current_user)])
def listar_ctr(
    PKIDEmpresa: int = Query(...),
    Ano: int = Query(...),
    Mes: int = Query(...),
    PKIDNomina: int = Query(...),
):
    conn = get_connection()
    cur = conn.cursor()
    try:
        sql = """
        SELECT
            a.PKID,
            a.PKIDEmpresa,
            a.Ano,
            a.Mes,
            a.PKIDNomina,
            a.PKIDCategoriaTrabajador,
            b.CategoriaTrabajador,
            a.ImporteReintegro1,
            a.ImporteReintegro2,
            a.ImporteReintegro3,
            a.ImporteReintegro4,
            a.ImporteReintegro5,
            a.ImporteReintegro6,
            a.PKIDSituacionRegistro,
            s.SituacionRegistro
        FROM CategoriaTrabajadorReintegro a
        INNER JOIN CategoriaTrabajador b ON b.PKID = a.PKIDCategoriaTrabajador
        INNER JOIN SituacionRegistro s ON s.PKID = a.PKIDSituacionRegistro
        WHERE a.PKIDEmpresa = ? AND a.Ano = ? AND a.Mes = ? AND a.PKIDNomina = ?
        ORDER BY b.CategoriaTrabajador
        """
        cur.execute(sql, (PKIDEmpresa, Ano, Mes, PKIDNomina))
        cols = [c[0] for c in cur.description]
        rows = [dict(zip(cols, r)) for r in cur.fetchall()]
        return rows
    finally:
        cur.close()
        conn.close()

# ---------- Crear ----------
@router.post("/", dependencies=[Depends(get_current_user)])
def crear_ctr(body: CTRCreate):
    conn = get_connection()
    cur = conn.cursor()
    try:
        # Validar unicidad lógica? (opcional)
        insert_sql = """
        INSERT INTO CategoriaTrabajadorReintegro
        (PKIDEmpresa, Ano, Mes, PKIDNomina, PKIDCategoriaTrabajador,
         ImporteReintegro1, ImporteReintegro2, ImporteReintegro3,
         ImporteReintegro4, ImporteReintegro5, ImporteReintegro6,
         PKIDSituacionRegistro)
        OUTPUT inserted.PKID
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        params = (
            body.PKIDEmpresa, body.Ano, body.Mes, body.PKIDNomina, body.PKIDCategoriaTrabajador,
            body.ImporteReintegro1 or 0, body.ImporteReintegro2 or 0, body.ImporteReintegro3 or 0,
            body.ImporteReintegro4 or 0, body.ImporteReintegro5 or 0, body.ImporteReintegro6 or 0,
            body.PKIDSituacionRegistro
        )
        cur.execute(insert_sql, params)
        new_id_row = cur.fetchone()
        conn.commit()
        return {"PKID": new_id_row[0]}
    except pyodbc.Error as ex:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(ex))
    finally:
        cur.close()
        conn.close()

# ---------- Actualizar (sin cambiar empresa/año/mes/nomina) ----------
@router.put("/{PKID}", dependencies=[Depends(get_current_user)])
def actualizar_ctr(PKID: int, body: CTRUpdate):
    if PKID != body.PKID:
        raise HTTPException(status_code=400, detail="PKID inconsistente.")
    conn = get_connection()
    cur = conn.cursor()
    try:
        update_sql = """
        UPDATE CategoriaTrabajadorReintegro
        SET PKIDCategoriaTrabajador = ?,
            ImporteReintegro1 = ?,
            ImporteReintegro2 = ?,
            ImporteReintegro3 = ?,
            ImporteReintegro4 = ?,
            ImporteReintegro5 = ?,
            ImporteReintegro6 = ?,
            PKIDSituacionRegistro = ?
        WHERE PKID = ?
        """
        params = (
            body.PKIDCategoriaTrabajador,
            body.ImporteReintegro1 or 0,
            body.ImporteReintegro2 or 0,
            body.ImporteReintegro3 or 0,
            body.ImporteReintegro4 or 0,
            body.ImporteReintegro5 or 0,
            body.ImporteReintegro6 or 0,
            body.PKIDSituacionRegistro,
            PKID
        )
        cur.execute(update_sql, params)
        if cur.rowcount == 0:
            conn.rollback()
            raise HTTPException(status_code=404, detail="Registro no encontrado.")
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
def eliminar_ctr(PKID: int):
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM CategoriaTrabajadorReintegro WHERE PKID = ?", (PKID,))
        if cur.rowcount == 0:
            conn.rollback()
            raise HTTPException(status_code=404, detail="Registro no encontrado.")
        conn.commit()
        return {"ok": True}
    except pyodbc.Error as ex:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(ex))
    finally:
        cur.close()
        conn.close()
