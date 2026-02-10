# backend/cts_calculada.py
from fastapi import APIRouter, Depends, HTTPException, Query, Path
from pydantic import BaseModel
from typing import Optional
import pyodbc

from database import get_connection
from security import get_current_user

router = APIRouter(prefix="/cts-calculada", tags=["CTSCalculada"])

# --------- Modelos ---------
class CTSCalculadaCreate(BaseModel):
    PKIDPeriodoCTS: int
    PKIDTrabajador: int
    PKIDBanco: int
    CuentaBancariaCTS: Optional[str] = None
    BaseImponibleCTS: Optional[float] = None
    ImportesCTSSoles: Optional[float] = None
    ImporteCTSUSD: Optional[float] = None
    PKIDMoneda: Optional[int] = None
    TipoCambioUSD: Optional[float] = None
    FechaInicio: Optional[str] = None
    FechaTermino: Optional[str] = None
    AnoTiempoServicio: Optional[int] = None
    MesTiempoServicio: Optional[int] = None
    DiaTiempServicio: Optional[int] = None
    DiasLiquidados: Optional[int] = None
    Regimen: Optional[int] = None  # 1 Regular, 2 Extraordinario
    PorcentajeCTS: Optional[float] = None
    ImporteNoComputable: Optional[float] = None
    FechaIngresoTrabajador: Optional[str] = None
    DescuentoCTS: Optional[float] = None
    ImporteProvisionCTS: Optional[float] = None
    DiferenciaProvisionCalculoCTS: Optional[float] = None
    InteresesSoles: Optional[float] = None
    DiasNoComputables: Optional[int] = None
    DiasIntereses: Optional[int] = None
    PKIDSituacionRegistro: int

class CTSCalculadaUpdate(CTSCalculadaCreate):
    PKID: int

# --------- Listar con joins (filtro empresa) ---------
@router.get("/", dependencies=[Depends(get_current_user)])
def listar_cts(empresaId: Optional[int] = Query(None)):
    try:
        conn = get_connection()
        cur = conn.cursor()
        sql = """
        SELECT
            c.PKID,
            c.PKIDPeriodoCTS, p.Ano, p.Mes, p.PKIDEmpresa,
            c.PKIDTrabajador, t.NombreCompleto AS Trabajador,
            c.PKIDBanco, b.Banco,
            c.CuentaBancariaCTS,
            c.BaseImponibleCTS, c.ImportesCTSSoles, c.ImporteCTSUSD,
            c.PKIDMoneda, m.Moneda,
            c.TipoCambioUSD,
            c.FechaInicio, c.FechaTermino,
            c.AnoTiempoServicio, c.MesTiempoServicio, c.DiaTiempServicio,
            c.DiasLiquidados, c.Regimen, c.PorcentajeCTS, c.ImporteNoComputable,
            c.FechaIngresoTrabajador, c.DescuentoCTS, c.ImporteProvisionCTS,
            c.DiferenciaProvisionCalculoCTS, c.InteresesSoles,
            c.DiasNoComputables, c.DiasIntereses,
            c.PKIDSituacionRegistro, s.SituacionRegistro
        FROM CTSCalculada c
        INNER JOIN PeriodoCTS p ON p.PKID = c.PKIDPeriodoCTS
        INNER JOIN Trabajador t ON t.PKID = c.PKIDTrabajador
        INNER JOIN SituacionRegistro s ON s.PKID = c.PKIDSituacionRegistro
        LEFT JOIN Banco b ON b.PKID = c.PKIDBanco
        LEFT JOIN Moneda m ON m.PKID = c.PKIDMoneda
        """
        if empresaId:
            sql += " WHERE p.PKIDEmpresa = ? AND t.PKIDEmpresa = ?"
            params = (empresaId, empresaId)
        else:
            params = ()
        sql += " ORDER BY p.Ano DESC, p.Mes DESC, t.NombreCompleto"
        cur.execute(sql, params)
        rows = cur.fetchall()
        out = []
        for r in rows:
            out.append({
                "PKID": r.PKID,
                "PKIDPeriodoCTS": r.PKIDPeriodoCTS,
                "Ano": r.Ano, "Mes": r.Mes,
                "PKIDTrabajador": r.PKIDTrabajador, "Trabajador": r.Trabajador,
                "PKIDBanco": r.PKIDBanco, "Banco": r.Banco,
                "CuentaBancariaCTS": r.CuentaBancariaCTS,
                "BaseImponibleCTS": float(r.BaseImponibleCTS) if r.BaseImponibleCTS is not None else None,
                "ImportesCTSSoles": float(r.ImportesCTSSoles) if r.ImportesCTSSoles is not None else None,
                "ImporteCTSUSD": float(r.ImporteCTSUSD) if r.ImporteCTSUSD is not None else None,
                "PKIDMoneda": r.PKIDMoneda, "Moneda": r.Moneda,
                "TipoCambioUSD": float(r.TipoCambioUSD) if r.TipoCambioUSD is not None else None,
                "FechaInicio": r.FechaInicio.isoformat() if r.FechaInicio else None,
                "FechaTermino": r.FechaTermino.isoformat() if r.FechaTermino else None,
                "AnoTiempoServicio": r.AnoTiempoServicio,
                "MesTiempoServicio": r.MesTiempoServicio,
                "DiaTiempServicio": r.DiaTiempServicio,
                "DiasLiquidados": r.DiasLiquidados,
                "Regimen": r.Regimen,
                "PorcentajeCTS": float(r.PorcentajeCTS) if r.PorcentajeCTS is not None else None,
                "ImporteNoComputable": float(r.ImporteNoComputable) if r.ImporteNoComputable is not None else None,
                "FechaIngresoTrabajador": r.FechaIngresoTrabajador.isoformat() if r.FechaIngresoTrabajador else None,
                "DescuentoCTS": float(r.DescuentoCTS) if r.DescuentoCTS is not None else None,
                "ImporteProvisionCTS": float(r.ImporteProvisionCTS) if r.ImporteProvisionCTS is not None else None,
                "DiferenciaProvisionCalculoCTS": float(r.DiferenciaProvisionCalculoCTS) if r.DiferenciaProvisionCalculoCTS is not None else None,
                "InteresesSoles": float(r.InteresesSoles) if r.InteresesSoles is not None else None,
                "DiasNoComputables": r.DiasNoComputables,
                "DiasIntereses": r.DiasIntereses,
                "PKIDSituacionRegistro": r.PKIDSituacionRegistro,
                "SituacionRegistro": r.SituacionRegistro,
            })
        return out
    except pyodbc.Error as e:
        raise HTTPException(status_code=500, detail=str(e))

# --------- Crear (evitar duplicado PeriodoCTS + Trabajador) ---------
@router.post("/", dependencies=[Depends(get_current_user)])
def crear_cts(payload: CTSCalculadaCreate):
    try:
        if payload.Regimen not in (None, 1, 2):
            raise HTTPException(status_code=400, detail="Regimen inválido (solo 1 o 2).")

        conn = get_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT 1 FROM CTSCalculada
            WHERE PKIDPeriodoCTS = ? AND PKIDTrabajador = ?
        """, (payload.PKIDPeriodoCTS, payload.PKIDTrabajador))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="Ya existe CTS para ese PeriodoCTS y Trabajador.")

        cur.execute("""
            INSERT INTO CTSCalculada (
                PKIDPeriodoCTS, PKIDTrabajador, PKIDBanco, CuentaBancariaCTS,
                BaseImponibleCTS, ImportesCTSSoles, ImporteCTSUSD, PKIDMoneda, TipoCambioUSD,
                FechaInicio, FechaTermino,
                AnoTiempoServicio, MesTiempoServicio, DiaTiempServicio, DiasLiquidados, Regimen,
                PorcentajeCTS, ImporteNoComputable, FechaIngresoTrabajador, DescuentoCTS,
                ImporteProvisionCTS, DiferenciaProvisionCalculoCTS, InteresesSoles,
                DiasNoComputables, DiasIntereses, PKIDSituacionRegistro
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            payload.PKIDPeriodoCTS, payload.PKIDTrabajador, payload.PKIDBanco, payload.CuentaBancariaCTS,
            payload.BaseImponibleCTS, payload.ImportesCTSSoles, payload.ImporteCTSUSD, payload.PKIDMoneda, payload.TipoCambioUSD,
            payload.FechaInicio, payload.FechaTermino,
            payload.AnoTiempoServicio, payload.MesTiempoServicio, payload.DiaTiempServicio, payload.DiasLiquidados, payload.Regimen,
            payload.PorcentajeCTS, payload.ImporteNoComputable, payload.FechaIngresoTrabajador, payload.DescuentoCTS,
            payload.ImporteProvisionCTS, payload.DiferenciaProvisionCalculoCTS, payload.InteresesSoles,
            payload.DiasNoComputables, payload.DiasIntereses, payload.PKIDSituacionRegistro
        ))
        conn.commit()
        new_id = cur.execute("SELECT SCOPE_IDENTITY()").fetchval()
        return {"PKID": int(new_id)}
    except HTTPException:
        raise
    except pyodbc.Error as e:
        raise HTTPException(status_code=500, detail=str(e))

# --------- Actualizar ---------
@router.put("/{pkid}", dependencies=[Depends(get_current_user)])
def actualizar_cts(pkid: int, payload: CTSCalculadaUpdate):
    try:
        if payload.Regimen not in (None, 1, 2):
            raise HTTPException(status_code=400, detail="Regimen inválido (solo 1 o 2).")

        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT 1 FROM CTSCalculada WHERE PKID = ?", (pkid,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Registro no encontrado.")

        cur.execute("""
            SELECT 1 FROM CTSCalculada
            WHERE PKIDPeriodoCTS = ? AND PKIDTrabajador = ? AND PKID <> ?
        """, (payload.PKIDPeriodoCTS, payload.PKIDTrabajador, pkid))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="Duplicado PeriodoCTS + Trabajador.")

        cur.execute("""
            UPDATE CTSCalculada
            SET PKIDPeriodoCTS=?, PKIDTrabajador=?, PKIDBanco=?, CuentaBancariaCTS=?,
                BaseImponibleCTS=?, ImportesCTSSoles=?, ImporteCTSUSD=?, PKIDMoneda=?, TipoCambioUSD=?,
                FechaInicio=?, FechaTermino=?,
                AnoTiempoServicio=?, MesTiempoServicio=?, DiaTiempServicio=?, DiasLiquidados=?, Regimen=?,
                PorcentajeCTS=?, ImporteNoComputable=?, FechaIngresoTrabajador=?, DescuentoCTS=?,
                ImporteProvisionCTS=?, DiferenciaProvisionCalculoCTS=?, InteresesSoles=?,
                DiasNoComputables=?, DiasIntereses=?, PKIDSituacionRegistro=?
            WHERE PKID=?
        """, (
            payload.PKIDPeriodoCTS, payload.PKIDTrabajador, payload.PKIDBanco, payload.CuentaBancariaCTS,
            payload.BaseImponibleCTS, payload.ImportesCTSSoles, payload.ImporteCTSUSD, payload.PKIDMoneda, payload.TipoCambioUSD,
            payload.FechaInicio, payload.FechaTermino,
            payload.AnoTiempoServicio, payload.MesTiempoServicio, payload.DiaTiempServicio, payload.DiasLiquidados, payload.Regimen,
            payload.PorcentajeCTS, payload.ImporteNoComputable, payload.FechaIngresoTrabajador, payload.DescuentoCTS,
            payload.ImporteProvisionCTS, payload.DiferenciaProvisionCalculoCTS, payload.InteresesSoles,
            payload.DiasNoComputables, payload.DiasIntereses, payload.PKIDSituacionRegistro,
            pkid
        ))
        conn.commit()
        return {"ok": True}
    except HTTPException:
        raise
    except pyodbc.Error as e:
        raise HTTPException(status_code=500, detail=str(e))

# --------- Eliminar (si no hay conceptos hijos) ---------
@router.delete("/{pkid}", dependencies=[Depends(get_current_user)])
def eliminar_cts(pkid: int):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT 1 FROM CTSCalculada WHERE PKID = ?", (pkid,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Registro no encontrado.")

        cur.execute("SELECT 1 FROM CTSCalculadaConcepto WHERE PKIDCTSCalculada = ?", (pkid,))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="No se puede eliminar: existen conceptos asociados.")

        cur.execute("DELETE FROM CTSCalculada WHERE PKID = ?", (pkid,))
        conn.commit()
        return {"ok": True}
    except pyodbc.Error as e:
        raise HTTPException(status_code=500, detail=str(e))
