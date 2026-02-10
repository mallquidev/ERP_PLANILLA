from database import get_connection

try:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT @@VERSION")
    row = cursor.fetchone()
    print("Conexión exitosa")
    print(row[0])
    conn.close()
except Exception as e:
    print("Error de conexión:")
    print(e)
