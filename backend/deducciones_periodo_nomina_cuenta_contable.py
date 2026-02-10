# deducciones_periodo_nomina_cuenta_contable.py
from fastapi import APIRouter, Depends, HTTPException, Path, Query
from pydantic import BaseModel
from typing import Optional
import pyodbc

from database import get_connection
from security import get_current_user

router = APIRouter(prefix="/deducciones-periodo-nomina-ctacont", tags=["DeduccionesPeriodoNominaCuentaContable"])

class NominaCtaBase(BaseModel):
    PKIDDeduccionPeriodo: int
    PKIDNomina: int
    PKIDCuentaContableMN: int
    PKIDCuentaContableME: Optional[int] = None
    PKIDSituacionRegistro: int

class NominaCtaCreate(NominaCtaBase):
    pass

class NominaCtaUpdate(BaseModel):
    PKIDNomina: int
    PKIDCuentaContableMN: int
    PKIDCuentaContableME: Optional[int] = None
    PKIDSituacionRegistro: int

@router.get("/", dependencies=[Depends(get_current_user)])
def listar(pkid_deduccion_periodo: int = Query(...)):
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT ncc.PKID, ncc.PKIDDeduccionPeriodo, ncc.PKIDNomina, no.Nomina,
                   ncc.PKIDCuentaContableMN, ccmn.CuentaContable AS CuentaMN,
                   ncc.PKIDCuentaContableME, ccme.CuentaContable AS CuentaME,
                   ncc.PKIDSituacionRegistro, s.SituacionRegistro
            FROM DeduccionesPeriodoNominaCuentaContable ncc
            INNER JOIN Nomina no ON no.PKID = ncc.PKIDNomina
            INNER JOIN CuentaContable ccmn ON ccmn.PKID = ncc.PKIDCuentaContableMN
            LEFT JOIN CuentaContable ccme ON ccme.PKID = ncc.PKIDCuentaContableME
            INNER JOIN SituacionRegistro s ON s.PKID = ncc.PKIDSituacionRegistro
            WHERE ncc.PKIDDeduccionPeriodo = ?
            ORDER BY no.Nomina
        """, (pkid_deduccion_periodo,))
        cols = [c[0] for c in cur.description]
        return [dict(zip(cols, r)) for r in cur.fetchall()]
    finally:
        cur.close()
        conn.close()

@router.post("/", dependencies=[Depends(get_current_user)])
def crear(body: NominaCtaCreate):
    conn = get_connection()
    cur = conn.cursor()
    try:
        # Unicidad (PKIDDeduccionPeriodo, PKIDNomina)
        cur.execute("""
            SELECT 1 FROM DeduccionesPeriodoNominaCuentaContable
            WHERE PKIDDeduccionPeriodo = ? AND PKIDNomina = ?
        """, (body.PKIDDeduccionPeriodo, body.PKIDNomina))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="Ya existe una fila para esa nómina en el mismo periodo.")

        cur.execute("""
            INSERT INTO DeduccionesPeriodoNominaCuentaContable (
                PKIDDeduccionPeriodo, PKIDNomina, PKIDCuentaContableMN, PKIDCuentaContableME, PKIDSituacionRegistro
            ) OUTPUT inserted.PKID
            VALUES (?, ?, ?, ?, ?)
        """, (body.PKIDDeduccionPeriodo, body.PKIDNomina, body.PKIDCuentaContableMN, body.PKIDCuentaContableME,
              body.PKIDSituacionRegistro))
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
def actualizar(PKID: int = Path(...), body: NominaCtaUpdate = None):
    conn = get_connection()
    cur = conn.cursor()
    try:
        # validar unicidad al cambiar nomina
        cur.execute("SELECT PKIDDeduccionPeriodo FROM DeduccionesPeriodoNominaCuentaContable WHERE PKID = ?", (PKID,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Detalle no encontrado.")
        pkid_parent = row[0]

        cur.execute("""
            SELECT 1 FROM DeduccionesPeriodoNominaCuentaContable
            WHERE PKIDDeduccionPeriodo = ? AND PKIDNomina = ? AND PKID <> ?
        """, (pkid_parent, body.PKIDNomina, PKID))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="Ya existe otra fila para esa nómina en el periodo.")

        cur.execute("""
            UPDATE DeduccionesPeriodoNominaCuentaContable
            SET PKIDNomina = ?, PKIDCuentaContableMN = ?, PKIDCuentaContableME = ?, PKIDSituacionRegistro = ?
            WHERE PKID = ?
        """, (body.PKIDNomina, body.PKIDCuentaContableMN, body.PKIDCuentaContableME, body.PKIDSituacionRegistro, PKID))
        if cur.rowcount == 0:
            conn.rollback()
            raise HTTPException(status_code=404, detail="Detalle no encontrado.")
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
        cur.execute("DELETE FROM DeduccionesPeriodoNominaCuentaContable WHERE PKID = ?", (PKID,))
        if cur.rowcount == 0:
            conn.rollback()
            raise HTTPException(status_code=404, detail="Detalle no encontrado.")
        conn.commit()
        return {"ok": True}
    except pyodbc.Error as ex:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(ex))
    finally:
        cur.close()
        conn.close()
