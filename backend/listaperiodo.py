# D:\payroll_project_3\backend\listaperiodo.py
from fastapi import APIRouter, Depends, HTTPException
import pyodbc
from database import get_connection
from security import get_current_user

router = APIRouter(prefix="/lista-periodo", tags=["lista-periodo"])

@router.get("/")
def listar_periodos(IDEmpresa: int, IDNomina: int, user: dict = Depends(get_current_user)):
    try:
        conn = get_connection()
        cur = conn.cursor()
        # Asumiendo PeriodoPlanilla(PKID, PKIDEmpresa, PKIDNomina, Ano, Mes, SecuenciaAnoMes)
        cur.execute("""
            SELECT p.PKID, p.Ano, p.Mes, p.SecuenciaAnoMes
            FROM PeriodoPlanilla p
            INNER JOIN Empresa e ON e.PKID = p.PKIDEmpresa
            INNER JOIN Nomina n ON n.PKID = p.PKIDNomina
            WHERE e.IDEmpresa = ? AND n.IDNomina = ?
            ORDER BY p.Ano, p.Mes, p.SecuenciaAnoMes
        """, (IDEmpresa, IDNomina))
        rows = cur.fetchall()
        return [
            {
                "PKID": r.PKID,
                "Ano": r.Ano,
                "Mes": r.Mes,
                "SecuenciaAnoMes": r.SecuenciaAnoMes
            }
            for r in rows
        ]
    except pyodbc.Error as ex:
        raise HTTPException(status_code=500, detail=f"SQL error: {ex}")
    finally:
        try:
            cur.close()
            conn.close()
        except:
            pass
