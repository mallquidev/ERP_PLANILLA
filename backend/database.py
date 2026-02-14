
import pyodbc

def get_connection():
    return pyodbc.connect(
        "DRIVER={ODBC Driver 17 for SQL Server};"
        "SERVER=MORTY\MSSQLSERVER2025;"
        "DATABASE=dbone;"
        "UID=sa;"
        "PWD=coder"
    )
