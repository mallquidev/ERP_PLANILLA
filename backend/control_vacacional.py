# backend/control_vacacional.py
from fastapi import APIRouter, Depends, HTTPException, Query, Path
from pydantic import BaseModel
from typing import Optional, List
import pyodbc

from database import get_connection
from security import get_current_user

router = APIRouter(prefix="/control-vacacional", tags=["ControlVacacional"])

# ---------- Modelos ----------
class ControlVacacionalCreate(BaseModel):
    PKIDTrabajador: int
    Ano: int
    Mes: int
    FechaIngreso: str
    SaldoVacaciones: Optional[float] = None
    DiasTruncosVacaciones: Optional[float] = None
    MesesTruncosVacaciones: Optional[float] = None
    SaldoImporteVacaciones: Optional[float] = None
    PKIDSituacionRegistro: int
    FechaCese: Optional[str] = None

class ControlVacacionalUpdate(ControlVacacionalCreate):
    PKID: int

# ---------- Listar con joins (filtro por empresa opcional) ----------
@router.get("/", dependencies=[Depends(get_current_user)])
def listar_control(
    empresaId: Optional[int] = Query(None, description="Filtrar por empresa (desde Trabajador.PKIDEmpresa)")
):
    try:
        conn = get_connection()
        cur = conn.cursor()

        base_sql = """
        SELECT
            c.PKID,
            c.PKIDTrabajador,
            t.NombreCompleto AS Trabajador,
            t.PKIDEmpresa,
            c.Ano,
            c.Mes,
            c.FechaIngreso,
            c.SaldoVacaciones,
            c.DiasTruncosVacaciones,
            c.MesesTruncosVacaciones,
            c.SaldoImporteVacaciones,
            c.PKIDSituacionRegistro,
            s.SituacionRegistro,
            c.FechaCese
        FROM ControlVacacional c
        INNER JOIN Trabajador t ON t.PKID = c.PKIDTrabajador
        INNER JOIN SituacionRegistro s ON s.PKID = c.PKIDSituacionRegistro
        """
        if empresaId:
            base_sql += " WHERE t.PKIDEmpresa = ? ORDER BY c.Ano DESC, c.Mes DESC, t.NombreCompleto"
            cur.execute(base_sql, (empresaId,))
        else:
            base_sql += " ORDER BY c.Ano DESC, c.Mes DESC, t.NombreCompleto"
            cur.execute(base_sql)

        rows = cur.fetchall()
        data = []
        for r in rows:
            data.append({
                "PKID": r.PKID,
                "PKIDTrabajador": r.PKIDTrabajador,
                "Trabajador": r.Trabajador,
                "PKIDEmpresa": r.PKIDEmpresa,
                "Ano": r.Ano,
                "Mes": r.Mes,
                "FechaIngreso": r.FechaIngreso.isoformat() if r.FechaIngreso else None,
                "SaldoVacaciones": float(r.SaldoVacaciones) if r.SaldoVacaciones is not None else None,
                "DiasTruncosVacaciones": float(r.DiasTruncosVacaciones) if r.DiasTruncosVacaciones is not None else None,
                "MesesTruncosVacaciones": float(r.MesesTruncosVacaciones) if r.MesesTruncosVacaciones is not None else None,
                "SaldoImporteVacaciones": float(r.SaldoImporteVacaciones) if r.SaldoImporteVacaciones is not None else None,
                "PKIDSituacionRegistro": r.PKIDSituacionRegistro,
                "SituacionRegistro": r.SituacionRegistro,
                "FechaCese": r.FechaCese.isoformat() if r.FechaCese else None,
            })
        return data
    except pyodbc.Error as e:
        raise HTTPException(status_code=500, detail=str(e))

# ---------- Crear (valida UNIQUE PKIDTrabajador+Ano+Mes) ----------
@router.post("/", dependencies=[Depends(get_current_user)])
def crear_control(payload: ControlVacacionalCreate):
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT 1
            FROM ControlVacacional
            WHERE PKIDTrabajador = ? AND Ano = ? AND Mes = ?
        """, (payload.PKIDTrabajador, payload.Ano, payload.Mes))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="Ya existe un registro para ese Trabajador/Año/Mes.")

        cur.execute("""
            INSERT INTO ControlVacacional (
                PKIDTrabajador, Ano, Mes, FechaIngreso, SaldoVacaciones, DiasTruncosVacaciones,
                MesesTruncosVacaciones, SaldoImporteVacaciones, PKIDSituacionRegistro, FechaCese
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            payload.PKIDTrabajador, payload.Ano, payload.Mes, payload.FechaIngreso,
            payload.SaldoVacaciones, payload.DiasTruncosVacaciones, payload.MesesTruncosVacaciones,
            payload.SaldoImporteVacaciones, payload.PKIDSituacionRegistro, payload.FechaCese
        ))
        conn.commit()

        new_id = cur.execute("SELECT SCOPE_IDENTITY()").fetchval()
        return {"PKID": int(new_id)}
    except HTTPException:
        raise
    except pyodbc.Error as e:
        raise HTTPException(status_code=500, detail=str(e))

# ---------- Actualizar ----------
@router.put("/{pkid}", dependencies=[Depends(get_current_user)])
def actualizar_control(
    pkid: int = Path(..., description="PKID de ControlVacacional"),
    payload: ControlVacacionalUpdate = None
):
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("SELECT 1 FROM ControlVacacional WHERE PKID = ?", (pkid,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="ControlVacacional no encontrado.")

        cur.execute("""
            SELECT 1
            FROM ControlVacacional
            WHERE PKIDTrabajador = ? AND Ano = ? AND Mes = ? AND PKID <> ?
        """, (payload.PKIDTrabajador, payload.Ano, payload.Mes, pkid))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="Ya existe un registro para ese Trabajador/Año/Mes.")

        cur.execute("""
            UPDATE ControlVacacional
            SET PKIDTrabajador = ?, Ano = ?, Mes = ?, FechaIngreso = ?,
                SaldoVacaciones = ?, DiasTruncosVacaciones = ?, MesesTruncosVacaciones = ?,
                SaldoImporteVacaciones = ?, PKIDSituacionRegistro = ?, FechaCese = ?
            WHERE PKID = ?
        """, (
            payload.PKIDTrabajador, payload.Ano, payload.Mes, payload.FechaIngreso,
            payload.SaldoVacaciones, payload.DiasTruncosVacaciones, payload.MesesTruncosVacaciones,
            payload.SaldoImporteVacaciones, payload.PKIDSituacionRegistro, payload.FechaCese,
            pkid
        ))
        conn.commit()
        return {"ok": True}
    except HTTPException:
        raise
    except pyodbc.Error as e:
        raise HTTPException(status_code=500, detail=str(e))

# ---------- Eliminar ----------
@router.delete("/{pkid}", dependencies=[Depends(get_current_user)])
def eliminar_control(pkid: int = Path(...)):
    try:
        conn = get_connection()
        cur = conn.cursor()

        # Validar que NO existan periodos hijos
        cur.execute("SELECT 1 FROM ControlVacacionalPeriodo WHERE PKIDControlVacacional = ?", (pkid,))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="No se puede eliminar: existen periodos asociados.")

        cur.execute("DELETE FROM ControlVacacional WHERE PKID = ?", (pkid,))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="ControlVacacional no encontrado.")
        conn.commit()
        return {"ok": True}
    except HTTPException:
        raise
    except pyodbc.Error as e:
        raise HTTPException(status_code=500, detail=str(e))
