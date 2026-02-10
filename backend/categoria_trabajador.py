#backend/categoria_trabajador.py
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict, Any
from database import get_connection
from security import get_current_user

router = APIRouter(prefix="/categoria-trabajador", tags=["categoria-trabajador"])

# ---------- Models ----------
class CategoriaTrabajadorIn(BaseModel):
    IDCategoriaTrabajador: int
    CategoriaTrabajador: str
    PKIDSituacionRegistro: int

class CategoriaTrabajadorOut(BaseModel):
    PKID: int
    IDCategoriaTrabajador: int
    CategoriaTrabajador: str
    PKIDSituacionRegistro: int
    SituacionRegistro: str | None = None

# ---------- List ----------
@router.get("/", response_model=List[CategoriaTrabajadorOut])
def listar(user: dict = Depends(get_current_user)):
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT c.PKID, c.IDCategoriaTrabajador, c.CategoriaTrabajador,
                   c.PKIDSituacionRegistro, s.SituacionRegistro
            FROM dbo.CategoriaTrabajador c
            LEFT JOIN dbo.SituacionRegistro s ON s.PKID = c.PKIDSituacionRegistro
            ORDER BY c.IDCategoriaTrabajador
        """)
        rows = cur.fetchall() or []
        cols = [d[0] for d in cur.description] if cur.description else []
        out: List[Dict[str, Any]] = []
        for row in rows:
            d = dict(zip(cols, row))
            out.append({
                "PKID": d["PKID"],
                "IDCategoriaTrabajador": d["IDCategoriaTrabajador"],
                "CategoriaTrabajador": d["CategoriaTrabajador"],
                "PKIDSituacionRegistro": d["PKIDSituacionRegistro"],
                "SituacionRegistro": d.get("SituacionRegistro"),
            })
        return out
    finally:
        cur.close()
        conn.close()

# ---------- Create ----------
@router.post("/", response_model=Dict[str, Any])
def crear(item: CategoriaTrabajadorIn, user: dict = Depends(get_current_user)):
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            INSERT INTO dbo.CategoriaTrabajador
                (IDCategoriaTrabajador, CategoriaTrabajador, PKIDSituacionRegistro)
            VALUES (?, ?, ?)
        """, (item.IDCategoriaTrabajador, item.CategoriaTrabajador, item.PKIDSituacionRegistro))

        # Recuperar PKID de forma robusta por la clave única (IDCategoriaTrabajador)
        cur.execute("""
            SELECT TOP(1) PKID
            FROM dbo.CategoriaTrabajador
            WHERE IDCategoriaTrabajador = ?
            ORDER BY PKID DESC
        """, (item.IDCategoriaTrabajador,))
        row = cur.fetchone()
        if not row:
            conn.rollback()
            raise HTTPException(status_code=500, detail="No se pudo recuperar el PKID después del INSERT.")
        new_id = int(row[0])

        conn.commit()
        return {"message": "Creado", "PKID": new_id}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=f"Error SQL al crear: {e}")
    finally:
        cur.close()
        conn.close()

# ---------- Update ----------
@router.put("/{pkid}", response_model=Dict[str, Any])
def actualizar(pkid: int, item: CategoriaTrabajadorIn, user: dict = Depends(get_current_user)):
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            UPDATE dbo.CategoriaTrabajador
            SET IDCategoriaTrabajador = ?, CategoriaTrabajador = ?, PKIDSituacionRegistro = ?
            WHERE PKID = ?
        """, (item.IDCategoriaTrabajador, item.CategoriaTrabajador, item.PKIDSituacionRegistro, pkid))
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

# ---------- Delete ----------
@router.delete("/{pkid}", response_model=Dict[str, Any])
def eliminar(pkid: int, user: dict = Depends(get_current_user)):
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM dbo.CategoriaTrabajador WHERE PKID = ?", (pkid,))
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
