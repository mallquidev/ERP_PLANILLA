
from fastapi import APIRouter, HTTPException, Form
from jose import jwt
import pyodbc
from database import get_connection

router = APIRouter(prefix="/auth")
SECRET_KEY = "secret"
ALGORITHM = "HS256"

@router.post("/login")
def login(username: str = Form(...), password: str = Form(...)):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT Usuario, Rol FROM Usuario WHERE Usuario=? AND Password=?", username, password)
    user = cursor.fetchone()
    if not user:
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    token = jwt.encode({"sub": user.Usuario, "rol": user.Rol}, SECRET_KEY, algorithm=ALGORITHM)
    return {"access_token": token, "token_type": "bearer"}
