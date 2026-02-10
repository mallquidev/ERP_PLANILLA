# backend/persona_natural_combos.py
from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
import pyodbc

from database import get_connection
from security import get_current_user

router = APIRouter(prefix="/persona-natural-combos", tags=["PersonaNatural Combos"])

def fetch_simple_combo(sql: str):
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute(sql)
        rows = cur.fetchall()
        cols = [c[0] for c in cur.description]
        return [dict(zip(cols, r)) for r in rows]
    finally:
        cur.close()
        conn.close()

@router.get("/tipodoc", response_model=List[Dict[str, Any]])
def combo_tipo_documento(user: dict = Depends(get_current_user)):
    return fetch_simple_combo("SELECT PKID, DocumentoIdentidad AS Nombre FROM dbo.TipoDocumentoIdentidad ORDER BY 2")

@router.get("/sexo", response_model=List[Dict[str, Any]])
def combo_sexo(user: dict = Depends(get_current_user)):
    return fetch_simple_combo("SELECT PKID, Sexo AS Nombre FROM dbo.Sexo ORDER BY 2")

@router.get("/nivel", response_model=List[Dict[str, Any]])
def combo_nivel_instruccion(user: dict = Depends(get_current_user)):
    return fetch_simple_combo("SELECT PKID, NivelInstruccion AS Nombre FROM dbo.NivelInstruccion ORDER BY 2")

@router.get("/profesion", response_model=List[Dict[str, Any]])
def combo_profesion(user: dict = Depends(get_current_user)):
    return fetch_simple_combo("SELECT PKID, Profesion AS Nombre FROM dbo.Profesion ORDER BY 2")

@router.get("/grado", response_model=List[Dict[str, Any]])
def combo_grado(user: dict = Depends(get_current_user)):
    return fetch_simple_combo("SELECT PKID, GradoAcademico AS Nombre FROM dbo.GradoAcademico ORDER BY 2")

@router.get("/nacionalidad", response_model=List[Dict[str, Any]])
def combo_nacionalidad(user: dict = Depends(get_current_user)):
    return fetch_simple_combo("SELECT PKID, Nacionalidad AS Nombre FROM dbo.Nacionalidad ORDER BY 2")

@router.get("/pais", response_model=List[Dict[str, Any]])
def combo_pais(user: dict = Depends(get_current_user)):
    return fetch_simple_combo("SELECT PKID, Pais AS Nombre FROM dbo.Pais ORDER BY 2")

@router.get("/situacion", response_model=List[Dict[str, Any]])
def combo_situacion(user: dict = Depends(get_current_user)):
    return fetch_simple_combo("SELECT PKID, SituacionRegistro AS Nombre FROM dbo.SituacionRegistro ORDER BY 2")
