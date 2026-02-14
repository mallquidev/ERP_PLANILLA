# cuenta_contable.py
from fastapi import APIRouter, Depends, HTTPException, Query, Path
from pydantic import BaseModel
from typing import Optional
import pyodbc

from database import get_connection
from security import get_current_user

router = APIRouter(prefix="/cuenta-contable", tags=["CuentaContable"])

# ---------- Esquemas ----------
class CuentaContableBase(BaseModel):
    PKIDEmpresa: int
    IDCuentaContable: int
    CuentaContable: str
    IndicadorMovimientoCheck: bool
    IndicadorAnaliticaCheck: bool
    IndicadorCentroCostoCheck: bool
    NivelCuenta: int
    PKIDSituacionRegistro: int
    IndicadorCuentaCorrienteCheck: Optional[int] = None  # 1/0 o null

class CuentaContableCreate(CuentaContableBase):
    pass

class CuentaContableUpdate(BaseModel):
    IDCuentaContable: int
    CuentaContable: str
    IndicadorMovimientoCheck: bool
    IndicadorAnaliticaCheck: bool
    IndicadorCentroCostoCheck: bool
    NivelCuenta: int
    PKIDSituacionRegistro: int
    IndicadorCuentaCorrienteCheck: Optional[int] = None

# ---------- Endpoints ----------

@router.get("/", dependencies=[Depends(get_current_user)])
def listar_cuentas(
    empresaId: Optional[int] = Query(None),
    id: Optional[int] = Query(None, description="Filtro por IDCuentaContable"),
    nombre: Optional[str] = Query(None, description="Filtro por CuentaContable (like)")
):
    if not empresaId:
        # Sin empresa seleccionada → lista vacía
        return []
    conn = get_connection()
    cur = conn.cursor()
    try:
        sql = '''
        SELECT c.PKID, c.PKIDEmpresa, e.RazonSocial,
               c.IDCuentaContable, c.CuentaContable,
               c.IndicadorMovimientoCheck, c.IndicadorAnaliticaCheck, c.IndicadorCentroCostoCheck,
               c.NivelCuenta, c.PKIDSituacionRegistro, s.SituacionRegistro,
               c.IndicadorCuentaCorrienteCheck
        FROM CuentaContable c
        INNER JOIN Empresa e ON e.PKID = c.PKIDEmpresa
        INNER JOIN SituacionRegistro s ON s.PKID = c.PKIDSituacionRegistro
        WHERE c.PKIDEmpresa = ?
        '''
        params = [empresaId]
        if id is not None:
            sql += " AND c.IDCuentaContable = ?"
            params.append(id)
        if nombre:
            sql += " AND c.CuentaContable LIKE ?"
            params.append(f"%{nombre}%")
        sql += " ORDER BY c.IDCuentaContable"
        cur.execute(sql, params)
        cols = [c[0] for c in cur.description]
        return [dict(zip(cols, r)) for r in cur.fetchall()]
    finally:
        cur.close()
        conn.close()


@router.post("/", dependencies=[Depends(get_current_user)])
def crear(body: CuentaContableCreate):
    conn = get_connection()
    cur = conn.cursor()
    try:
        # Validación unicidad (PKIDEmpresa, IDCuentaContable)
        cur.execute("""
            SELECT 1
            FROM CuentaContable
            WHERE PKIDEmpresa = ? AND IDCuentaContable = ?
        """, (body.PKIDEmpresa, body.IDCuentaContable))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="Ya existe una cuenta con ese ID en la empresa.")

        insert_sql = '''
        INSERT INTO CuentaContable (
            PKIDEmpresa, IDCuentaContable, CuentaContable,
            IndicadorMovimientoCheck, IndicadorAnaliticaCheck, IndicadorCentroCostoCheck,
            NivelCuenta, PKIDSituacionRegistro, IndicadorCuentaCorrienteCheck
        ) OUTPUT inserted.PKID
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        '''
        cur.execute(insert_sql, (
            body.PKIDEmpresa, body.IDCuentaContable, body.CuentaContable,
            body.IndicadorMovimientoCheck, body.IndicadorAnaliticaCheck, body.IndicadorCentroCostoCheck,
            body.NivelCuenta, body.PKIDSituacionRegistro, body.IndicadorCuentaCorrienteCheck
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
        print("PKIDEmpresa recibido:", body.PKIDEmpresa)


@router.put("/{PKID}", dependencies=[Depends(get_current_user)])
def actualizar(
    PKID: int = Path(..., description="PKID de CuentaContable"),
    body: CuentaContableUpdate = None
):
    conn = get_connection()
    cur = conn.cursor()
    try:
        # Obtener empresa para validar unicidad
        cur.execute("SELECT PKIDEmpresa FROM CuentaContable WHERE PKID = ?", (PKID,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Cuenta no encontrada.")
        empresa_id = row[0]

        # Validación unicidad
        cur.execute("""
            SELECT 1
            FROM CuentaContable
            WHERE PKIDEmpresa = ? AND IDCuentaContable = ? AND PKID <> ?
        """, (empresa_id, body.IDCuentaContable, PKID))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="Ya existe otra cuenta con ese ID en la empresa.")

        update_sql = '''
        UPDATE CuentaContable
        SET IDCuentaContable = ?, CuentaContable = ?,
            IndicadorMovimientoCheck = ?, IndicadorAnaliticaCheck = ?, IndicadorCentroCostoCheck = ?,
            NivelCuenta = ?, PKIDSituacionRegistro = ?, IndicadorCuentaCorrienteCheck = ?
        WHERE PKID = ?
        '''
        cur.execute(update_sql, (
            body.IDCuentaContable, body.CuentaContable,
            body.IndicadorMovimientoCheck, body.IndicadorAnaliticaCheck, body.IndicadorCentroCostoCheck,
            body.NivelCuenta, body.PKIDSituacionRegistro, body.IndicadorCuentaCorrienteCheck,
            PKID
        ))
        if cur.rowcount == 0:
            conn.rollback()
            raise HTTPException(status_code=404, detail="Cuenta no encontrada.")
        conn.commit()
        return {"ok": True}
    except pyodbc.Error as ex:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(ex))
    finally:
        cur.close()
        conn.close()


@router.delete("/{PKID}", dependencies=[Depends(get_current_user)])
def eliminar(PKID: int = Path(..., description="PKID de CuentaContable")):
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM CuentaContable WHERE PKID = ?", (PKID,))
        if cur.rowcount == 0:
            conn.rollback()
            raise HTTPException(status_code=404, detail="Cuenta no encontrada.")
        conn.commit()
        return {"ok": True}
    except pyodbc.Error as ex:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(ex))
    finally:
        cur.close()
        conn.close()
