from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import pyodbc
from database import get_connection
from security import get_current_user

router = APIRouter(prefix="/trabajador", tags=["Trabajador"])

class TrabajadorCreate(BaseModel):
    PKIDEmpresa: int
    PKIDSituacionTrabajador: int
    PKIDPersonaNatural: int
    PKIDTipoTrabajador: int
    PKIDCondicionTrabajador: int
    PKIDSituacionRegistro: int
    NombreCompleto: str


@router.post("/")
def crear_trabajador(data: TrabajadorCreate, user: dict = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor()

    try:
        # 
        cursor.execute(
            "SELECT PKID FROM PersonaNatural WHERE PKID = ?",
            data.PKIDPersonaNatural
        )
        if not cursor.fetchone():
            raise HTTPException(status_code=400, detail="PersonaNatural no existe")

        # Obtener nuevo IDTrabajador por empresa
        cursor.execute("""
            SELECT ISNULL(MAX(IDTrabajador),0) + 1
            FROM Trabajador
            WHERE PKIDEmpresa = ?
        """, data.PKIDEmpresa)

        nuevo_id_trabajador = cursor.fetchone()[0]

        
        cursor.execute("""
            INSERT INTO Trabajador (
                IDTrabajador,
                PKIDEmpresa,
                PKIDSituacionTrabajador,
                PKIDPersonaNatural,
                NombreCompleto,
                PKIDTipoTrabajador,
                PKIDCondicionTrabajador,
                PKIDSituacionRegistro
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
            nuevo_id_trabajador,
            data.PKIDEmpresa,
            data.PKIDSituacionTrabajador,
            data.PKIDPersonaNatural,
            data.NombreCompleto,
            data.PKIDTipoTrabajador,
            data.PKIDCondicionTrabajador,
            data.PKIDSituacionRegistro
        )

        conn.commit()

        return {
            "message": "Trabajador registrado correctamente",
            "IDTrabajador": nuevo_id_trabajador
        }

    except pyodbc.IntegrityError as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))

    finally:
        cursor.close()
        conn.close()
