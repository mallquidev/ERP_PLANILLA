# deduccion_periodo.py
from fastapi import APIRouter, Depends, HTTPException, Path, Query
from pydantic import BaseModel
from typing import Optional
import pyodbc

from database import get_connection
from security import get_current_user

router = APIRouter(prefix="/deduccion-periodo", tags=["DeduccionPeriodo"])

# ---------- Schemas ----------
class DeduccionPeriodoBase(BaseModel):
    PKIDEmpresa: int
    PKIDConceptoPlanilla: int
    Ano: int
    Mes: int
    IndicadorBaseImponibleCheck: Optional[bool] = None
    IndicadorAfpCheck: Optional[bool] = None
    IndicadorPeriodoCheck: Optional[bool] = None
    IndicadorCuotaCheck: Optional[bool] = None
    IndicadorPorcentajeCheck: Optional[bool] = None
    IndicadorONPCheck: Optional[bool] = None
    IndicadorRentaCheck: Optional[int] = None  # int en DB; mapearemos 1/0
    PKIDMoneda: Optional[int] = None
    PKIDHoraPlanillaEnlace: Optional[int] = None
    ImporteEnlaceTrabajador: Optional[float] = None
    PorcentajeTrabajador: Optional[float] = None
    PorcentajeEmpleador: Optional[float] = None
    MinimoTrabajador: Optional[float] = None
    MaximoTrabajador: Optional[float] = None
    MinimoEmpleador: Optional[float] = None
    MaximoEmpleador: Optional[float] = None
    MontoCreditoDeduccion: Optional[float] = None
    MontoRedondeo: Optional[int] = None
    ImporteEnlaceEmpleador: Optional[float] = None
    AsignaMontoTrabajador: Optional[float] = None
    IndicadorSubsidioCheck: Optional[bool] = None
    IndicadorExcluirReintegrosCheck: Optional[bool] = None
    PKIDSituacionRegistro: int
    ImporteHoraEnlace: Optional[float] = None

class DeduccionPeriodoCreate(DeduccionPeriodoBase):
    pass

class DeduccionPeriodoUpdate(BaseModel):
    PKIDConceptoPlanilla: int
    Ano: int
    Mes: int
    IndicadorBaseImponibleCheck: Optional[bool] = None
    IndicadorAfpCheck: Optional[bool] = None
    IndicadorPeriodoCheck: Optional[bool] = None
    IndicadorCuotaCheck: Optional[bool] = None
    IndicadorPorcentajeCheck: Optional[bool] = None
    IndicadorONPCheck: Optional[bool] = None
    IndicadorRentaCheck: Optional[int] = None
    PKIDMoneda: Optional[int] = None
    PKIDHoraPlanillaEnlace: Optional[int] = None
    ImporteEnlaceTrabajador: Optional[float] = None
    PorcentajeTrabajador: Optional[float] = None
    PorcentajeEmpleador: Optional[float] = None
    MinimoTrabajador: Optional[float] = None
    MaximoTrabajador: Optional[float] = None
    MinimoEmpleador: Optional[float] = None
    MaximoEmpleador: Optional[float] = None
    MontoCreditoDeduccion: Optional[float] = None
    MontoRedondeo: Optional[int] = None
    ImporteEnlaceEmpleador: Optional[float] = None
    AsignaMontoTrabajador: Optional[float] = None
    IndicadorSubsidioCheck: Optional[bool] = None
    IndicadorExcluirReintegrosCheck: Optional[bool] = None
    PKIDSituacionRegistro: int
    ImporteHoraEnlace: Optional[float] = None

# ---------- Endpoints ----------
@router.get("/", dependencies=[Depends(get_current_user)])
def listar(
    empresaId: Optional[int] = Query(None),
    conceptoId: Optional[int] = Query(None),
    ano: Optional[int] = Query(None),
    mes: Optional[int] = Query(None),
):
    if not empresaId:
        return []
    conn = get_connection()
    cur = conn.cursor()
    try:
        sql = """
        SELECT d.PKID, d.PKIDEmpresa, e.RazonSocial,
               d.PKIDConceptoPlanilla, cp.ConceptoPlanilla,
               d.Ano, d.Mes,
               d.IndicadorBaseImponibleCheck, d.IndicadorAfpCheck, d.IndicadorPeriodoCheck,
               d.IndicadorCuotaCheck, d.IndicadorPorcentajeCheck, d.IndicadorONPCheck,
               d.IndicadorRentaCheck,
               d.PKIDMoneda, m.Moneda,
               d.PKIDHoraPlanillaEnlace, h.HoraPlanilla,
               d.ImporteEnlaceTrabajador, d.PorcentajeTrabajador, d.PorcentajeEmpleador,
               d.MinimoTrabajador, d.MaximoTrabajador, d.MinimoEmpleador, d.MaximoEmpleador,
               d.MontoCreditoDeduccion, d.MontoRedondeo, d.ImporteEnlaceEmpleador,
               d.AsignaMontoTrabajador, d.IndicadorSubsidioCheck, d.IndicadorExcluirReintegrosCheck,
               d.PKIDSituacionRegistro, s.SituacionRegistro,
               d.ImporteHoraEnlace
        FROM DeduccionPeriodo d
        INNER JOIN Empresa e ON e.PKID = d.PKIDEmpresa
        INNER JOIN ConceptoPlanilla cp ON cp.PKID = d.PKIDConceptoPlanilla
        LEFT JOIN Moneda m ON m.PKID = d.PKIDMoneda
        LEFT JOIN HoraPlanilla h ON h.PKID = d.PKIDHoraPlanillaEnlace
        INNER JOIN SituacionRegistro s ON s.PKID = d.PKIDSituacionRegistro
        WHERE d.PKIDEmpresa = ?
        """
        params = [empresaId]
        if conceptoId is not None:
            sql += " AND d.PKIDConceptoPlanilla = ?"
            params.append(conceptoId)
        if ano is not None:
            sql += " AND d.Ano = ?"
            params.append(ano)
        if mes is not None:
            sql += " AND d.Mes = ?"
            params.append(mes)
        sql += " ORDER BY d.Ano DESC, d.Mes DESC, cp.ConceptoPlanilla"
        cur.execute(sql, params)
        cols = [c[0] for c in cur.description]
        return [dict(zip(cols, r)) for r in cur.fetchall()]
    finally:
        cur.close()
        conn.close()


@router.post("/", dependencies=[Depends(get_current_user)])
def crear(body: DeduccionPeriodoCreate):
    conn = get_connection()
    cur = conn.cursor()
    try:
        # Unicidad
        cur.execute("""
            SELECT 1 FROM DeduccionPeriodo
            WHERE PKIDEmpresa = ? AND PKIDConceptoPlanilla = ? AND Ano = ? AND Mes = ?
        """, (body.PKIDEmpresa, body.PKIDConceptoPlanilla, body.Ano, body.Mes))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="Ya existe registro para (empresa, concepto, año, mes).")

        insert_sql = """
        INSERT INTO DeduccionPeriodo (
            PKIDEmpresa, PKIDConceptoPlanilla, Ano, Mes,
            IndicadorBaseImponibleCheck, IndicadorAfpCheck, IndicadorPeriodoCheck,
            IndicadorCuotaCheck, IndicadorPorcentajeCheck, IndicadorONPCheck,
            IndicadorRentaCheck, PKIDMoneda, PKIDHoraPlanillaEnlace, ImporteEnlaceTrabajador,
            PorcentajeTrabajador, PorcentajeEmpleador, MinimoTrabajador, MaximoTrabajador,
            MinimoEmpleador, MaximoEmpleador, MontoCreditoDeduccion, MontoRedondeo,
            ImporteEnlaceEmpleador, AsignaMontoTrabajador, IndicadorSubsidioCheck,
            IndicadorExcluirReintegrosCheck, PKIDSituacionRegistro, ImporteHoraEnlace
        ) OUTPUT inserted.PKID
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        cur.execute(insert_sql, (
            body.PKIDEmpresa, body.PKIDConceptoPlanilla, body.Ano, body.Mes,
            body.IndicadorBaseImponibleCheck, body.IndicadorAfpCheck, body.IndicadorPeriodoCheck,
            body.IndicadorCuotaCheck, body.IndicadorPorcentajeCheck, body.IndicadorONPCheck,
            body.IndicadorRentaCheck, body.PKIDMoneda, body.PKIDHoraPlanillaEnlace, body.ImporteEnlaceTrabajador,
            body.PorcentajeTrabajador, body.PorcentajeEmpleador, body.MinimoTrabajador, body.MaximoTrabajador,
            body.MinimoEmpleador, body.MaximoEmpleador, body.MontoCreditoDeduccion, body.MontoRedondeo,
            body.ImporteEnlaceEmpleador, body.AsignaMontoTrabajador, body.IndicadorSubsidioCheck,
            body.IndicadorExcluirReintegrosCheck, body.PKIDSituacionRegistro, body.ImporteHoraEnlace
        ))
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
def actualizar(PKID: int = Path(...), body: DeduccionPeriodoUpdate = None):
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT PKIDEmpresa FROM DeduccionPeriodo WHERE PKID = ?", (PKID,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Registro no encontrado.")
        empresa_id = row[0]

        # Validar unicidad con cambios
        cur.execute("""
            SELECT 1 FROM DeduccionPeriodo
            WHERE PKIDEmpresa = ? AND PKIDConceptoPlanilla = ? AND Ano = ? AND Mes = ? AND PKID <> ?
        """, (empresa_id, body.PKIDConceptoPlanilla, body.Ano, body.Mes, PKID))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="Ya existe otro registro con esos datos (empresa, concepto, año, mes).")

        update_sql = """
        UPDATE DeduccionPeriodo
        SET PKIDConceptoPlanilla = ?, Ano = ?, Mes = ?,
            IndicadorBaseImponibleCheck = ?, IndicadorAfpCheck = ?, IndicadorPeriodoCheck = ?,
            IndicadorCuotaCheck = ?, IndicadorPorcentajeCheck = ?, IndicadorONPCheck = ?,
            IndicadorRentaCheck = ?, PKIDMoneda = ?, PKIDHoraPlanillaEnlace = ?, ImporteEnlaceTrabajador = ?,
            PorcentajeTrabajador = ?, PorcentajeEmpleador = ?, MinimoTrabajador = ?, MaximoTrabajador = ?,
            MinimoEmpleador = ?, MaximoEmpleador = ?, MontoCreditoDeduccion = ?, MontoRedondeo = ?,
            ImporteEnlaceEmpleador = ?, AsignaMontoTrabajador = ?, IndicadorSubsidioCheck = ?,
            IndicadorExcluirReintegrosCheck = ?, PKIDSituacionRegistro = ?, ImporteHoraEnlace = ?
        WHERE PKID = ?
        """
        cur.execute(update_sql, (
            body.PKIDConceptoPlanilla, body.Ano, body.Mes,
            body.IndicadorBaseImponibleCheck, body.IndicadorAfpCheck, body.IndicadorPeriodoCheck,
            body.IndicadorCuotaCheck, body.IndicadorPorcentajeCheck, body.IndicadorONPCheck,
            body.IndicadorRentaCheck, body.PKIDMoneda, body.PKIDHoraPlanillaEnlace, body.ImporteEnlaceTrabajador,
            body.PorcentajeTrabajador, body.PorcentajeEmpleador, body.MinimoTrabajador, body.MaximoTrabajador,
            body.MinimoEmpleador, body.MaximoEmpleador, body.MontoCreditoDeduccion, body.MontoRedondeo,
            body.ImporteEnlaceEmpleador, body.AsignaMontoTrabajador, body.IndicadorSubsidioCheck,
            body.IndicadorExcluirReintegrosCheck, body.PKIDSituacionRegistro, body.ImporteHoraEnlace,
            PKID
        ))
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
        cur.execute("DELETE FROM DeduccionPeriodo WHERE PKID = ?", (PKID,))
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
