# backend/dashboard.py
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Dict, List, Any
import pyodbc
from database import get_connection
from security import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

def fetch(query: str, params: tuple) -> List[dict]:
    conn = get_connection(); cur = conn.cursor()
    try:
        cur.execute(query, params)
        cols = [c[0] for c in cur.description]
        return [dict(zip(cols, r)) for r in cur.fetchall()]
    finally:
        cur.close(); conn.close()

def build_series(rows: List[dict], key_field: str, value_field: str) -> Dict[str, Any]:
    """
    Estructura para gráficos apilados: labels = meses, series = [{label, data[mes]}]
    rows: [{Ano, Mes, key_field, value_field}]
    """
    # Meses presentes (1..12, ordenados)
    months = sorted(sorted({int(r["mes"]) for r in rows}))
    # Agrupar por key_field (ConceptoPlanilla o NombreCompleto)
    groups: Dict[str, Dict[int, float]] = {}
    for r in rows:
        key = str(r[key_field])
        mes = int(r["mes"])
        valor = float(r[value_field] or 0)
        groups.setdefault(key, {})
        groups[key][mes] = groups[key].get(mes, 0) + valor

    series = []
    for key, per_month in groups.items():
        data = [per_month.get(m, 0.0) for m in months]
        series.append({"label": key, "data": data})

    return {"labels": months, "series": series}

@router.get("/ingresos-por-concepto")
def ingresos_por_concepto(
    empresa: int = Query(..., alias="IDEmpresa"),
    ano: int = Query(..., alias="Ano"),
    user: dict = Depends(get_current_user)
):
    """
    Gráfico 1: Ingreso Mensual por Conceptos
    """
    q = """
    SELECT ano, mes, ConceptoPlanilla, SUM(Trabajador) AS Ingresos
    FROM RevisaPlanillaCalculada
    WHERE IdEmpresa = ? AND Ano = ?
      AND IDConceptoPlanilla BETWEEN 1000 AND 2999
      AND IDTrabajador <> 9999999
    GROUP BY ano, mes, ConceptoPlanilla
    ORDER BY ano, mes, ConceptoPlanilla
    """
    try:
        rows = fetch(q, (empresa, ano))
        return build_series(rows, key_field="ConceptoPlanilla", value_field="Ingresos")
    except pyodbc.Error as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/ingresos-por-trabajador")
def ingresos_por_trabajador(
    empresa: int = Query(..., alias="IDEmpresa"),
    ano: int = Query(..., alias="Ano"),
    top: int = Query(10, ge=1, le=50, description="Limitar a los N trabajadores con mayor ingreso"),
    user: dict = Depends(get_current_user)
):
    """
    Gráfico 2: Ingreso Mensual por Trabajador (top N por suma anual)
    """
    q = """
    SELECT ano, mes, NombreCompleto, SUM(Trabajador) AS Ingresos
    FROM RevisaPlanillaCalculada
    WHERE IdEmpresa = ? AND Ano = ?
      AND IDConceptoPlanilla BETWEEN 1000 AND 2999
      AND IDTrabajador <> 9999999
    GROUP BY ano, mes, NombreCompleto
    ORDER BY ano, mes, NombreCompleto
    """
    try:
        rows = fetch(q, (empresa, ano))
        # Top N por total anual
        totales: Dict[str, float] = {}
        for r in rows:
            k = str(r["NombreCompleto"])
            totales[k] = totales.get(k, 0.0) + float(r["Ingresos"] or 0)
        top_keys = {k for k, _ in sorted(totales.items(), key=lambda x: x[1], reverse=True)[:top]}
        rows_top = [r for r in rows if r["NombreCompleto"] in top_keys]
        return build_series(rows_top, key_field="NombreCompleto", value_field="Ingresos")
    except pyodbc.Error as e:
        raise HTTPException(status_code=500, detail=str(e))
