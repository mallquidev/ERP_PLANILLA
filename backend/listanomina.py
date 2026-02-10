from fastapi import APIRouter, Depends, HTTPException
import pyodbc
from database import get_connection
from security import get_current_user

router = APIRouter(prefix="/lista-nomina", tags=["lista-nomina"])

@router.get("/")
def listar_nominas(user: dict = Depends(get_current_user)):
    """
    Devuelve TODAS las nóminas (no filtra por empresa).
    Estructura esperada de la tabla Nomina: (PKID, IDNomina, Nomina, ...)
    """
    conn = None
    cur = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT PKID, IDNomina, Nomina
            FROM Nomina
            ORDER BY IDNomina
        """)
        rows = cur.fetchall()
        return [
            {"PKID": r.PKID, "IDNomina": r.IDNomina, "Nomina": r.Nomina}
            for r in rows
        ]
    except pyodbc.Error as ex:
        raise HTTPException(status_code=500, detail=f"SQL error: {ex}")
    finally:
        try:
            if cur: cur.close()
            if conn: conn.close()
        except:
            pass
