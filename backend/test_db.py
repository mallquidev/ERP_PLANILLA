from fastapi import APIRouter
from database import get_connection

router = APIRouter()

@router.get("/test-db")
def test_db():
    try:
        conn = get_connection()
        cursor = conn.cursor()

        # Asegúrate de usar el esquema dbo
        cursor.execute("SELECT * FROM Usuario")
        rows = cursor.fetchall()

        # Convertimos cada fila a lista para que FastAPI pueda serializarla a JSON
        result = [list(row) for row in rows]

        cursor.close()
        conn.close()

        return {"success": True, "rows": result}

    except Exception as e:
        return {"success": False, "error": str(e)}
