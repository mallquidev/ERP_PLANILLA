# backend/reports.py
from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse, HTMLResponse
from typing import Optional, List, Tuple
import io
import csv
import os
from datetime import datetime

import pyodbc
from database import get_connection
from security import get_current_user

# XLSX (opcional)
try:
    from openpyxl import Workbook
    HAS_OPENPYXL = True
except Exception:
    HAS_OPENPYXL = False

# PDF (opcional, con diseño)
try:
    from reportlab.lib.pagesizes import A4, landscape
    from reportlab.lib import colors
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import (
        SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
    )
    from reportlab.lib.units import mm
    HAS_REPORTLAB = True
except Exception:
    HAS_REPORTLAB = False


router = APIRouter(prefix="/reports", tags=["Reports"])

# ----------- Ajustes de marca / diseño -----------
COMPANY_NAME  = "Mi Empresa S.A.C."
PRIMARY_COLOR = colors.HexColor("#1F4E79")  # azul corporativo
HEADER_BG     = colors.HexColor("#E9F1F8")
ROW_ALT_BG    = colors.HexColor("#FAFAFA")
LOGO_PATH     = os.path.join(os.path.dirname(__file__), "static", "logo.png")  # opcional

BASE_QUERY = """
SELECT
    PKID,
    IDConceptoPlanilla,
    ConceptoPlanilla,
    ConceptoAbreviado,
    TipoConcepto,
    TipoConceptoGasto,
    TipoHoraDia,
    IndicadorSubsidioCheck,
    IndicadorCuentaCorrienteCheck,
    IndicadorDescuentoJudicialCheck,
    IndicadorAfpCheck,
    IndicadorScrtSaludCheck,
    IndicadorScrtPensionCheck,
    IndicadorAporteEssaludCheck,
    IndicadoAporteSenatiCheck,
    IndicadorAporteSCRTCheck,
    IndicadorAporteVidaCheck,
    IndicadorExclusionCostosCheck,
    PKIDPlameConcepto,
    PKIDSituacionRegistro
FROM dbo.ConceptoPlanilla
WHERE 1=1
"""

def fetch_conceptos(tipo_concepto: Optional[int]) -> Tuple[List[str], list]:
    conn = get_connection()
    cur = conn.cursor()
    try:
        q = BASE_QUERY
        params: list = []
        if tipo_concepto is not None:
            q += " AND TipoConcepto = ?"
            params.append(tipo_concepto)
        q += " ORDER BY IDConceptoPlanilla"
        cur.execute(q, params)
        cols = [c[0] for c in cur.description]
        rows = cur.fetchall()
        return cols, rows
    finally:
        cur.close()
        conn.close()


@router.get("/conceptos")
def conceptos_report(
    formato: str = Query("json", enum=["json", "csv", "xlsx", "html", "pdf"]),
    tipo_concepto: Optional[int] = Query(None, description="Filtro por TipoConcepto"),
    user: dict = Depends(get_current_user),
):
    cols, rows = fetch_conceptos(tipo_concepto)

    # ---------- JSON ----------
    if formato == "json":
        data = [dict(zip(cols, r)) for r in rows]
        return JSONResponse(content={"columns": cols, "data": data})

    # ---------- CSV ----------
    if formato == "csv":
        buf = io.StringIO()
        writer = csv.writer(buf)
        writer.writerow(cols)
        for r in rows:
            writer.writerow(list(r))
        buf.seek(0)
        headers = {"Content-Disposition": 'attachment; filename="conceptos.csv"'}
        return StreamingResponse(iter([buf.getvalue()]), media_type="text/csv", headers=headers)

    # ---------- XLSX ----------
    if formato == "xlsx":
        if not HAS_OPENPYXL:
            raise HTTPException(status_code=500, detail="openpyxl no está instalado")
        wb = Workbook()
        ws = wb.active
        ws.title = "Conceptos"
        ws.append(cols)
        for r in rows:
            ws.append(list(r))
        out = io.BytesIO()
        wb.save(out)
        out.seek(0)
        headers = {"Content-Disposition": 'attachment; filename="conceptos.xlsx"'}
        return StreamingResponse(
            out,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers=headers,
        )

    # ---------- HTML ----------
    if formato == "html":
        thead = "<tr>" + "".join(f"<th>{c}</th>" for c in cols) + "</tr>"
        trs = "\n".join(
            "<tr>" + "".join(f"<td>{'' if v is None else v}</td>" for v in r) + "</tr>"
            for r in rows
        )
        html = f"""
        <!doctype html>
        <html><head><meta charset="utf-8">
        <title>Reporte de Conceptos</title>
        <style>
          body {{ font-family: Arial, sans-serif; padding: 16px }}
          table {{ border-collapse: collapse; width: 100%; font-size: 12px }}
          th, td {{ border: 1px solid #ccc; padding: 6px 8px }}
          th {{ background: #f5f5f5 }}
        </style>
        </head><body>
          <h3>Reporte de Conceptos</h3>
          <p>Filtro TipoConcepto: {'' if tipo_concepto is None else tipo_concepto}</p>
          <table><thead>{thead}</thead><tbody>{trs}</tbody></table>
        </body></html>
        """
        return HTMLResponse(content=html)

    # ---------- PDF (corporativo, columnas reducidas) ----------
    if formato == "pdf":
        if not HAS_REPORTLAB:
            raise HTTPException(status_code=500, detail="reportlab no está instalado")

        wanted_cols = [
            "IDConceptoPlanilla",
            "ConceptoPlanilla",
            "ConceptoAbreviado",
            "TipoConcepto",
            "TipoConceptoGasto",
            "TipoHoraDia",
        ]
        selected = [c for c in wanted_cols if c in cols]
        if not selected:
            raise HTTPException(status_code=400, detail="Las columnas solicitadas no existen en el resultado.")
        idx_map = [cols.index(c) for c in selected]

        # Estilos
        styles = getSampleStyleSheet()
        p_small = ParagraphStyle(
            "small",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=8.5,
            leading=10,
            spaceAfter=0,
        )
        p_small_bold = ParagraphStyle(
            "small_bold",
            parent=p_small,
            fontName="Helvetica-Bold"
        )
        title_style = ParagraphStyle(
            "title",
            parent=styles["Title"],
            textColor=PRIMARY_COLOR,
            fontSize=18,
            leading=22
        )

        # Encabezado / pie
        gen_at = datetime.now().strftime("%Y-%m-%d %H:%M")
        filtro_txt = f"TipoConcepto: {'' if tipo_concepto is None else tipo_concepto}"

        def header_footer(canvas, doc):
            canvas.saveState()
            # header bar
            canvas.setFillColor(HEADER_BG)
            canvas.rect(doc.leftMargin, doc.height + doc.topMargin - 14*mm, doc.width, 12*mm, fill=1, stroke=0)
            # logo (opcional)
            x = doc.leftMargin + 2*mm
            y = doc.height + doc.topMargin - 12*mm
            if os.path.exists(LOGO_PATH):
                try:
                    canvas.drawImage(LOGO_PATH, x, y, width=22*mm, height=8*mm, preserveAspectRatio=True, mask='auto')
                except Exception:
                    pass
            # company & title
            canvas.setFillColor(PRIMARY_COLOR)
            canvas.setFont("Helvetica-Bold", 12)
            canvas.drawString(doc.leftMargin + 26*mm, doc.height + doc.topMargin - 6*mm, COMPANY_NAME)
            canvas.setFont("Helvetica", 9)
            canvas.setFillColor(colors.black)
            canvas.drawString(doc.leftMargin + 26*mm, doc.height + doc.topMargin - 11*mm, "Reporte de Conceptos (PDF)")

            # footer
            canvas.setStrokeColor(colors.HexColor("#DDDDDD"))
            canvas.line(doc.leftMargin, doc.bottomMargin - 4*mm, doc.leftMargin + doc.width, doc.bottomMargin - 4*mm)
            canvas.setFont("Helvetica", 8)
            canvas.setFillColor(colors.grey)
            canvas.drawString(doc.leftMargin, doc.bottomMargin - 10*mm, f"Generado: {gen_at}   |   {filtro_txt}")
            canvas.drawRightString(doc.leftMargin + doc.width, doc.bottomMargin - 10*mm, f"Página {doc.page}")
            canvas.restoreState()

        # Construcción del contenido
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=landscape(A4),
            leftMargin=16*mm,
            rightMargin=16*mm,
            topMargin=22*mm,     # deja espacio para header
            bottomMargin=18*mm,  # deja espacio para footer
        )

        elements: List = []
        elements.append(Spacer(1, 4*mm))

        # Cabecera textual dentro del cuerpo (opcional)
        elements.append(Paragraph("Reporte de Conceptos (PDF reducido)", title_style))
        elements.append(Paragraph(f"Columnas: {', '.join(selected)}", p_small))
        elements.append(Paragraph(f"Filtro {filtro_txt}", p_small))
        elements.append(Spacer(1, 4*mm))

        # Datos: usa Paragraph para columnas de texto que pueden ser largas
        data: List[List] = []
        # encabezados
        header_row = [Paragraph(col, p_small_bold) for col in selected]
        data.append(header_row)
        # filas
        for r in rows:
            row_vals = []
            for i, col_name in zip(idx_map, selected):
                val = "" if r[i] is None else r[i]
                if col_name in ("ConceptoPlanilla", "ConceptoAbreviado"):
                    row_vals.append(Paragraph(str(val), p_small))
                else:
                    row_vals.append(Paragraph(str(val), p_small))
            data.append(row_vals)

        # Anchos de columna: proporcionales
        # Puedes ajustar proporciones si quieres dar más espacio a las descripciones
        # p.ej: [0.9, 2.2, 1.6, 0.9, 0.9, 0.9]
        proportions = [0.9, 2.2, 1.6, 0.9, 0.9, 0.9]
        if len(selected) == 6:
            total_prop = sum(proportions)
            col_widths = [(doc.width * p / total_prop) for p in proportions]
        else:
            col_widths = [doc.width / len(selected)] * len(selected)

        tbl = Table(data, colWidths=col_widths, repeatRows=1)
        tbl.setStyle(TableStyle([
            ("BACKGROUND", (0,0), (-1,0), HEADER_BG),
            ("TEXTCOLOR", (0,0), (-1,0), colors.black),
            ("LINEBELOW", (0,0), (-1,0), 0.6, PRIMARY_COLOR),
            ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
            ("FONTSIZE", (0,0), (-1,-1), 8.5),
            ("LEADING", (0,0), (-1,-1), 10),
            ("ALIGN", (0,0), (-1,-1), "LEFT"),
            ("GRID", (0,0), (-1,-1), 0.25, colors.HexColor("#DDDDDD")),
            ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, ROW_ALT_BG]),
            ("VALIGN", (0,0), (-1,-1), "TOP"),
            ("LEFTPADDING", (0,0), (-1,-1), 4),
            ("RIGHTPADDING", (0,0), (-1,-1), 4),
            ("TOPPADDING", (0,0), (-1,-1), 3),
            ("BOTTOMPADDING", (0,0), (-1,-1), 3),
        ]))

        elements.append(tbl)

        doc.build(elements, onFirstPage=header_footer, onLaterPages=header_footer)
        pdf_bytes = buffer.getvalue()
        buffer.close()
        headers = {"Content-Disposition": 'attachment; filename="conceptos.pdf"'}
        return StreamingResponse(io.BytesIO(pdf_bytes), media_type="application/pdf", headers=headers)
    # ---------- fallback ----------
    raise HTTPException(status_code=400, detail="Formato no soportado")
