from database import get_connection

def execute_stored_procedure(CIA_CODCIA, ANO_CODANO, MES_CODMES, TPL_CODTPL, PPE_CORPPE, P_CODAUX):
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("{CALL dbo.SP_PAYROLL_VIDEO (?, ?, ?, ?, ?, ?)}",
                   (CIA_CODCIA, ANO_CODANO, MES_CODMES, TPL_CODTPL, PPE_CORPPE, P_CODAUX))

    while True:
        if cursor.description:
            columns = [column[0] for column in cursor.description]
            rows = cursor.fetchall()
            if rows:
                results = [dict(zip(columns, row)) for row in rows]
                break
        if not cursor.nextset():
            results = [{"message": "El procedimiento no devolvió resultados."}]
            break

    cursor.close()
    conn.close()
    return results
