# archivo: empresa.py
from fastapi import APIRouter, Depends, HTTPException, Query
import pyodbc

from database import get_connection
from security import get_current_user

router = APIRouter(prefix="/empresa", tags=["Empresa"], dependencies=[Depends(get_current_user)])

def _row_to_dict(r):
    return {
        "PKID": r.PKID,
        "IDEmpresa": r.IDEmpresa,
        "RazonSocial": r.RazonSocial,
        "NumeroRuc": r.NumeroRuc,
        "PKIDRegimenTributario": r.PKIDRegimenTributario,
        "PKIDSituacionRegistro": r.PKIDSituacionRegistro,
        "PKIDSectorEconomico": r.PKIDSectorEconomico,
        "Direccion": r.Direccion,
        "RegistroPatronal": r.RegistroPatronal,
        "PKIDOtraEmpresa": r.PKIDOtraEmpresa,
        "Siglas": r.Siglas,
        # Nombres (joins)
        "RegimenTributario": r.RegimenTributario,
        "SectorEconomico": r.SectorEconomico,
        "SituacionRegistro": r.SituacionRegistro,
        "OtraEmpresa": r.OtraEmpresa,
    }

@router.get("/")
def list_empresas(
    ide: int | None = Query(default=None, description="Filtra por IDEmpresa exacto"),
    razon: str | None = Query(default=None, description="Filtra por RazonSocial (contiene)"),
    ruc: str | None = Query(default=None, description="Filtra por RUC (contiene)"),
):
    try:
        conn = get_connection()
        cur = conn.cursor()

        base = """
        SELECT e.PKID, e.IDEmpresa, e.RazonSocial, e.NumeroRuc,
               e.PKIDRegimenTributario, e.PKIDSituacionRegistro, e.PKIDSectorEconomico,
               e.Direccion, e.RegistroPatronal, e.PKIDOtraEmpresa, e.Siglas,
               rt.RegimenTributario, se.SectorEconomico, sr.SituacionRegistro,
               oe.RazonSocial AS OtraEmpresa
        FROM Empresa e
        LEFT JOIN RegimenTributario rt ON e.PKIDRegimenTributario = rt.PKID
        LEFT JOIN SectorEconomico se   ON e.PKIDSectorEconomico  = se.PKID
        LEFT JOIN SituacionRegistro sr ON e.PKIDSituacionRegistro = sr.PKID
        LEFT JOIN Empresa oe           ON e.PKIDOtraEmpresa = oe.PKID
        WHERE 1=1
        """
        params = []
        if ide is not None:
            base += " AND e.IDEmpresa = ?"
            params.append(ide)
        if razon:
            base += " AND e.RazonSocial LIKE ?"
            params.append(f"%{razon}%")
        if ruc:
            base += " AND e.NumeroRuc LIKE ?"
            params.append(f"%{ruc}%")
        base += " ORDER BY e.RazonSocial"

        cur.execute(base, params)
        rows = cur.fetchall()
        return [_row_to_dict(r) for r in rows]
    except pyodbc.Error as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/")
def create_empresa(payload: dict):
    required = [
        "IDEmpresa", "RazonSocial", "NumeroRuc",
        "PKIDRegimenTributario", "PKIDSituacionRegistro", "PKIDSectorEconomico",
        "Direccion"
    ]
    for k in required:
        if payload.get(k) in (None, ""):
            raise HTTPException(status_code=422, detail=f"Falta campo requerido: {k}")

    try:
        conn = get_connection()
        cur = conn.cursor()

        # Valida unicidad IDEmpresa
        cur.execute("SELECT 1 FROM Empresa WHERE IDEmpresa = ?", (payload["IDEmpresa"],))
        if cur.fetchone():
            raise HTTPException(status_code=409, detail="IDEmpresa ya existe.")

        cur.execute("""
            INSERT INTO Empresa (
                IDEmpresa, RazonSocial, NumeroRuc,
                PKIDRegimenTributario, PKIDSituacionRegistro, PKIDSectorEconomico,
                Direccion, RegistroPatronal, PKIDOtraEmpresa, Siglas
            ) VALUES (?,?,?,?,?,?,?,?,?,?)
        """, (
            int(payload["IDEmpresa"]),
            str(payload["RazonSocial"]).strip(),
            str(payload["NumeroRuc"]).strip(),
            int(payload["PKIDRegimenTributario"]),
            int(payload["PKIDSituacionRegistro"]),
            int(payload["PKIDSectorEconomico"]),
            str(payload["Direccion"]).strip(),
            (str(payload["RegistroPatronal"]).strip() if payload.get("RegistroPatronal") not in (None, "") else None),
            (int(payload["PKIDOtraEmpresa"]) if payload.get("PKIDOtraEmpresa") not in (None, "", 0) else None),
            (str(payload["Siglas"]).strip() if payload.get("Siglas") not in (None, "") else None),
        ))
        conn.commit()
        return {"detail": "Creado"}
    except HTTPException:
        raise
    except pyodbc.IntegrityError as e:
        conn.rollback()
        raise HTTPException(status_code=409, detail="Violación de integridad / llave duplicada.")
    except pyodbc.Error as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{pkid}")
def update_empresa(pkid: int, payload: dict):
    try:
        conn = get_connection()
        cur = conn.cursor()

        # Verifica existencia
        cur.execute("SELECT PKID FROM Empresa WHERE PKID = ?", (pkid,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Empresa no encontrada.")

        # Valida unicidad IDEmpresa si lo cambian
        if payload.get("IDEmpresa") not in (None, ""):
            cur.execute("SELECT 1 FROM Empresa WHERE IDEmpresa = ? AND PKID <> ?", (payload["IDEmpresa"], pkid))
            if cur.fetchone():
                raise HTTPException(status_code=409, detail="IDEmpresa ya existe para otra empresa.")

        cur.execute("""
            UPDATE Empresa
               SET IDEmpresa = ?,
                   RazonSocial = ?,
                   NumeroRuc = ?,
                   PKIDRegimenTributario = ?,
                   PKIDSituacionRegistro = ?,
                   PKIDSectorEconomico = ?,
                   Direccion = ?,
                   RegistroPatronal = ?,
                   PKIDOtraEmpresa = ?,
                   Siglas = ?
             WHERE PKID = ?
        """, (
            int(payload["IDEmpresa"]),
            str(payload["RazonSocial"]).strip(),
            str(payload["NumeroRuc"]).strip(),
            int(payload["PKIDRegimenTributario"]),
            int(payload["PKIDSituacionRegistro"]),
            int(payload["PKIDSectorEconomico"]),
            str(payload["Direccion"]).strip(),
            (str(payload["RegistroPatronal"]).strip() if payload.get("RegistroPatronal") not in (None, "") else None),
            (int(payload["PKIDOtraEmpresa"]) if payload.get("PKIDOtraEmpresa") not in (None, "", 0) else None),
            (str(payload["Siglas"]).strip() if payload.get("Siglas") not in (None, "") else None),
            pkid
        ))
        conn.commit()
        return {"detail": "Actualizado"}
    except HTTPException:
        raise
    except pyodbc.IntegrityError:
        conn.rollback()
        raise HTTPException(status_code=409, detail="Violación de integridad / llave duplicada.")
    except pyodbc.Error as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{pkid}")
def delete_empresa(pkid: int):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("DELETE FROM Empresa WHERE PKID = ?", (pkid,))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Empresa no encontrada.")
        conn.commit()
        return {"detail": "Eliminado"}
    except pyodbc.IntegrityError:
        conn.rollback()
        raise HTTPException(status_code=409, detail="No se puede eliminar: está referenciada por otros registros.")
    except pyodbc.Error as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
