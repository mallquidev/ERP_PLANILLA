# archivo: entidad_eps.py
from fastapi import APIRouter, Depends, HTTPException, Query
import pyodbc

from database import get_connection
from security import get_current_user

router = APIRouter(
    prefix="/entidad-eps",
    tags=["EntidadEps"],
    dependencies=[Depends(get_current_user)],
)

def _row_to_dict(r):
    return {
        "PKID": r.PKID,
        "IDEntidadEps": r.IDEntidadEps,
        "EntidadEps": r.EntidadEps,
        "PKIDSituacionRegistro": r.PKIDSituacionRegistro,
        "SituacionRegistro": r.SituacionRegistro,
    }

@router.get("/")
def list_entidad_eps(
    ide: int | None = Query(default=None, description="Filtra por IDEntidadEps exacto"),
    nombre: str | None = Query(default=None, description="Filtra por EntidadEps (contiene)"),
    situacion_id: int | None = Query(default=None, description="Filtra por PKIDSituacionRegistro exacto"),
):
    try:
        conn = get_connection()
        cur = conn.cursor()
        sql = """
        SELECT e.PKID, e.IDEntidadEps, e.EntidadEps, e.PKIDSituacionRegistro,
               s.SituacionRegistro
          FROM EntidadEps e
          LEFT JOIN SituacionRegistro s ON e.PKIDSituacionRegistro = s.PKID
         WHERE 1=1
        """
        params = []
        if ide is not None:
            sql += " AND e.IDEntidadEps = ?"
            params.append(ide)
        if nombre:
            sql += " AND e.EntidadEps LIKE ?"
            params.append(f"%{nombre}%")
        if situacion_id is not None:
            sql += " AND e.PKIDSituacionRegistro = ?"
            params.append(situacion_id)
        sql += " ORDER BY e.EntidadEps"

        cur.execute(sql, params)
        return [_row_to_dict(r) for r in cur.fetchall()]
    except pyodbc.Error as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/")
def create_entidad_eps(payload: dict):
    required = ["IDEntidadEps", "EntidadEps", "PKIDSituacionRegistro"]
    for k in required:
        if payload.get(k) in (None, ""):
            raise HTTPException(status_code=422, detail=f"Falta campo requerido: {k}")

    try:
        conn = get_connection()
        cur = conn.cursor()

        # Unicidad de IDEntidadEps
        cur.execute("SELECT 1 FROM EntidadEps WHERE IDEntidadEps = ?", (payload["IDEntidadEps"],))
        if cur.fetchone():
            raise HTTPException(status_code=409, detail="IDEntidadEps ya existe.")

        cur.execute("""
            INSERT INTO EntidadEps (IDEntidadEps, EntidadEps, PKIDSituacionRegistro)
            VALUES (?, ?, ?)
        """, (
            int(payload["IDEntidadEps"]),
            str(payload["EntidadEps"]).strip(),
            int(payload["PKIDSituacionRegistro"]),
        ))
        conn.commit()
        return {"detail": "Creado"}
    except HTTPException:
        raise
    except pyodbc.IntegrityError:
        conn.rollback()
        raise HTTPException(status_code=409, detail="Violación de integridad / llave duplicada.")
    except pyodbc.Error as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{pkid}")
def update_entidad_eps(pkid: int, payload: dict):
    try:
        conn = get_connection()
        cur = conn.cursor()

        # Verifica existencia
        cur.execute("SELECT PKID FROM EntidadEps WHERE PKID = ?", (pkid,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="EntidadEps no encontrada.")

        # Unicidad de IDEntidadEps si cambia
        if payload.get("IDEntidadEps") not in (None, ""):
            cur.execute(
                "SELECT 1 FROM EntidadEps WHERE IDEntidadEps = ? AND PKID <> ?",
                (payload["IDEntidadEps"], pkid),
            )
            if cur.fetchone():
                raise HTTPException(status_code=409, detail="IDEntidadEps ya existe para otra entidad.")

        cur.execute("""
            UPDATE EntidadEps
               SET IDEntidadEps = ?,
                   EntidadEps = ?,
                   PKIDSituacionRegistro = ?
             WHERE PKID = ?
        """, (
            int(payload["IDEntidadEps"]),
            str(payload["EntidadEps"]).strip(),
            int(payload["PKIDSituacionRegistro"]),
            pkid,
        ))
        conn.commit()
        return {"detail": "Actualizado"}
    except HTTPException:
        raise
    except pyodbc.IntegrityError:
        conn.rollback()
        raise HTTPException(status_code=409, detail="Violación de integridad / llave duplicada / FK.")
    except pyodbc.Error as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{pkid}")
def delete_entidad_eps(pkid: int):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("DELETE FROM EntidadEps WHERE PKID = ?", (pkid,))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="EntidadEps no encontrada.")
        conn.commit()
        return {"detail": "Eliminado"}
    except pyodbc.IntegrityError:
        conn.rollback()
        raise HTTPException(status_code=409, detail="No se puede eliminar: está referenciada por otros registros.")
    except pyodbc.Error as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
