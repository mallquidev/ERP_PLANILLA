# dias_utiles_semana.py
from fastapi import APIRouter, Depends, HTTPException, Path, Query
from pydantic import BaseModel
from typing import Optional
import pyodbc

from database import get_connection
from security import get_current_user

router = APIRouter(prefix="/dias-utiles-semana", tags=["DiasUtilesSemana"])

# ---------- Schemas ----------
class DiasUtilesSemanaBase(BaseModel):
    PKIDEmpresa: int
    Ano: int
    Semana: int
    NumeroDiasUtiles: Optional[int] = None
    PKIDSituacionRegistro: Optional[int] = None

class DiasUtilesSemanaCreate(DiasUtilesSemanaBase):
    pass

class DiasUtilesSemanaUpdate(BaseModel):
    Ano: int
    Semana: int
    NumeroDiasUtiles: Optional[int] = None
    PKIDSituacionRegistro: Optional[int] = None

# ---------- Endpoints ----------
@router.get("/", dependencies=[Depends(get_current_user)])
def listar(
    empresaId: Optional[int] = Query(None),
    ano: Optional[int] = Query(None),
    semana: Optional[int] = Query(None),
):
    if not empresaId:
        return []
    conn = get_connection()
    cur = conn.cursor()
    try:
        sql = """
        SELECT d.PKID, d.PKIDEmpresa, d.Ano, d.Semana, d.NumeroDiasUtiles,
               d.PKIDSituacionRegistro, s.SituacionRegistro
        FROM DiasUtilesSemana d
        LEFT JOIN SituacionRegistro s ON s.PKID = d.PKIDSituacionRegistro
        WHERE d.PKIDEmpresa = ?
        """
        params = [empresaId]
        if ano is not None:
            sql += " AND d.Ano = ?"
            params.append(ano)
        if semana is not None:
            sql += " AND d.Semana = ?"
            params.append(semana)
        sql += " ORDER BY d.Ano DESC, d.Semana DESC"
        cur.execute(sql, params)
        cols = [c[0] for c in cur.description]
        return [dict(zip(cols, r)) for r in cur.fetchall()]
    finally:
        cur.close()
        conn.close()


@router.post("/", dependencies=[Depends(get_current_user)])
def crear(body: DiasUtilesSemanaCreate):
    conn = get_connection()
    cur = conn.cursor()
    try:
        # Unicidad (PKIDEmpresa, Ano, Semana)
        cur.execute("""
            SELECT 1 FROM DiasUtilesSemana
            WHERE PKIDEmpresa = ? AND Ano = ? AND Semana = ?
        """, (body.PKIDEmpresa, body.Ano, body.Semana))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="Ya existe un registro para esa empresa/año/semana.")

        cur.execute("""
            INSERT INTO DiasUtilesSemana (
                PKIDEmpresa, Ano, Semana, NumeroDiasUtiles, PKIDSituacionRegistro
            ) OUTPUT inserted.PKID
            VALUES (?, ?, ?, ?, ?)
        """, (body.PKIDEmpresa, body.Ano, body.Semana, body.NumeroDiasUtiles, body.PKIDSituacionRegistro))
        new_id = cur.fetchone()[0]
        conn.commit()
        return {"PKID": new_id}
    except pyodbc.Error as ex:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(ex))
    finally:
        cur.close()
        conn.close()


@router.put("/{PKID}", dependencies=[Depends(get_current_user)])
def actualizar(PKID: int = Path(...), body: DiasUtilesSemanaUpdate = None):
    conn = get_connection()
    cur = conn.cursor()
    try:
        # Obtener empresa para validar unicidad
        cur.execute("SELECT PKIDEmpresa FROM DiasUtilesSemana WHERE PKID = ?", (PKID,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Registro no encontrado.")
        empresa_id = row[0]

        # Unicidad (otro registro con mismo (empresa, año, semana))
        cur.execute("""
            SELECT 1 FROM DiasUtilesSemana
            WHERE PKIDEmpresa = ? AND Ano = ? AND Semana = ? AND PKID <> ?
        """, (empresa_id, body.Ano, body.Semana, PKID))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="Ya existe otro registro con ese año/semana en la empresa.")

        cur.execute("""
            UPDATE DiasUtilesSemana
            SET Ano = ?, Semana = ?, NumeroDiasUtiles = ?, PKIDSituacionRegistro = ?
            WHERE PKID = ?
        """, (body.Ano, body.Semana, body.NumeroDiasUtiles, body.PKIDSituacionRegistro, PKID))
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
        cur.execute("DELETE FROM DiasUtilesSemana WHERE PKID = ?", (PKID,))
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
