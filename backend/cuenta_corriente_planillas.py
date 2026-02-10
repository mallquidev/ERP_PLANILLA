# backend/cuenta_corriente_planillas.py
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
import pyodbc

from database import get_connection
from security import get_current_user

router = APIRouter(prefix="/cuenta-corriente-planillas", tags=["CuentaCorrientePlanillas"])

class CCPCreate(BaseModel):
    IDCuentaCorrientePlanillas: int
    PKIDTrabajador: int
    DocumentoReferencia: str           # <- corregido
    GlosaReferencia: str
    FechaEmision: str
    FechaVencimiento: Optional[str] = None
    PKIDMoneda: int
    ImporteDocumento: float
    ImporteAbono: Optional[float] = 0
    ImporteSaldo: Optional[float] = None
    NumeroCuotas: Optional[int] = None
    TasaInteres: Optional[float] = None
    IndicadorControlCheck: Optional[bool] = None
    PKIDSituacionRegistro: int
    PKIDConceptoPlanilla: Optional[int] = None
    PKIDCuentaContable: Optional[int] = None
    PKIDTipoComprobante: Optional[int] = None

class CCPUpdate(CCPCreate):
    PKID: int

@router.get("/", dependencies=[Depends(get_current_user)])
def listar(empresaId: Optional[int] = Query(None)):
    try:
        conn = get_connection()
        cur = conn.cursor()
        sql = """
        SELECT
            c.PKID, c.IDCuentaCorrientePlanillas,
            c.PKIDTrabajador, t.NombreCompleto AS Trabajador,
            c.DocumentoReferencia, c.GlosaReferencia,   -- <- corregido
            c.FechaEmision, c.FechaVencimiento,
            c.PKIDMoneda, m.Moneda,
            c.ImporteDocumento, c.ImporteAbono, c.ImporteSaldo,
            c.NumeroCuotas, c.TasaInteres, c.IndicadorControlCheck,
            c.PKIDSituacionRegistro, s.SituacionRegistro,
            c.PKIDConceptoPlanilla, cp.ConceptoPlanilla,
            c.PKIDCuentaContable, cc.CuentaContable,
            c.PKIDTipoComprobante, tc.TipoComprobante
        FROM CuentaCorrientePlanillas c
        INNER JOIN Trabajador t ON t.PKID = c.PKIDTrabajador
        INNER JOIN Moneda m ON m.PKID = c.PKIDMoneda
        INNER JOIN SituacionRegistro s ON s.PKID = c.PKIDSituacionRegistro
        LEFT JOIN ConceptoPlanilla cp ON cp.PKID = c.PKIDConceptoPlanilla
        LEFT JOIN CuentaContable cc ON cc.PKID = c.PKIDCuentaContable
        LEFT JOIN TipoComprobante tc ON tc.PKID = c.PKIDTipoComprobante
        """
        params = ()
        if empresaId:
            sql += " WHERE t.PKIDEmpresa = ?"
            params = (empresaId,)
        sql += " ORDER BY c.FechaEmision DESC, c.IDCuentaCorrientePlanillas DESC"
        cur.execute(sql, params)
        rows = cur.fetchall()
        out = []
        for r in rows:
            out.append({
                "PKID": r.PKID,
                "IDCuentaCorrientePlanillas": r.IDCuentaCorrientePlanillas,
                "PKIDTrabajador": r.PKIDTrabajador,
                "Trabajador": r.Trabajador,
                "DocumentoReferencia": r.DocumentoReferencia,   # <- corregido
                "GlosaReferencia": r.GlosaReferencia,
                "FechaEmision": r.FechaEmision.isoformat() if r.FechaEmision else None,
                "FechaVencimiento": r.FechaVencimiento.isoformat() if r.FechaVencimiento else None,
                "PKIDMoneda": r.PKIDMoneda,
                "Moneda": r.Moneda,
                "ImporteDocumento": float(r.ImporteDocumento) if r.ImporteDocumento is not None else None,
                "ImporteAbono": float(r.ImporteAbono) if r.ImporteAbono is not None else None,
                "ImporteSaldo": float(r.ImporteSaldo) if r.ImporteSaldo is not None else None,
                "NumeroCuotas": r.NumeroCuotas,
                "TasaInteres": float(r.TasaInteres) if r.TasaInteres is not None else None,
                "IndicadorControlCheck": bool(r.IndicadorControlCheck) if r.IndicadorControlCheck is not None else None,
                "PKIDSituacionRegistro": r.PKIDSituacionRegistro,
                "SituacionRegistro": r.SituacionRegistro,
                "PKIDConceptoPlanilla": r.PKIDConceptoPlanilla,
                "ConceptoPlanilla": r.ConceptoPlanilla,
                "PKIDCuentaContable": r.PKIDCuentaContable,
                "CuentaContable": r.CuentaContable,
                "PKIDTipoComprobante": r.PKIDTipoComprobante,
                "TipoComprobante": r.TipoComprobante,
            })
        return out
    except pyodbc.Error as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", dependencies=[Depends(get_current_user)])
def crear(payload: CCPCreate):
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("SELECT 1 FROM CuentaCorrientePlanillas WHERE IDCuentaCorrientePlanillas = ?", (payload.IDCuentaCorrientePlanillas,))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="IDCuentaCorrientePlanillas ya existe.")

        importe_abono = payload.ImporteAbono or 0
        importe_saldo = payload.ImporteSaldo if payload.ImporteSaldo is not None else (payload.ImporteDocumento - importe_abono)

        cur.execute("""
            INSERT INTO CuentaCorrientePlanillas (
                IDCuentaCorrientePlanillas, PKIDTrabajador, DocumentoReferencia, GlosaReferencia,
                FechaEmision, FechaVencimiento, PKIDMoneda, ImporteDocumento, ImporteAbono, ImporteSaldo,
                NumeroCuotas, TasaInteres, IndicadorControlCheck, PKIDSituacionRegistro,
                PKIDConceptoPlanilla, PKIDCuentaContable, PKIDTipoComprobante
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            payload.IDCuentaCorrientePlanillas, payload.PKIDTrabajador, payload.DocumentoReferencia, payload.GlosaReferencia,  # <- corregido
            payload.FechaEmision, payload.FechaVencimiento, payload.PKIDMoneda, payload.ImporteDocumento, importe_abono, importe_saldo,
            payload.NumeroCuotas, payload.TasaInteres, payload.IndicadorControlCheck, payload.PKIDSituacionRegistro,
            payload.PKIDConceptoPlanilla, payload.PKIDCuentaContable, payload.PKIDTipoComprobante
        ))
        conn.commit()
        new_id = cur.execute("SELECT SCOPE_IDENTITY()").fetchval()
        return {"PKID": int(new_id)}
    except HTTPException:
        raise
    except pyodbc.Error as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{pkid}", dependencies=[Depends(get_current_user)])
def actualizar(pkid: int, payload: CCPUpdate):
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("SELECT 1 FROM CuentaCorrientePlanillas WHERE PKID = ?", (pkid,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Registro no encontrado.")

        cur.execute("""
            SELECT 1 FROM CuentaCorrientePlanillas
            WHERE IDCuentaCorrientePlanillas = ? AND PKID <> ?
        """, (payload.IDCuentaCorrientePlanillas, pkid))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="IDCuentaCorrientePlanillas duplicado en otro registro.")

        importe_abono = payload.ImporteAbono or 0
        importe_saldo = payload.ImporteSaldo if payload.ImporteSaldo is not None else (payload.ImporteDocumento - importe_abono)

        cur.execute("""
            UPDATE CuentaCorrientePlanillas
            SET IDCuentaCorrientePlanillas=?, PKIDTrabajador=?, DocumentoReferencia=?, GlosaReferencia=?,
                FechaEmision=?, FechaVencimiento=?, PKIDMoneda=?, ImporteDocumento=?, ImporteAbono=?, ImporteSaldo=?,
                NumeroCuotas=?, TasaInteres=?, IndicadorControlCheck=?, PKIDSituacionRegistro=?,
                PKIDConceptoPlanilla=?, PKIDCuentaContable=?, PKIDTipoComprobante=?
            WHERE PKID=?
        """, (
            payload.IDCuentaCorrientePlanillas, payload.PKIDTrabajador, payload.DocumentoReferencia, payload.GlosaReferencia,  # <- corregido
            payload.FechaEmision, payload.FechaVencimiento, payload.PKIDMoneda, payload.ImporteDocumento, importe_abono, importe_saldo,
            payload.NumeroCuotas, payload.TasaInteres, payload.IndicadorControlCheck, payload.PKIDSituacionRegistro,
            payload.PKIDConceptoPlanilla, payload.PKIDCuentaContable, payload.PKIDTipoComprobante,
            pkid
        ))
        conn.commit()
        return {"ok": True}
    except HTTPException:
        raise
    except pyodbc.Error as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{pkid}", dependencies=[Depends(get_current_user)])
def eliminar(pkid: int):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT 1 FROM CuentaCorrientePlanillas WHERE PKID=?", (pkid,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Registro no encontrado.")

        cur.execute("SELECT 1 FROM CuentaCorrientePlanillasAplicacion WHERE PKIDCuentaCorrientePlanillas=?", (pkid,))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="No se puede eliminar: tiene aplicaciones asociadas.")

        cur.execute("SELECT 1 FROM CuentaCorrientePlanillasCuotas WHERE PKIDCuentaCorrientePlanillas=?", (pkid,))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="No se puede eliminar: tiene cuotas asociadas.")

        cur.execute("DELETE FROM CuentaCorrientePlanillas WHERE PKID=?", (pkid,))
        conn.commit()
        return {"ok": True}
    except pyodbc.Error as e:
        raise HTTPException(status_code=500, detail=str(e))
