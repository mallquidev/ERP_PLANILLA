from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from database import get_connection
from security import get_current_user

router = APIRouter(prefix="/cargo-empresa", tags=["cargo-empresa"])

class CargoEmpresaIn(BaseModel):
    IDCargoEmpresa: int
    CargoEmpresa: str
    PKIDEmpresa: int
    PKIDSituacionRegistro: int

class CargoEmpresaOut(BaseModel):
    PKID: int
    IDCargoEmpresa: int
    PKIDEmpresa: int
    CargoEmpresa: str
    PKIDSituacionRegistro: int
    SituacionRegistro: Optional[str] = None

def _row_to_dict(row, columns) -> Dict[str, Any]:
    return {col[0]: val for col, val in zip(columns, row)}

@router.get("/", response_model=List[CargoEmpresaOut])
def listar_cargos(
    PKIDEmpresa: int = Query(...),
    user: dict = Depends(get_current_user),
):
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT ce.PKID, ce.IDCargoEmpresa, ce.PKIDEmpresa, ce.CargoEmpresa,
                   ce.PKIDSituacionRegistro, sr.SituacionRegistro
            FROM dbo.CargoEmpresa ce
            LEFT JOIN dbo.SituacionRegistro sr ON sr.PKID = ce.PKIDSituacionRegistro
            WHERE ce.PKIDEmpresa = ?
            ORDER BY ce.IDCargoEmpresa
        """, (PKIDEmpresa,))
        rows = cur.fetchall()
        if not rows:
            return []
        cols = cur.description
        out = []
        for r in rows:
            d = _row_to_dict(r, cols)
            out.append({
                "PKID": d["PKID"],
                "IDCargoEmpresa": d["IDCargoEmpresa"],
                "PKIDEmpresa": d["PKIDEmpresa"],
                "CargoEmpresa": d["CargoEmpresa"],
                "PKIDSituacionRegistro": d["PKIDSituacionRegistro"],
                "SituacionRegistro": d.get("SituacionRegistro"),
            })
        return out
    finally:
        cur.close()
        conn.close()

@router.post("/", response_model=Dict[str, Any])
def crear_cargo(item: CargoEmpresaIn, user: dict = Depends(get_current_user)):
    """
    Evitamos SCOPE_IDENTITY() para no toparnos con 'No results. Previous SQL was not a query.'
    Insertamos y luego leemos PKID por la clave única (IDCargoEmpresa, PKIDEmpresa).
    """
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            INSERT INTO dbo.CargoEmpresa (IDCargoEmpresa, PKIDEmpresa, CargoEmpresa, PKIDSituacionRegistro)
            VALUES (?, ?, ?, ?)
        """, (item.IDCargoEmpresa, item.PKIDEmpresa, item.CargoEmpresa, item.PKIDSituacionRegistro))

        # Buscar el PKID por la clave única
        cur.execute("""
            SELECT TOP(1) PKID
            FROM dbo.CargoEmpresa
            WHERE IDCargoEmpresa = ? AND PKIDEmpresa = ?
            ORDER BY PKID DESC
        """, (item.IDCargoEmpresa, item.PKIDEmpresa))
        row = cur.fetchone()
        if not row:
            conn.rollback()
            raise HTTPException(status_code=500, detail="No se pudo recuperar el PKID luego del INSERT.")
        new_id = int(row[0])

        conn.commit()
        return {"message": "Creado", "PKID": new_id}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        # Devolver detalle claro al frontend
        raise HTTPException(status_code=400, detail=f"Error SQL al crear CargoEmpresa: {e}")
    finally:
        cur.close()
        conn.close()

@router.put("/{pkid}", response_model=Dict[str, Any])
def actualizar_cargo(pkid: int, item: CargoEmpresaIn, user: dict = Depends(get_current_user)):
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            UPDATE dbo.CargoEmpresa
            SET IDCargoEmpresa = ?, PKIDEmpresa = ?, CargoEmpresa = ?, PKIDSituacionRegistro = ?
            WHERE PKID = ?
        """, (item.IDCargoEmpresa, item.PKIDEmpresa, item.CargoEmpresa, item.PKIDSituacionRegistro, pkid))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="No existe el registro")
        conn.commit()
        return {"message": "Actualizado"}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cur.close()
        conn.close()

@router.delete("/{pkid}", response_model=Dict[str, Any])
def eliminar_cargo(pkid: int, user: dict = Depends(get_current_user)):
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM dbo.CargoEmpresa WHERE PKID = ?", (pkid,))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="No existe el registro")
        conn.commit()
        return {"message": "Eliminado"}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cur.close()
        conn.close()
