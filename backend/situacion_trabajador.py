from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List
import pyodbc
from database import get_connection
from security import get_current_user

router = APIRouter(prefix="/situacion_trabajador", tags=["SituacionTrabajador"])

# ----- Pydantic Models -----

class SituacionTrabajadorCreate(BaseModel):
    IDSituacionTrabajador: int
    SituacionTrabajador: str
    PKIDSituacionRegistro: int

class SituacionTrabajadorOut(SituacionTrabajadorCreate):
    PKID: int

# ----- CREATE -----

@router.post("/", response_model=SituacionTrabajadorOut)
def create_situacion_trabajador(
    data: SituacionTrabajadorCreate, user: dict = Depends(get_current_user)
):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        # Insertar el nuevo registro
        cursor.execute("""
            INSERT INTO SituacionTrabajador (
                IDSituacionTrabajador, SituacionTrabajador, PKIDSituacionRegistro
            ) VALUES (?, ?, ?)
        """, data.IDSituacionTrabajador, data.SituacionTrabajador, data.PKIDSituacionRegistro)
        conn.commit()

        # Obtener el registro insertado (con PKID)
        cursor.execute("""
            SELECT TOP 1 PKID, IDSituacionTrabajador, SituacionTrabajador, PKIDSituacionRegistro
            FROM SituacionTrabajador
            WHERE IDSituacionTrabajador = ?
            ORDER BY PKID DESC
        """, data.IDSituacionTrabajador)
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Registro insertado no encontrado")
        columns = [col[0] for col in cursor.description]
        return dict(zip(columns, row))

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

# ----- READ -----

@router.get("/", response_model=List[SituacionTrabajadorOut])
def get_all_situacion_trabajador(user: dict = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT PKID, IDSituacionTrabajador, SituacionTrabajador, PKIDSituacionRegistro
            FROM SituacionTrabajador
        """)
        rows = cursor.fetchall()
        columns = [col[0] for col in cursor.description]
        return [dict(zip(columns, row)) for row in rows]
    finally:
        cursor.close()
        conn.close()

# ----- UPDATE -----

@router.put("/{pkid}", response_model=SituacionTrabajadorOut)
def update_situacion_trabajador(
    pkid: int, data: SituacionTrabajadorCreate, user: dict = Depends(get_current_user)
):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            UPDATE SituacionTrabajador
            SET IDSituacionTrabajador = ?, SituacionTrabajador = ?, PKIDSituacionRegistro = ?
            WHERE PKID = ?
        """, data.IDSituacionTrabajador, data.SituacionTrabajador, data.PKIDSituacionRegistro, pkid)
        conn.commit()

        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Registro no encontrado")

        return {
            "PKID": pkid,
            "IDSituacionTrabajador": data.IDSituacionTrabajador,
            "SituacionTrabajador": data.SituacionTrabajador,
            "PKIDSituacionRegistro": data.PKIDSituacionRegistro,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

# ----- DELETE -----

@router.delete("/{pkid}")
def delete_situacion_trabajador(pkid: int, user: dict = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM SituacionTrabajador WHERE PKID = ?", pkid)
        conn.commit()
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Registro no encontrado")
        return {"message": "Eliminado correctamente"}
    finally:
        cursor.close()
        conn.close()
