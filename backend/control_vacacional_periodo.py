# backend/control_vacacional_periodo.py
from fastapi import APIRouter, Depends, HTTPException, Query, Path
from pydantic import BaseModel
from typing import Optional
import pyodbc

from database import get_connection
from security import get_current_user

router = APIRouter(prefix="/control-vacacional-periodo", tags=["ControlVacacionalPeriodo"])

# ---------- Modelos ----------
class PeriodoCreate(BaseModel):
    PKIDControlVacacional: int
    AnoServicio: int
    FechaInicio: str
    FechaFin: str
    VacacionesGanadas: Optional[float] = None
    VacacionesGozadas: Optional[float] = None
    VacacionesVendidas: Optional[float] = None
    VacacionesAdelantadas: Optional[float] = None
    VacacionesIndeminzadas: Optional[float] = None
    TiempoServicioAno: Optional[int] = None
    TiempoServicioMes: Optional[int] = None
    TiempoServicioDia: Optional[int] = None
    Dias: Optional[int] = None
    IndicadorInicialCheck: Optional[bool] = None
    SaldoInicialVacaciones: Optional[float] = None
    SaldoAdelantoVacaciones: Optional[float] = None
    DiasTruncos: Optional[float] = None
    MesesTruncos: Optional[float] = None
    DevengadoTrunco: Optional[float] = None
    DiasSubsidiados: Optional[float] = None
    PKIDSituacionRegistro: int
    IndicadorUltimoPeriodo: Optional[str] = None  # char(1)

class PeriodoUpdate(PeriodoCreate):
    PKID: int

# ---------- Listar por Control (join situacion) ----------
@router.get("/", dependencies=[Depends(get_current_user)])
def listar_periodos(controlId: int = Query(..., description="PKID de ControlVacacional")):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT
                p.PKID,
                p.PKIDControlVacacional,
                p.AnoServicio,
                p.FechaInicio,
                p.FechaFin,
                p.VacacionesGanadas,
                p.VacacionesGozadas,
                p.VacacionesVendidas,
                p.VacacionesAdelantadas,
                p.VacacionesIndeminzadas,
                p.TiempoServicioAno,
                p.TiempoServicioMes,
                p.TiempoServicioDia,
                p.Dias,
                p.IndicadorInicialCheck,
                p.SaldoInicialVacaciones,
                p.SaldoAdelantoVacaciones,
                p.DiasTruncos,
                p.MesesTruncos,
                p.DevengadoTrunco,
                p.DiasSubsidiados,
                p.PKIDSituacionRegistro,
                s.SituacionRegistro,
                p.IndicadorUltimoPeriodo
            FROM ControlVacacionalPeriodo p
            INNER JOIN SituacionRegistro s ON s.PKID = p.PKIDSituacionRegistro
            WHERE p.PKIDControlVacacional = ?
            ORDER BY p.AnoServicio DESC, p.FechaInicio DESC
        """, (controlId,))
        rows = cur.fetchall()
        data = []
        for r in rows:
            data.append({
                "PKID": r.PKID,
                "PKIDControlVacacional": r.PKIDControlVacacional,
                "AnoServicio": r.AnoServicio,
                "FechaInicio": r.FechaInicio.isoformat() if r.FechaInicio else None,
                "FechaFin": r.FechaFin.isoformat() if r.FechaFin else None,
                "VacacionesGanadas": float(r.VacacionesGanadas) if r.VacacionesGanadas is not None else None,
                "VacacionesGozadas": float(r.VacacionesGozadas) if r.VacacionesGozadas is not None else None,
                "VacacionesVendidas": float(r.VacacionesVendidas) if r.VacacionesVendidas is not None else None,
                "VacacionesAdelantadas": float(r.VacacionesAdelantadas) if r.VacacionesAdelantadas is not None else None,
                "VacacionesIndeminzadas": float(r.VacacionesIndeminzadas) if r.VacacionesIndeminzadas is not None else None,
                "TiempoServicioAno": r.TiempoServicioAno,
                "TiempoServicioMes": r.TiempoServicioMes,
                "TiempoServicioDia": r.TiempoServicioDia,
                "Dias": r.Dias,
                "IndicadorInicialCheck": bool(r.IndicadorInicialCheck) if r.IndicadorInicialCheck is not None else None,
                "SaldoInicialVacaciones": float(r.SaldoInicialVacaciones) if r.SaldoInicialVacaciones is not None else None,
                "SaldoAdelantoVacaciones": float(r.SaldoAdelantoVacaciones) if r.SaldoAdelantoVacaciones is not None else None,
                "DiasTruncos": float(r.DiasTruncos) if r.DiasTruncos is not None else None,
                "MesesTruncos": float(r.MesesTruncos) if r.MesesTruncos is not None else None,
                "DevengadoTrunco": float(r.DevengadoTrunco) if r.DevengadoTrunco is not None else None,
                "DiasSubsidiados": float(r.DiasSubsidiados) if r.DiasSubsidiados is not None else None,
                "PKIDSituacionRegistro": r.PKIDSituacionRegistro,
                "SituacionRegistro": r.SituacionRegistro,
                "IndicadorUltimoPeriodo": r.IndicadorUltimoPeriodo
            })
        return data
    except pyodbc.Error as e:
        raise HTTPException(status_code=500, detail=str(e))

# ---------- Crear ----------
@router.post("/", dependencies=[Depends(get_current_user)])
def crear_periodo(payload: PeriodoCreate):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO ControlVacacionalPeriodo (
                PKIDControlVacacional, AnoServicio, FechaInicio, FechaFin,
                VacacionesGanadas, VacacionesGozadas, VacacionesVendidas, VacacionesAdelantadas,
                VacacionesIndeminzadas, TiempoServicioAno, TiempoServicioMes, TiempoServicioDia,
                Dias, IndicadorInicialCheck, SaldoInicialVacaciones, SaldoAdelantoVacaciones,
                DiasTruncos, MesesTruncos, DevengadoTrunco, DiasSubsidiados,
                PKIDSituacionRegistro, IndicadorUltimoPeriodo
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            payload.PKIDControlVacacional, payload.AnoServicio, payload.FechaInicio, payload.FechaFin,
            payload.VacacionesGanadas, payload.VacacionesGozadas, payload.VacacionesVendidas, payload.VacacionesAdelantadas,
            payload.VacacionesIndeminzadas, payload.TiempoServicioAno, payload.TiempoServicioMes, payload.TiempoServicioDia,
            payload.Dias, payload.IndicadorInicialCheck, payload.SaldoInicialVacaciones, payload.SaldoAdelantoVacaciones,
            payload.DiasTruncos, payload.MesesTruncos, payload.DevengadoTrunco, payload.DiasSubsidiados,
            payload.PKIDSituacionRegistro, payload.IndicadorUltimoPeriodo
        ))
        conn.commit()
        new_id = cur.execute("SELECT SCOPE_IDENTITY()").fetchval()
        return {"PKID": int(new_id)}
    except pyodbc.Error as e:
        raise HTTPException(status_code=500, detail=str(e))

# ---------- Actualizar ----------
@router.put("/{pkid}", dependencies=[Depends(get_current_user)])
def actualizar_periodo(pkid: int, payload: PeriodoUpdate):
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("SELECT 1 FROM ControlVacacionalPeriodo WHERE PKID = ?", (pkid,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Periodo no encontrado.")

        cur.execute("""
            UPDATE ControlVacacionalPeriodo
            SET PKIDControlVacacional = ?, AnoServicio = ?, FechaInicio = ?, FechaFin = ?,
                VacacionesGanadas = ?, VacacionesGozadas = ?, VacacionesVendidas = ?, VacacionesAdelantadas = ?,
                VacacionesIndeminzadas = ?, TiempoServicioAno = ?, TiempoServicioMes = ?, TiempoServicioDia = ?,
                Dias = ?, IndicadorInicialCheck = ?, SaldoInicialVacaciones = ?, SaldoAdelantoVacaciones = ?,
                DiasTruncos = ?, MesesTruncos = ?, DevengadoTrunco = ?, DiasSubsidiados = ?,
                PKIDSituacionRegistro = ?, IndicadorUltimoPeriodo = ?
            WHERE PKID = ?
        """, (
            payload.PKIDControlVacacional, payload.AnoServicio, payload.FechaInicio, payload.FechaFin,
            payload.VacacionesGanadas, payload.VacacionesGozadas, payload.VacacionesVendidas, payload.VacacionesAdelantadas,
            payload.VacacionesIndeminzadas, payload.TiempoServicioAno, payload.TiempoServicioMes, payload.TiempoServicioDia,
            payload.Dias, payload.IndicadorInicialCheck, payload.SaldoInicialVacaciones, payload.SaldoAdelantoVacaciones,
            payload.DiasTruncos, payload.MesesTruncos, payload.DevengadoTrunco, payload.DiasSubsidiados,
            payload.PKIDSituacionRegistro, payload.IndicadorUltimoPeriodo,
            pkid
        ))
        conn.commit()
        return {"ok": True}
    except pyodbc.Error as e:
        raise HTTPException(status_code=500, detail=str(e))

# ---------- Eliminar ----------
@router.delete("/{pkid}", dependencies=[Depends(get_current_user)])
def eliminar_periodo(pkid: int):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("DELETE FROM ControlVacacionalPeriodo WHERE PKID = ?", (pkid,))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Periodo no encontrado.")
        conn.commit()
        return {"ok": True}
    except pyodbc.Error as e:
        raise HTTPException(status_code=500, detail=str(e))
