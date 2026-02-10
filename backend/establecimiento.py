# archivo: establecimiento.py
from fastapi import APIRouter, Depends, HTTPException, Query
import pyodbc

from database import get_connection
from security import get_current_user

router = APIRouter(
    prefix="/establecimiento",
    tags=["Establecimiento"],
    dependencies=[Depends(get_current_user)],
)

def _row_to_dict(r):
    return {
        "PKID": r.PKID,
        "PKIDEmpresa": r.PKIDEmpresa,
        "RazonSocial": r.RazonSocial,
        "IDEstablecimiento": r.IDEstablecimiento,
        "NombreEstablecimiento": r.NombreEstablecimiento,
        "PKIDTipoEstablecimiento": r.PKIDTipoEstablecimiento,
        "TipoEstablecimiento": r.TipoEstablecimiento,
        "IndicadorCentroDeRiesgoCheck": bool(r.IndicadorCentroDeRiesgoCheck),
        "TasaEstablecimiento": float(r.TasaEstablecimiento) if r.TasaEstablecimiento is not None else None,
        "PKIDSituacionRegistro": r.PKIDSituacionRegistro,
        "SituacionRegistro": r.SituacionRegistro,
    }

@router.get("/")
def list_establecimientos(
    empresaId: int = Query(..., description="PKIDEmpresa (obligatorio)"),
    id_est: int | None = Query(default=None, description="Filtra por IDEstablecimiento exacto"),
    nombre: str | None = Query(default=None, description="Filtra por NombreEstablecimiento (contiene)"),
    tipo_id: int | None = Query(default=None, description="Filtra por PKIDTipoEstablecimiento"),
    situacion_id: int | None = Query(default=None, description="Filtra por PKIDSituacionRegistro"),
):
    try:
        conn = get_connection()
        cur = conn.cursor()
        sql = """
        SELECT e.PKID, e.PKIDEmpresa, em.RazonSocial, e.IDEstablecimiento,
               e.NombreEstablecimiento, e.PKIDTipoEstablecimiento, te.TipoEstablecimiento,
               e.IndicadorCentroDeRiesgoCheck, e.TasaEstablecimiento,
               e.PKIDSituacionRegistro, sr.SituacionRegistro
          FROM Establecimiento e
          INNER JOIN Empresa em ON e.PKIDEmpresa = em.PKID
          INNER JOIN TipoEstablecimiento te ON e.PKIDTipoEstablecimiento = te.PKID
          LEFT  JOIN SituacionRegistro sr ON e.PKIDSituacionRegistro = sr.PKID
         WHERE e.PKIDEmpresa = ?
        """
        params = [empresaId]
        if id_est is not None:
            sql += " AND e.IDEstablecimiento = ?"
            params.append(id_est)
        if nombre:
            sql += " AND e.NombreEstablecimiento LIKE ?"
            params.append(f"%{nombre}%")
        if tipo_id is not None:
            sql += " AND e.PKIDTipoEstablecimiento = ?"
            params.append(tipo_id)
        if situacion_id is not None:
            sql += " AND e.PKIDSituacionRegistro = ?"
            params.append(situacion_id)
        sql += " ORDER BY e.IDEstablecimiento"

        cur.execute(sql, params)
        return [_row_to_dict(r) for r in cur.fetchall()]
    except pyodbc.Error as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/")
def create_establecimiento(payload: dict):
    required = [
        "PKIDEmpresa", "IDEstablecimiento", "NombreEstablecimiento",
        "PKIDTipoEstablecimiento", "IndicadorCentroDeRiesgoCheck"
    ]
    for k in required:
        if payload.get(k) in (None, ""):
            raise HTTPException(status_code=422, detail=f"Falta campo requerido: {k}")

    try:
        conn = get_connection()
        cur = conn.cursor()

        # Unicidad (PKIDEmpresa, IDEstablecimiento)
        cur.execute("""
            SELECT 1 FROM Establecimiento
             WHERE PKIDEmpresa = ? AND IDEstablecimiento = ?
        """, (int(payload["PKIDEmpresa"]), int(payload["IDEstablecimiento"])))
        if cur.fetchone():
            raise HTTPException(status_code=409, detail="La combinación (Empresa, IDEstablecimiento) ya existe.")

        cur.execute("""
            INSERT INTO Establecimiento (
                PKIDEmpresa, IDEstablecimiento, NombreEstablecimiento,
                PKIDTipoEstablecimiento, IndicadorCentroDeRiesgoCheck,
                TasaEstablecimiento, PKIDSituacionRegistro
            )
            VALUES (?,?,?,?,?,?,?)
        """, (
            int(payload["PKIDEmpresa"]),
            int(payload["IDEstablecimiento"]),
            str(payload["NombreEstablecimiento"]).strip(),
            int(payload["PKIDTipoEstablecimiento"]),
            1 if bool(payload["IndicadorCentroDeRiesgoCheck"]) else 0,
            float(payload["TasaEstablecimiento"]) if payload.get("TasaEstablecimiento") not in (None, "") else None,
            int(payload["PKIDSituacionRegistro"]) if payload.get("PKIDSituacionRegistro") not in (None, "") else None,
        ))
        conn.commit()
        return {"detail": "Creado"}
    except HTTPException:
        raise
    except pyodbc.IntegrityError:
        conn.rollback()
        raise HTTPException(status_code=409, detail="Violación de integridad / FK / llave duplicada.")
    except pyodbc.Error as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{pkid}")
def update_establecimiento(pkid: int, payload: dict):
    try:
        conn = get_connection()
        cur = conn.cursor()

        # Existe
        cur.execute("SELECT PKID, PKIDEmpresa, IDEstablecimiento FROM Establecimiento WHERE PKID = ?", (pkid,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Establecimiento no encontrado.")

        # Validación unicidad si cambian IDEstablecimiento o PKIDEmpresa
        _empresa = int(payload.get("PKIDEmpresa", row.PKIDEmpresa))
        _idEst   = int(payload.get("IDEstablecimiento", row.IDEstablecimiento))
        cur.execute("""
            SELECT 1 FROM Establecimiento
             WHERE PKIDEmpresa = ? AND IDEstablecimiento = ? AND PKID <> ?
        """, (_empresa, _idEst, pkid))
        if cur.fetchone():
            raise HTTPException(status_code=409, detail="La combinación (Empresa, IDEstablecimiento) ya existe para otro registro.")

        cur.execute("""
            UPDATE Establecimiento
               SET PKIDEmpresa = ?,
                   IDEstablecimiento = ?,
                   NombreEstablecimiento = ?,
                   PKIDTipoEstablecimiento = ?,
                   IndicadorCentroDeRiesgoCheck = ?,
                   TasaEstablecimiento = ?,
                   PKIDSituacionRegistro = ?
             WHERE PKID = ?
        """, (
            _empresa,
            _idEst,
            str(payload["NombreEstablecimiento"]).strip(),
            int(payload["PKIDTipoEstablecimiento"]),
            1 if bool(payload["IndicadorCentroDeRiesgoCheck"]) else 0,
            float(payload["TasaEstablecimiento"]) if payload.get("TasaEstablecimiento") not in (None, "") else None,
            int(payload["PKIDSituacionRegistro"]) if payload.get("PKIDSituacionRegistro") not in (None, "") else None,
            pkid
        ))
        conn.commit()
        return {"detail": "Actualizado"}
    except HTTPException:
        raise
    except pyodbc.IntegrityError:
        conn.rollback()
        raise HTTPException(status_code=409, detail="Violación de integridad / FK.")
    except pyodbc.Error as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{pkid}")
def delete_establecimiento(pkid: int):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("DELETE FROM Establecimiento WHERE PKID = ?", (pkid,))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Establecimiento no encontrado.")
        conn.commit()
        return {"detail": "Eliminado"}
    except pyodbc.IntegrityError:
        conn.rollback()
        raise HTTPException(status_code=409, detail="No se puede eliminar: hay referencias.")
    except pyodbc.Error as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
