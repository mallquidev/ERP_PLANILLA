from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import pyodbc
from database import get_connection
from security import get_current_user

router = APIRouter(prefix="/situacion", tags=["SituacionRegistro"])

# Modelo de entrada/salida
class SituacionRegistroModel(BaseModel):
    IDSituacionRegistro: int
    SituacionRegistro: str

@router.get("/", response_model=list[SituacionRegistroModel])
def listar_situaciones(user: dict = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT IDSituacionRegistro, SituacionRegistro FROM SituacionRegistro")
        rows = cursor.fetchall()
        result = [{"IDSituacionRegistro": row[0], "SituacionRegistro": row[1]} for row in rows]
        return result
    finally:
        cursor.close()
        conn.close()

@router.post("/")
def crear_situacion(data: SituacionRegistroModel, user: dict = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO SituacionRegistro (IDSituacionRegistro, SituacionRegistro) VALUES (?, ?)",
                       data.IDSituacionRegistro, data.SituacionRegistro)
        conn.commit()
        return {"message": "Situación registrada exitosamente"}
    except pyodbc.IntegrityError:
        raise HTTPException(status_code=400, detail="El IDSituacionRegistro ya existe")
    finally:
        cursor.close()
        conn.close()

@router.put("/{id}")
def actualizar_situacion(id: int, data: SituacionRegistroModel, user: dict = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE SituacionRegistro SET SituacionRegistro = ? WHERE IDSituacionRegistro = ?",
                       data.SituacionRegistro, id)
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Situación no encontrada")
        conn.commit()
        return {"message": "Situación actualizada exitosamente"}
    finally:
        cursor.close()
        conn.close()

@router.delete("/{id}")
def eliminar_situacion(id: int, user: dict = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM SituacionRegistro WHERE IDSituacionRegistro = ?", id)
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Situación no encontrada")
        conn.commit()
        return {"message": "Situación eliminada exitosamente"}
    finally:
        cursor.close()
        conn.close()
