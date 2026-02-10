#backend/banco.py
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import Optional, List
import pyodbc

from database import get_connection
from security import get_current_user

router = APIRouter(prefix="/banco", tags=["banco"])

# ---------- Pydantic models ----------

class BancoIn(BaseModel):
    IDBanco: int
    Banco: str
    SiglasBanco: Optional[str] = None
    PKIDSituacionRegistro: Optional[int] = None

class BancoOut(BancoIn):
    PKID: int
    SituacionRegistro: Optional[str] = None

class BancoCuentaIn(BaseModel):
    # En el frontend enviarás IDEmpresa (global). El backend lo traducirá a PKID interno.
    IDEmpresa: int
    PKIDMoneda: int
    NumeroCuenta: str
    NumeroCuenta2: Optional[str] = None
    PKIDSituacionRegistro: Optional[int] = None
    PKIDTipoCuentaBanco: Optional[int] = None

class BancoCuentaOut(BancoCuentaIn):
    PKID: int
    PKIDBanco: int
    # etiquetas legibles
    Moneda: Optional[str] = None
    TipoCuentaBanco: Optional[str] = None
    SituacionRegistro: Optional[str] = None
    Empresa: Optional[str] = None


# ---------- Helpers ----------

def _empresa_pkid_from_ide(conn, ide_empresa: int) -> int:
    cur = conn.cursor()
    cur.execute("SELECT PKID FROM dbo.Empresa WHERE IDEmpresa = ?", ide_empresa)
    row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=400, detail=f"IDEmpresa {ide_empresa} no existe.")
    return int(row[0])

# ---------- Banco (cabecera) ----------

@router.get("/", response_model=List[BancoOut])
def listar_bancos(user: dict = Depends(get_current_user)):
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT b.PKID, b.IDBanco, b.Banco, b.SiglasBanco, b.PKIDSituacionRegistro,
                   sr.SituacionRegistro
            FROM dbo.Banco b
            LEFT JOIN dbo.SituacionRegistro sr ON sr.PKID = b.PKIDSituacionRegistro
            ORDER BY b.IDBanco
        """)
        rows = cur.fetchall()
        out = []
        for r in rows:
            out.append({
                "PKID": r[0], "IDBanco": r[1], "Banco": r[2], "SiglasBanco": r[3],
                "PKIDSituacionRegistro": r[4],
                "SituacionRegistro": r[5],
            })
        return out
    finally:
        cur.close()
        conn.close()

@router.post("/", response_model=BancoOut)
def crear_banco(banco: BancoIn, user: dict = Depends(get_current_user)):
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            INSERT INTO dbo.Banco (IDBanco, Banco, SiglasBanco, PKIDSituacionRegistro)
            OUTPUT INSERTED.PKID
            VALUES (?, ?, ?, ?)
        """, banco.IDBanco, banco.Banco, banco.SiglasBanco, banco.PKIDSituacionRegistro)
        pkid = cur.fetchone()[0]
        conn.commit()
        return {
            "PKID": pkid,
            **banco.dict(),
            "SituacionRegistro": None
        }
    except pyodbc.IntegrityError as e:
        conn.rollback()
        # contempla violaciones de UQ IDBanco o FK Situación
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cur.close()
        conn.close()

@router.put("/{pkid}", response_model=BancoOut)
def actualizar_banco(pkid: int, banco: BancoIn, user: dict = Depends(get_current_user)):
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            UPDATE dbo.Banco
            SET IDBanco = ?, Banco = ?, SiglasBanco = ?, PKIDSituacionRegistro = ?
            WHERE PKID = ?
        """, banco.IDBanco, banco.Banco, banco.SiglasBanco, banco.PKIDSituacionRegistro, pkid)
        if cur.rowcount == 0:
            conn.rollback()
            raise HTTPException(status_code=404, detail="Banco no encontrado.")
        conn.commit()
        return {
            "PKID": pkid,
            **banco.dict(),
            "SituacionRegistro": None
        }
    except pyodbc.IntegrityError as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cur.close()
        conn.close()

@router.delete("/{pkid}")
def eliminar_banco(pkid: int, user: dict = Depends(get_current_user)):
    conn = get_connection()
    cur = conn.cursor()
    try:
        # si hay cuentas dependientes, SQL Server levantará error por FK (correcto)
        cur.execute("DELETE FROM dbo.Banco WHERE PKID = ?", pkid)
        if cur.rowcount == 0:
            conn.rollback()
            raise HTTPException(status_code=404, detail="Banco no encontrado.")
        conn.commit()
        return {"ok": True}
    finally:
        cur.close()
        conn.close()

# ---------- BancoCuenta (detalle) ----------

@router.get("/{pkid_banco}/cuentas", response_model=List[BancoCuentaOut])
def listar_cuentas(
    pkid_banco: int,
    IDEmpresa: int = Query(..., description="IDEmpresa (global)"),
    user: dict = Depends(get_current_user)
):
    conn = get_connection()
    cur = conn.cursor()
    try:
        empresa_pkid = _empresa_pkid_from_ide(conn, IDEmpresa)

        cur.execute("""
            SELECT bc.PKID, bc.PKIDEmpresa, bc.PKIDBanco, bc.PKIDMoneda, bc.NumeroCuenta, bc.NumeroCuenta2,
                   bc.PKIDSituacionRegistro, bc.PKIDTipoCuentaBanco,
                   e.RazonSocial,
                   m.Moneda,
                   t.TipoCuentaBanco,
                   sr.SituacionRegistro
            FROM dbo.BancoCuenta bc
            INNER JOIN dbo.Empresa e ON e.PKID = bc.PKIDEmpresa
            LEFT JOIN dbo.Moneda m ON m.PKID = bc.PKIDMoneda
            LEFT JOIN dbo.TipoCuentaBanco t ON t.PKID = bc.PKIDTipoCuentaBanco
            LEFT JOIN dbo.SituacionRegistro sr ON sr.PKID = bc.PKIDSituacionRegistro
            WHERE bc.PKIDBanco = ? AND bc.PKIDEmpresa = ?
            ORDER BY bc.PKID DESC
        """, pkid_banco, empresa_pkid)
        rows = cur.fetchall()
        out = []
        for r in rows:
            out.append({
                "PKID": r[0],
                "IDEmpresa": IDEmpresa,  # devolvemos IDEmpresa (no PKID) para el front
                "PKIDBanco": r[2],
                "PKIDMoneda": r[3],
                "NumeroCuenta": r[4],
                "NumeroCuenta2": r[5],
                "PKIDSituacionRegistro": r[6],
                "PKIDTipoCuentaBanco": r[7],
                "Empresa": r[8],
                "Moneda": r[9],
                "TipoCuentaBanco": r[10],
                "SituacionRegistro": r[11],
            })
        return out
    finally:
        cur.close()
        conn.close()

@router.post("/{pkid_banco}/cuentas", response_model=BancoCuentaOut)
def crear_cuenta(
    pkid_banco: int,
    cuenta: BancoCuentaIn,
    user: dict = Depends(get_current_user)
):
    conn = get_connection()
    cur = conn.cursor()
    try:
        empresa_pkid = _empresa_pkid_from_ide(conn, cuenta.IDEmpresa)
        cur.execute("""
            INSERT INTO dbo.BancoCuenta
            (PKIDEmpresa, PKIDBanco, PKIDMoneda, NumeroCuenta, NumeroCuenta2,
             PKIDSituacionRegistro, PKIDTipoCuentaBanco)
            OUTPUT INSERTED.PKID
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, empresa_pkid, pkid_banco, cuenta.PKIDMoneda, cuenta.NumeroCuenta,
             cuenta.NumeroCuenta2, cuenta.PKIDSituacionRegistro, cuenta.PKIDTipoCuentaBanco)
        new_id = cur.fetchone()[0]
        conn.commit()
        return {
            "PKID": new_id,
            "IDEmpresa": cuenta.IDEmpresa,
            "PKIDBanco": pkid_banco,
            **cuenta.dict(),
            "Empresa": None, "Moneda": None, "TipoCuentaBanco": None, "SituacionRegistro": None
        }
    except pyodbc.IntegrityError as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cur.close()
        conn.close()

@router.put("/cuentas/{pkid_cuenta}", response_model=BancoCuentaOut)
def actualizar_cuenta(
    pkid_cuenta: int,
    cuenta: BancoCuentaIn,
    user: dict = Depends(get_current_user)
):
    conn = get_connection()
    cur = conn.cursor()
    try:
        empresa_pkid = _empresa_pkid_from_ide(conn, cuenta.IDEmpresa)
        cur.execute("""
            UPDATE dbo.BancoCuenta
            SET PKIDEmpresa = ?, PKIDMoneda = ?, NumeroCuenta = ?, NumeroCuenta2 = ?,
                PKIDSituacionRegistro = ?, PKIDTipoCuentaBanco = ?
            WHERE PKID = ?
        """, empresa_pkid, cuenta.PKIDMoneda, cuenta.NumeroCuenta, cuenta.NumeroCuenta2,
             cuenta.PKIDSituacionRegistro, cuenta.PKIDTipoCuentaBanco, pkid_cuenta)
        if cur.rowcount == 0:
            conn.rollback()
            raise HTTPException(status_code=404, detail="Cuenta no encontrada.")
        conn.commit()
        return {
            "PKID": pkid_cuenta,
            "PKIDBanco": 0,  # no lo conocemos aquí; lo omite el front
            **cuenta.dict(),
            "Empresa": None, "Moneda": None, "TipoCuentaBanco": None, "SituacionRegistro": None
        }
    except pyodbc.IntegrityError as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cur.close()
        conn.close()

@router.delete("/cuentas/{pkid_cuenta}")
def eliminar_cuenta(pkid_cuenta: int, user: dict = Depends(get_current_user)):
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM dbo.BancoCuenta WHERE PKID = ?", pkid_cuenta)
        if cur.rowcount == 0:
            conn.rollback()
            raise HTTPException(status_code=404, detail="Cuenta no encontrada.")
        conn.commit()
        return {"ok": True}
    finally:
        cur.close()
        conn.close()
