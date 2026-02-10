from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field
import pyodbc
from database import get_connection
from security import get_current_user

router = APIRouter(prefix="/area", tags=["area"])

class AreaIn(BaseModel):
    PKIDEmpresa: int = Field(..., description="Empresa de la que depende el área")
    IDArea: int = Field(..., description="Código interno de área (único por empresa)")
    Area: str = Field(..., max_length=100)
    AreaAbreviado: str = Field(..., max_length=10)
    PKIDSituacionRegistro: int = Field(..., description="PKID de SituacionRegistro")

class AreaOut(BaseModel):
    PKID: int
    PKIDEmpresa: int
    IDArea: int
    Area: str
    AreaAbreviado: str
    PKIDSituacionRegistro: int
    SituacionRegistro: str | None = None  # join legible

def _row_to_dict(cursor, row):
    return {cursor.description[i][0]: row[i] for i in range(len(cursor.description))}

@router.get("/", response_model=list[AreaOut])
def listar_areas(
    PKIDEmpresa: int = Query(..., description="Filtrar por empresa"),
    user: dict = Depends(get_current_user)
):
    conn = get_connection()
    cur = conn.cursor()
    try:
        sql = """
        SELECT a.PKID, a.PKIDEmpresa, a.IDArea, a.Area, a.AreaAbreviado, a.PKIDSituacionRegistro,
               sr.SituacionRegistro
        FROM dbo.Area a
        LEFT JOIN dbo.SituacionRegistro sr ON sr.PKID = a.PKIDSituacionRegistro
        WHERE a.PKIDEmpresa = ?
        ORDER BY a.IDArea
        """
        cur.execute(sql, PKIDEmpresa)
        rows = cur.fetchall()
        return [_row_to_dict(cur, r) for r in rows]
    finally:
        cur.close()
        conn.close()

@router.get("/{pkid}", response_model=AreaOut)
def obtener_area(pkid: int, user: dict = Depends(get_current_user)):
    conn = get_connection()
    cur = conn.cursor()
    try:
        sql = """
        SELECT a.PKID, a.PKIDEmpresa, a.IDArea, a.Area, a.AreaAbreviado, a.PKIDSituacionRegistro,
               sr.SituacionRegistro
        FROM dbo.Area a
        LEFT JOIN dbo.SituacionRegistro sr ON sr.PKID = a.PKIDSituacionRegistro
        WHERE a.PKID = ?
        """
        cur.execute(sql, pkid)
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Área no encontrada")
        return _row_to_dict(cur, row)
    finally:
        cur.close()
        conn.close()

@router.post("/", response_model=AreaOut)
def crear_area(data: AreaIn, user: dict = Depends(get_current_user)):
    conn = get_connection()
    cur = conn.cursor()
    try:
        # Validar unicidad (PKIDEmpresa, IDArea)
        cur.execute("""
            SELECT 1 FROM dbo.Area WHERE PKIDEmpresa = ? AND IDArea = ?
        """, data.PKIDEmpresa, data.IDArea)
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="Ya existe un Área con ese ID en la empresa")

        cur.execute("""
            INSERT INTO dbo.Area (PKIDEmpresa, IDArea, Area, AreaAbreviado, PKIDSituacionRegistro)
            VALUES (?, ?, ?, ?, ?);
            SELECT SCOPE_IDENTITY();
        """, data.PKIDEmpresa, data.IDArea, data.Area, data.AreaAbreviado, data.PKIDSituacionRegistro)
        new_id = cur.fetchone()[0]
        conn.commit()

        # devolver con join
        cur.execute("""
        SELECT a.PKID, a.PKIDEmpresa, a.IDArea, a.Area, a.AreaAbreviado, a.PKIDSituacionRegistro,
               sr.SituacionRegistro
        FROM dbo.Area a
        LEFT JOIN dbo.SituacionRegistro sr ON sr.PKID = a.PKIDSituacionRegistro
        WHERE a.PKID = ?
        """, new_id)
        row = cur.fetchone()
        return _row_to_dict(cur, row)
    finally:
        cur.close()
        conn.close()

@router.put("/{pkid}", response_model=AreaOut)
def actualizar_area(pkid: int, data: AreaIn, user: dict = Depends(get_current_user)):
    conn = get_connection()
    cur = conn.cursor()
    try:
        # Existe?
        cur.execute("SELECT PKID FROM dbo.Area WHERE PKID = ?", pkid)
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Área no encontrada")

        # Unicidad si (PKIDEmpresa, IDArea) cambia y choca con otro
        cur.execute("""
            SELECT PKID
            FROM dbo.Area
            WHERE PKIDEmpresa = ? AND IDArea = ? AND PKID <> ?
        """, data.PKIDEmpresa, data.IDArea, pkid)
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="Ya existe otro Área con ese ID en la empresa")

        cur.execute("""
            UPDATE dbo.Area
            SET PKIDEmpresa = ?, IDArea = ?, Area = ?, AreaAbreviado = ?, PKIDSituacionRegistro = ?
            WHERE PKID = ?
        """, data.PKIDEmpresa, data.IDArea, data.Area, data.AreaAbreviado, data.PKIDSituacionRegistro, pkid)
        conn.commit()

        # devolver actualizado con join
        cur.execute("""
        SELECT a.PKID, a.PKIDEmpresa, a.IDArea, a.Area, a.AreaAbreviado, a.PKIDSituacionRegistro,
               sr.SituacionRegistro
        FROM dbo.Area a
        LEFT JOIN dbo.SituacionRegistro sr ON sr.PKID = a.PKIDSituacionRegistro
        WHERE a.PKID = ?
        """, pkid)
        row = cur.fetchone()
        return _row_to_dict(cur, row)
    finally:
        cur.close()
        conn.close()

@router.delete("/{pkid}")
def eliminar_area(pkid: int, user: dict = Depends(get_current_user)):
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT 1 FROM dbo.Area WHERE PKID = ?", pkid)
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Área no encontrada")

        cur.execute("DELETE FROM dbo.Area WHERE PKID = ?", pkid)
        conn.commit()
        return {"message": "Área eliminada"}
    finally:
        cur.close()
        conn.close()
