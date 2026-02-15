from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, conint, confloat
from typing import Optional, List
import pyodbc

from database import get_connection
from security import get_current_user

router = APIRouter(prefix="/afp", tags=["AFP"])

# ---------------------------
# Pydantic models
# ---------------------------
class AfpIn(BaseModel):
    IDAfp: conint(gt=0)
    Afp: str
    IndicadorPublicoPrivado: str
    PKIDCuentaContable: Optional[int] = None
    PKIDSituacionRegistro: conint(gt=0)

class AfpOut(BaseModel):
    PKID: int
    IDAfp: int
    Afp: str
    IndicadorPublicoPrivado: str
    PKIDCuentaContable: Optional[int] = None
    CuentaContable: Optional[str] = None
    PKIDSituacionRegistro: int
    SituacionRegistro: Optional[str] = None

class PeriodoIn(BaseModel):
    Ano: conint(ge=1900, le=2100)
    Mes: conint(ge=1, le=12)
    PKIDConceptoPlanilla: conint(gt=0)
    PorcentajeTrabajador: confloat(ge=0)
    PorcentajeMixta: confloat(ge=0)
    PKIDSituacionRegistro: conint(gt=0)
    TopeAfp: Optional[confloat(ge=0)] = None

class PeriodoOut(BaseModel):
    PKID: int
    PKIDAfp: int
    Ano: int
    Mes: int
    PKIDConceptoPlanilla: int
    ConceptoPlanilla: str
    PorcentajeTrabajador: float
    PorcentajeMixta: float
    PKIDSituacionRegistro: int
    SituacionRegistro: str
    TopeAfp: Optional[float] = None

# ---------------------------
# Helpers
# ---------------------------
def rows_to_dicts(cursor, rows):
    cols = [c[0] for c in cursor.description]
    return [dict(zip(cols, r)) for r in rows]

def http400(e: Exception, fallback="Error en la operación"):
    msg = str(e)
    if "Violation" in msg or "constraint" in msg.lower():
        raise HTTPException(status_code=400, detail=msg)
    raise HTTPException(status_code=400, detail=msg or fallback)

# ---------------------------
# CABECERA: AFP
# ---------------------------
@router.get("/", response_model=List[AfpOut])
def listar_afp(user: dict = Depends(get_current_user)):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT
                a.PKID,
                a.IDAfp,
                a.Afp,
                a.IndicadorPublicoPrivado,
                a.PKIDCuentaContable,
                cc.CuentaContable,
                a.PKIDSituacionRegistro,
                sr.SituacionRegistro
            FROM Afp a
            LEFT JOIN CuentaContable cc ON cc.PKID = a.PKIDCuentaContable
            LEFT JOIN SituacionRegistro sr ON sr.PKID = a.PKIDSituacionRegistro
            ORDER BY a.IDAfp
        """)
        data = rows_to_dicts(cur, cur.fetchall())
        cur.close(); conn.close()
        return data
    except Exception as e:
        http400(e, "No se pudo listar AFP")

@router.post("/", response_model=AfpOut)
def crear_afp(body: AfpIn, user: dict = Depends(get_current_user)):
    try:
        conn = get_connection()
        cur = conn.cursor()

        # -------------------------------
        # Insertar AFP y devolver PKID
        # -------------------------------
        cur.execute("""
            INSERT INTO Afp (IDAfp, Afp, IndicadorPublicoPrivado, PKIDCuentaContable, PKIDSituacionRegistro)
            OUTPUT INSERTED.PKID
            VALUES (?, ?, ?, ?, ?)
        """, (
            body.IDAfp,
            body.Afp,
            body.IndicadorPublicoPrivado,
            body.PKIDCuentaContable,
            body.PKIDSituacionRegistro
        ))

        pkid = cur.fetchone()[0]
        conn.commit()

        # -------------------------------
        # Obtener la AFP creada con joins
        # -------------------------------
        cur.execute("""
            SELECT
                a.PKID,
                a.IDAfp,
                a.Afp,
                a.IndicadorPublicoPrivado,
                a.PKIDCuentaContable,
                cc.CuentaContable,
                a.PKIDSituacionRegistro,
                sr.SituacionRegistro
            FROM Afp a
            LEFT JOIN CuentaContable cc ON cc.PKID = a.PKIDCuentaContable
            LEFT JOIN SituacionRegistro sr ON sr.PKID = a.PKIDSituacionRegistro
            WHERE a.PKID = ?
        """, (pkid,))

        row = cur.fetchone()
        cur.close()
        conn.close()

        if not row:
            raise HTTPException(status_code=400, detail="Error al leer la AFP creada.")

        cols = [
            "PKID",
            "IDAfp",
            "Afp",
            "IndicadorPublicoPrivado",
            "PKIDCuentaContable",
            "CuentaContable",
            "PKIDSituacionRegistro",
            "SituacionRegistro"
        ]
        return dict(zip(cols, row))

    except Exception as e:
        http400(e, "No se pudo crear la AFP")

@router.put("/{pkid}", response_model=AfpOut)
def actualizar_afp(pkid: int, body: AfpIn, user: dict = Depends(get_current_user)):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            UPDATE Afp
               SET IDAfp = ?,
                   Afp = ?,
                   IndicadorPublicoPrivado = ?,
                   PKIDCuentaContable = ?,
                   PKIDSituacionRegistro = ?
             WHERE PKID = ?
        """, (body.IDAfp, body.Afp, body.IndicadorPublicoPrivado, body.PKIDCuentaContable, body.PKIDSituacionRegistro, pkid))
        if cur.rowcount == 0:
            cur.close(); conn.close()
            raise HTTPException(status_code=404, detail="AFP no encontrada")
        conn.commit()

        # Devuelve con joins
        cur = conn.cursor()
        cur.execute("""
            SELECT
                a.PKID,
                a.IDAfp,
                a.Afp,
                a.IndicadorPublicoPrivado,
                a.PKIDCuentaContable,
                cc.CuentaContable,
                a.PKIDSituacionRegistro,
                sr.SituacionRegistro
            FROM Afp a
            LEFT JOIN CuentaContable cc ON cc.PKID = a.PKIDCuentaContable
            LEFT JOIN SituacionRegistro sr ON sr.PKID = a.PKIDSituacionRegistro
            WHERE a.PKID = ?
        """, (pkid,))
        row = cur.fetchone()
        cur.close(); conn.close()
        cols = ["PKID","IDAfp","Afp","IndicadorPublicoPrivado","PKIDCuentaContable","CuentaContable","PKIDSituacionRegistro","SituacionRegistro"]
        return dict(zip(cols, row))
    except Exception as e:
        http400(e, "No se pudo actualizar la AFP")

@router.delete("/{pkid}")
def eliminar_afp(pkid: int, user: dict = Depends(get_current_user)):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("DELETE FROM Afp WHERE PKID=?", (pkid,))
        if cur.rowcount == 0:
            cur.close(); conn.close()
            raise HTTPException(status_code=404, detail="AFP no encontrada")
        conn.commit()
        cur.close(); conn.close()
        return {"detail": "AFP eliminada"}
    except Exception as e:
        http400(e, "No se pudo eliminar la AFP")

# ---------------------------
# DETALLE: AFPPeriodo
# ---------------------------
@router.get("/{pkid}/periodos", response_model=List[PeriodoOut])
def listar_periodos(
    pkid: int,
    Ano: int = Query(...),
    Mes: int = Query(...),
    user: dict = Depends(get_current_user)
):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT
              p.PKID,
              p.PKIDAfp,
              p.Ano,
              p.Mes,
              p.PKIDConceptoPlanilla,
              cp.ConceptoPlanilla,
              p.PorcentajeTrabajador,
              p.PorcentajeMixta,
              p.PKIDSituacionRegistro,
              sr.SituacionRegistro,
              p.TopeAfp
            FROM AfpPeriodo p
            INNER JOIN ConceptoPlanilla cp ON cp.PKID = p.PKIDConceptoPlanilla
            INNER JOIN SituacionRegistro sr ON sr.PKID = p.PKIDSituacionRegistro
            WHERE p.PKIDAfp = ?
              AND p.Ano = ?
              AND p.Mes = ?
            ORDER BY cp.ConceptoPlanilla
        """, (pkid, Ano, Mes))
        data = rows_to_dicts(cur, cur.fetchall())
        cur.close(); conn.close()
        return data
    except Exception as e:
        http400(e, "No se pudo listar los periodos")

@router.post("/{pkid}/periodos", response_model=PeriodoOut)
def crear_periodo(pkid: int, body: PeriodoIn, user: dict = Depends(get_current_user)):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO AfpPeriodo
              (PKIDAfp, Ano, Mes, PKIDConceptoPlanilla, PorcentajeTrabajador, PorcentajeMixta, PKIDSituacionRegistro, TopeAfp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?);
            SELECT SCOPE_IDENTITY();
        """, (
            pkid,
            body.Ano,
            body.Mes,
            body.PKIDConceptoPlanilla,
            body.PorcentajeTrabajador,
            body.PorcentajeMixta,
            body.PKIDSituacionRegistro,
            body.TopeAfp
        ))
        new_id = cur.fetchone()[0]
        conn.commit()

        # Devolver con descripciones
        cur = conn.cursor()
        cur.execute("""
            SELECT
              p.PKID,
              p.PKIDAfp,
              p.Ano,
              p.Mes,
              p.PKIDConceptoPlanilla,
              cp.ConceptoPlanilla,
              p.PorcentajeTrabajador,
              p.PorcentajeMixta,
              p.PKIDSituacionRegistro,
              sr.SituacionRegistro,
              p.TopeAfp
            FROM AfpPeriodo p
            INNER JOIN ConceptoPlanilla cp ON cp.PKID = p.PKIDConceptoPlanilla
            INNER JOIN SituacionRegistro sr ON sr.PKID = p.PKIDSituacionRegistro
            WHERE p.PKID = ?
        """, (new_id,))
        row = cur.fetchone()
        cur.close(); conn.close()
        if not row:
            raise HTTPException(status_code=400, detail="Error al leer el periodo creado.")
        cols = ["PKID","PKIDAfp","Ano","Mes","PKIDConceptoPlanilla","ConceptoPlanilla","PorcentajeTrabajador","PorcentajeMixta","PKIDSituacionRegistro","SituacionRegistro","TopeAfp"]
        return dict(zip(cols, row))
    except Exception as e:
        http400(e, "No se pudo crear el periodo")

@router.put("/periodos/{periodo_id}", response_model=PeriodoOut)
def actualizar_periodo(periodo_id: int, body: PeriodoIn, user: dict = Depends(get_current_user)):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            UPDATE AfpPeriodo
               SET Ano = ?,
                   Mes = ?,
                   PKIDConceptoPlanilla = ?,
                   PorcentajeTrabajador = ?,
                   PorcentajeMixta = ?,
                   PKIDSituacionRegistro = ?,
                   TopeAfp = ?
             WHERE PKID = ?
        """, (
            body.Ano, body.Mes, body.PKIDConceptoPlanilla,
            body.PorcentajeTrabajador, body.PorcentajeMixta,
            body.PKIDSituacionRegistro, body.TopeAfp,
            periodo_id
        ))
        if cur.rowcount == 0:
            cur.close(); conn.close()
            raise HTTPException(status_code=404, detail="Periodo no encontrado")
        conn.commit()

        cur = conn.cursor()
        cur.execute("""
            SELECT
              p.PKID,
              p.PKIDAfp,
              p.Ano,
              p.Mes,
              p.PKIDConceptoPlanilla,
              cp.ConceptoPlanilla,
              p.PorcentajeTrabajador,
              p.PorcentajeMixta,
              p.PKIDSituacionRegistro,
              sr.SituacionRegistro,
              p.TopeAfp
            FROM AfpPeriodo p
            INNER JOIN ConceptoPlanilla cp ON cp.PKID = p.PKIDConceptoPlanilla
            INNER JOIN SituacionRegistro sr ON sr.PKID = p.PKIDSituacionRegistro
            WHERE p.PKID = ?
        """, (periodo_id,))
        row = cur.fetchone()
        cur.close(); conn.close()
        cols = ["PKID","PKIDAfp","Ano","Mes","PKIDConceptoPlanilla","ConceptoPlanilla","PorcentajeTrabajador","PorcentajeMixta","PKIDSituacionRegistro","SituacionRegistro","TopeAfp"]
        return dict(zip(cols, row))
    except Exception as e:
        http400(e, "No se pudo actualizar el periodo")

@router.delete("/periodos/{periodo_id}")
def eliminar_periodo(periodo_id: int, user: dict = Depends(get_current_user)):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("DELETE FROM AfpPeriodo WHERE PKID=?", (periodo_id,))
        if cur.rowcount == 0:
            cur.close(); conn.close()
            raise HTTPException(status_code=404, detail="Periodo no encontrado")
        conn.commit()
        cur.close(); conn.close()
        return {"detail": "Periodo eliminado"}
    except Exception as e:
        http400(e, "No se pudo eliminar el periodo")
