#configura_remuneracion_variable.py
from fastapi import APIRouter, Depends, HTTPException, Path
from pydantic import BaseModel
from typing import Optional
import pyodbc

from database import get_connection
from security import get_current_user

router = APIRouter(prefix="/configura-remuneracion-variable", tags=["ConfiguraRemuneracionVariable"])

class RemVarCreate(BaseModel):
    PKIDEmpresa: int
    Ano: int
    Mes: int
    Transaccion: str
    Descripcion: str
    NumeroMesesAnterior: int
    NumeroMesesMinimos: int
    FactorDivision: int
    PKIDTipoProceso: int
    APartirMesAnterior: bool
    FactorTiempoServicio: int
    CondiserarInicioPeriodo: bool
    ConsiderarSoloVariables: bool
    GuardarDatosCalculo: bool
    AplicarComisionPromedio: bool
    PKIDSituacionRegistro: int

class RemVarUpdate(RemVarCreate):
    PKID: int

@router.get("/", dependencies=[Depends(get_current_user)])
def listar():
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT r.PKID, r.PKIDEmpresa, e.RazonSocial as Empresa, r.Ano, r.Mes, r.Transaccion, r.Descripcion,
                   r.NumeroMesesAnterior, r.NumeroMesesMinimos, r.FactorDivision,
                   r.PKIDTipoProceso, tp.TipoProceso,
                   r.APartirMesAnterior, r.FactorTiempoServicio,
                   r.CondiserarInicioPeriodo, r.ConsiderarSoloVariables,
                   r.GuardarDatosCalculo, r.AplicarComisionPromedio,
                   r.PKIDSituacionRegistro, s.SituacionRegistro
              FROM ConfiguraRemuneracionVariable r
         LEFT JOIN Empresa e ON e.PKID = r.PKIDEmpresa
         LEFT JOIN TipoProceso tp ON tp.PKID = r.PKIDTipoProceso
        INNER JOIN SituacionRegistro s ON s.PKID = r.PKIDSituacionRegistro
          ORDER BY r.Ano DESC, r.Mes DESC
        """)
        cols = [c[0] for c in cur.description]
        return [dict(zip(cols, r)) for r in cur.fetchall()]
    finally:
        cur.close()
        conn.close()

@router.post("/", dependencies=[Depends(get_current_user)])
def crear(body: RemVarCreate):
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT 1 FROM ConfiguraRemuneracionVariable
             WHERE PKIDEmpresa = ? AND Ano = ? AND Mes = ? AND Transaccion = ?
        """, (body.PKIDEmpresa, body.Ano, body.Mes, body.Transaccion))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="Ya existe un registro con esa clave única.")

        cur.execute("""
            INSERT INTO ConfiguraRemuneracionVariable (
                PKIDEmpresa, Ano, Mes, Transaccion, Descripcion,
                NumeroMesesAnterior, NumeroMesesMinimos, FactorDivision,
                PKIDTipoProceso, APartirMesAnterior, FactorTiempoServicio,
                CondiserarInicioPeriodo, ConsiderarSoloVariables,
                GuardarDatosCalculo, AplicarComisionPromedio,
                PKIDSituacionRegistro
            ) OUTPUT inserted.PKID
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            body.PKIDEmpresa, body.Ano, body.Mes, body.Transaccion, body.Descripcion,
            body.NumeroMesesAnterior, body.NumeroMesesMinimos, body.FactorDivision,
            body.PKIDTipoProceso, body.APartirMesAnterior, body.FactorTiempoServicio,
            body.CondiserarInicioPeriodo, body.ConsiderarSoloVariables,
            body.GuardarDatosCalculo, body.AplicarComisionPromedio,
            body.PKIDSituacionRegistro
        ))
        new_id = cur.fetchone()[0]
        conn.commit()
        return {"PKID": new_id}
    finally:
        cur.close()
        conn.close()

@router.put("/{PKID}", dependencies=[Depends(get_current_user)])
def actualizar(PKID: int, body: RemVarUpdate):
    if PKID != body.PKID:
        raise HTTPException(status_code=400, detail="PKID no coincide")
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            UPDATE ConfiguraRemuneracionVariable SET
                PKIDEmpresa=?, Ano=?, Mes=?, Transaccion=?, Descripcion=?,
                NumeroMesesAnterior=?, NumeroMesesMinimos=?, FactorDivision=?,
                PKIDTipoProceso=?, APartirMesAnterior=?, FactorTiempoServicio=?,
                CondiserarInicioPeriodo=?, ConsiderarSoloVariables=?,
                GuardarDatosCalculo=?, AplicarComisionPromedio=?,
                PKIDSituacionRegistro=?
            WHERE PKID=?
        """, (
            body.PKIDEmpresa, body.Ano, body.Mes, body.Transaccion, body.Descripcion,
            body.NumeroMesesAnterior, body.NumeroMesesMinimos, body.FactorDivision,
            body.PKIDTipoProceso, body.APartirMesAnterior, body.FactorTiempoServicio,
            body.CondiserarInicioPeriodo, body.ConsiderarSoloVariables,
            body.GuardarDatosCalculo, body.AplicarComisionPromedio,
            body.PKIDSituacionRegistro, PKID
        ))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Registro no encontrado")
        conn.commit()
        return {"ok": True}
    finally:
        cur.close()
        conn.close()

@router.delete("/{PKID}", dependencies=[Depends(get_current_user)])
def eliminar(PKID: int = Path(..., gt=0)):
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM ConfiguraRemuneracionVariable WHERE PKID = ?", (PKID,))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Registro no encontrado")
        conn.commit()
        return {"ok": True}
    finally:
        cur.close()
        conn.close()
