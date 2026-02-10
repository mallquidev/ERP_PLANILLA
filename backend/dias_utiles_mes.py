# dias_utiles_mes.py
from fastapi import APIRouter, Depends, HTTPException, Path, Query
from pydantic import BaseModel
from typing import Optional, List
import pyodbc

from database import get_connection
from security import get_current_user

router = APIRouter(prefix="/dias-utiles-mes", tags=["DiasUtilesMes"])

# ---------- Schemas ----------
class DiasUtilesMesBase(BaseModel):
    PKIDEmpresa: int
    Ano: int
    Mes: int
    NumeroDiasUtiles: Optional[int] = None
    PKIDSituacionRegistro: Optional[int] = None

class DiasUtilesMesCreate(DiasUtilesMesBase):
    pass

class DiasUtilesMesUpdate(BaseModel):
    Ano: int
    Mes: int
    NumeroDiasUtiles: Optional[int] = None
    PKIDSituacionRegistro: Optional[int] = None

# ---------- Endpoints ----------
@router.get("/", dependencies=[Depends(get_current_user)])
def listar(
    empresaId: Optional[int] = Query(None),
    ano: Optional[int] = Query(None),
    mes: Optional[int] = Query(None),
):
    if not empresaId:
        return []
    conn = get_connection()
    cur = conn.cursor()
    try:
        sql = """
        SELECT d.PKID, d.PKIDEmpresa, d.Ano, d.Mes, d.NumeroDiasUtiles,
               d.PKIDSituacionRegistro, s.SituacionRegistro
        FROM DiasUtilesMes d
        LEFT JOIN SituacionRegistro s ON s.PKID = d.PKIDSituacionRegistro
        WHERE d.PKIDEmpresa = ?
        """
        params = [empresaId]
        if ano is not None:
            sql += " AND d.Ano = ?"
            params.append(ano)
        if mes is not None:
            sql += " AND d.Mes = ?"
            params.append(mes)
        sql += " ORDER BY d.Ano DESC, d.Mes DESC"
        cur.execute(sql, params)
        cols = [c[0] for c in cur.description]
        return [dict(zip(cols, r)) for r in cur.fetchall()]
    finally:
        cur.close()
        conn.close()


@router.post("/", dependencies=[Depends(get_current_user)])
def crear(body: DiasUtilesMesCreate):
    conn = get_connection()
    cur = conn.cursor()
    try:
        # Validación de unicidad (PKIDEmpresa, Ano, Mes)
        cur.execute("""
            SELECT 1 FROM DiasUtilesMes
            WHERE PKIDEmpresa = ? AND Ano = ? AND Mes = ?
        """, (body.PKIDEmpresa, body.Ano, body.Mes))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="Ya existe un registro para esa empresa/año/mes.")

        # Generar PKID (la tabla no es IDENTITY)
        cur.execute("SELECT ISNULL(MAX(PKID), 0) + 1 FROM DiasUtilesMes")
        next_id = cur.fetchone()[0]

        cur.execute("""
            INSERT INTO DiasUtilesMes (
                PKID, PKIDEmpresa, Ano, Mes, NumeroDiasUtiles, PKIDSituacionRegistro
            ) VALUES (?, ?, ?, ?, ?, ?)
        """, (next_id, body.PKIDEmpresa, body.Ano, body.Mes, body.NumeroDiasUtiles, body.PKIDSituacionRegistro))
        conn.commit()
        return {"PKID": next_id}
    except pyodbc.Error as ex:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(ex))
    finally:
        cur.close()
        conn.close()


@router.put("/{PKID}", dependencies=[Depends(get_current_user)])
def actualizar(PKID: int = Path(...), body: DiasUtilesMesUpdate = None):
    conn = get_connection()
    cur = conn.cursor()
    try:
        # Obtener empresa para validar unicidad
        cur.execute("SELECT PKIDEmpresa FROM DiasUtilesMes WHERE PKID = ?", (PKID,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Registro no encontrado.")
        empresa_id = row[0]

        # Validación de unicidad (otro registro con mismo (empresa, año, mes))
        cur.execute("""
            SELECT 1 FROM DiasUtilesMes
            WHERE PKIDEmpresa = ? AND Ano = ? AND Mes = ? AND PKID <> ?
        """, (empresa_id, body.Ano, body.Mes, PKID))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="Ya existe otro registro con ese año/mes en la empresa.")

        cur.execute("""
            UPDATE DiasUtilesMes
            SET Ano = ?, Mes = ?, NumeroDiasUtiles = ?, PKIDSituacionRegistro = ?
            WHERE PKID = ?
        """, (body.Ano, body.Mes, body.NumeroDiasUtiles, body.PKIDSituacionRegistro, PKID))
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


@router.delete("/{PKID}", dependencies=[Depends(get_current_user)])
def eliminar(PKID: int = Path(...)):
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM DiasUtilesMes WHERE PKID = ?", (PKID,))
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
