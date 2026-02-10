# archivo: estado_civil.py
from fastapi import APIRouter, Depends, HTTPException, Query
import pyodbc

from database import get_connection
from security import get_current_user

router = APIRouter(
    prefix="/estado-civil",
    tags=["EstadoCivil"],
    dependencies=[Depends(get_current_user)],
)

def _row_to_dict(r):
    return {
        "PKID": r.PKID,
        "IDEstadoCivil": r.IDEstadoCivil,
        "EstadoCivil": r.EstadoCivil,
        "PKIDSituacionRegistro": r.PKIDSituacionRegistro,
        "SituacionRegistro": r.SituacionRegistro,
    }

@router.get("/")
def list_estado_civil(
    id_estado: int | None = Query(default=None, description="Filtra por IDEstadoCivil exacto"),
    nombre: str | None = Query(default=None, description="Filtra por EstadoCivil (contiene)"),
    situacion_id: int | None = Query(default=None, description="Filtra por PKIDSituacionRegistro exacto"),
):
    try:
        conn = get_connection()
        cur = conn.cursor()
        sql = """
        SELECT ec.PKID, ec.IDEstadoCivil, ec.EstadoCivil, ec.PKIDSituacionRegistro,
               sr.SituacionRegistro
          FROM EstadoCivil ec
          LEFT JOIN SituacionRegistro sr ON ec.PKIDSituacionRegistro = sr.PKID
         WHERE 1=1
        """
        params = []
        if id_estado is not None:
            sql += " AND ec.IDEstadoCivil = ?"
            params.append(id_estado)
        if nombre:
            sql += " AND ec.EstadoCivil LIKE ?"
            params.append(f"%{nombre}%")
        if situacion_id is not None:
            sql += " AND ec.PKIDSituacionRegistro = ?"
            params.append(situacion_id)
        sql += " ORDER BY ec.IDEstadoCivil"

        cur.execute(sql, params)
        return [_row_to_dict(r) for r in cur.fetchall()]
    except pyodbc.Error as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/")
def create_estado_civil(payload: dict):
    required = ["IDEstadoCivil", "EstadoCivil"]
    for k in required:
        if payload.get(k) in (None, ""):
            raise HTTPException(status_code=422, detail=f"Falta campo requerido: {k}")

    try:
        conn = get_connection()
        cur = conn.cursor()

        # Unicidad IDEstadoCivil
        cur.execute("SELECT 1 FROM EstadoCivil WHERE IDEstadoCivil = ?", (payload["IDEstadoCivil"],))
        if cur.fetchone():
            raise HTTPException(status_code=409, detail="IDEstadoCivil ya existe.")

        cur.execute("""
            INSERT INTO EstadoCivil (IDEstadoCivil, EstadoCivil, PKIDSituacionRegistro)
            VALUES (?, ?, ?)
        """, (
            int(payload["IDEstadoCivil"]),
            str(payload["EstadoCivil"]).strip(),
            int(payload["PKIDSituacionRegistro"]) if payload.get("PKIDSituacionRegistro") not in (None, "") else None,
        ))
        conn.commit()
        return {"detail": "Creado"}
    except HTTPException:
        raise
    except pyodbc.IntegrityError:
        conn.rollback()
        raise HTTPException(status_code=409, detail="Violación de integridad / llave duplicada / FK.")
    except pyodbc.Error as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{pkid}")
def update_estado_civil(pkid: int, payload: dict):
    try:
        conn = get_connection()
        cur = conn.cursor()

        # Existe
        cur.execute("SELECT PKID FROM EstadoCivil WHERE PKID = ?", (pkid,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="EstadoCivil no encontrado.")

        # Unicidad IDEstadoCivil si cambia
        if payload.get("IDEstadoCivil") not in (None, ""):
            cur.execute(
                "SELECT 1 FROM EstadoCivil WHERE IDEstadoCivil = ? AND PKID <> ?",
                (payload["IDEstadoCivil"], pkid),
            )
            if cur.fetchone():
                raise HTTPException(status_code=409, detail="IDEstadoCivil ya existe para otro registro.")

        cur.execute("""
            UPDATE EstadoCivil
               SET IDEstadoCivil = ?,
                   EstadoCivil = ?,
                   PKIDSituacionRegistro = ?
             WHERE PKID = ?
        """, (
            int(payload["IDEstadoCivil"]),
            str(payload["EstadoCivil"]).strip(),
            int(payload["PKIDSituacionRegistro"]) if payload.get("PKIDSituacionRegistro") not in (None, "") else None,
            pkid
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
def delete_estado_civil(pkid: int):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("DELETE FROM EstadoCivil WHERE PKID = ?", (pkid,))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="EstadoCivil no encontrado.")
        conn.commit()
        return {"detail": "Eliminado"}
    except pyodbc.IntegrityError:
        conn.rollback()
        raise HTTPException(status_code=409, detail="No se puede eliminar: hay referencias.")
    except pyodbc.Error as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
