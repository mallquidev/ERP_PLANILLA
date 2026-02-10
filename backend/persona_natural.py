# backend/persona_natural.py
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field
from typing import Optional, List, Any, Dict
import pyodbc

from database import get_connection
from security import get_current_user

router = APIRouter(prefix="/persona-natural", tags=["PersonaNatural"])

# ----- Schemas -----

class PersonaNaturalIn(BaseModel):
    IDPersonaNatural: int
    PKIDTipoDocumentoIdentidad: int
    NumeroDocumentoIdentidad: str = Field(max_length=20)
    PKIDSexo: int
    PKIDNivelInstruccion: int
    PKIDProfesion: int
    PrimerNombre: str
    SegundoNombre: Optional[str] = None
    TercerNombre: Optional[str] = None  # tu tabla la define varbinary, si deseas guardarlo como texto opcional
    ApellidoPaterno: str
    ApellidoMaterno: Optional[str] = None
    FechaNacimiento: str  # "YYYY-MM-DD"
    LugarNacimiento: str
    TelefonoFijo: Optional[str] = None
    TelefonoCelular: Optional[str] = None
    EmailPersonal: Optional[str] = None
    FechaAfiliacionAFP: Optional[str] = None
    NumeroAFP: Optional[str] = None
    PKIDGradoAcademico: int
    PKIDNacionalidad: int
    PKIDPais: int
    BreveteNumero: Optional[str] = None
    BreveteFechaCaducidad: Optional[str] = None
    PasaporteNumero: Optional[str] = None
    PasaporteCaducidad: Optional[str] = None
    GrupoSanguineo: Optional[str] = None
    PKIDSituacionRegistro: int
    PKIDEstadoCivil: Optional[int] = None
    NumeroSeguroSocial: Optional[str] = None
    Talla: Optional[str] = None
    PKIDModalidadFormativa: Optional[int] = None
    PKIDInstitutoEducativo: Optional[int] = None
    PKIDProfesionFormativa: Optional[int] = None
    FechaEgresoFormativa: Optional[str] = None
    PKIDTipoCentroFormativo: Optional[int] = None
    LibretaMilitar: Optional[str] = None

class PersonaNaturalOut(PersonaNaturalIn):
    PKID: int

# ----- Helpers -----

def row_to_dict(cursor, row) -> Dict[str, Any]:
    cols = [c[0] for c in cursor.description]
    return dict(zip(cols, row))

# ----- Endpoints -----

@router.get("/", response_model=List[Dict[str, Any]])
def listar_personas(
    q: Optional[str] = Query(None, description="Texto para búsqueda básica (nombres/apellidos/documento)"),
    skip: int = 0,
    limit: int = 100,
    user: dict = Depends(get_current_user)
):
    """
    Lista personas (con nombres de combos resueltos para ver en tabla).
    """
    conn = get_connection()
    cur = conn.cursor()
    try:
        base_sql = """
        SELECT p.PKID, p.IDPersonaNatural, p.PKIDTipoDocumentoIdentidad, t.DocumentoIdentidad,
               p.NumeroDocumentoIdentidad, p.PKIDSexo, s.Sexo,
               p.PKIDNivelInstruccion, ni.NivelInstruccion,
               p.PKIDProfesion, pr.Profesion,
               p.PrimerNombre, p.SegundoNombre, p.ApellidoPaterno, p.ApellidoMaterno,
               p.FechaNacimiento, p.LugarNacimiento,
               p.TelefonoFijo, p.TelefonoCelular, p.EmailPersonal, p.FechaAfiliacionAFP,
               p.NumeroAFP,p.GrupoSanguineo,
               p.PKIDGradoAcademico, ga.GradoAcademico,
               p.PKIDNacionalidad, n.Nacionalidad,
               p.PKIDPais, pa.Pais,
               p.PKIDSituacionRegistro, sr.SituacionRegistro
        FROM dbo.PersonaNatural p
        INNER JOIN dbo.TipoDocumentoIdentidad t ON t.PKID = p.PKIDTipoDocumentoIdentidad
        INNER JOIN dbo.Sexo s ON s.PKID = p.PKIDSexo
        INNER JOIN dbo.NivelInstruccion ni ON ni.PKID = p.PKIDNivelInstruccion
        INNER JOIN dbo.Profesion pr ON pr.PKID = p.PKIDProfesion
        INNER JOIN dbo.GradoAcademico ga ON ga.PKID = p.PKIDGradoAcademico
        INNER JOIN dbo.Nacionalidad n ON n.PKID = p.PKIDNacionalidad
        INNER JOIN dbo.Pais pa ON pa.PKID = p.PKIDPais
        INNER JOIN dbo.SituacionRegistro sr ON sr.PKID = p.PKIDSituacionRegistro
        """
        params = []
        if q:
            base_sql += """
            WHERE (p.PrimerNombre LIKE ? OR p.SegundoNombre LIKE ? OR
                   p.ApellidoPaterno LIKE ? OR p.ApellidoMaterno LIKE ? OR
                   p.NumeroDocumentoIdentidad LIKE ?)
            """
            like = f"%{q}%"
            params += [like, like, like, like, like]

        base_sql += " ORDER BY p.ApellidoPaterno, p.ApellidoMaterno, p.PrimerNombre OFFSET ? ROWS FETCH NEXT ? ROWS ONLY"
        params += [skip, limit]

        cur.execute(base_sql, params)
        rows = cur.fetchall()
        return [row_to_dict(cur, r) for r in rows]
    finally:
        cur.close()
        conn.close()


@router.get("/{pkid}", response_model=Dict[str, Any])
def obtener_persona(pkid: int, user: dict = Depends(get_current_user)):
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT * FROM dbo.PersonaNatural WHERE PKID = ?", pkid)
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Persona no encontrada")
        return row_to_dict(cur, row)
    finally:
        cur.close()
        conn.close()


@router.post("/", response_model=Dict[str, Any])
def crear_persona(data: PersonaNaturalIn, user: dict = Depends(get_current_user)):
    conn = get_connection()
    cur = conn.cursor()
    try:
        # Validación de unicidad TipoDocumento + Número
        cur.execute("""
            SELECT COUNT(*) FROM dbo.PersonaNatural
            WHERE PKIDTipoDocumentoIdentidad = ? AND NumeroDocumentoIdentidad = ?
        """, data.PKIDTipoDocumentoIdentidad, data.NumeroDocumentoIdentidad)
        if cur.fetchone()[0] > 0:
            raise HTTPException(status_code=400, detail="Ya existe una persona con el mismo tipo y número de documento.")

        # Validación de unicidad IDPersonaNatural
        cur.execute("SELECT COUNT(*) FROM dbo.PersonaNatural WHERE IDPersonaNatural = ?", data.IDPersonaNatural)
        if cur.fetchone()[0] > 0:
            raise HTTPException(status_code=400, detail="IDPersonaNatural ya existe.")

        insert_sql = """
        INSERT INTO dbo.PersonaNatural
        (IDPersonaNatural, PKIDTipoDocumentoIdentidad, NumeroDocumentoIdentidad, PKIDSexo, PKIDNivelInstruccion,
         PKIDProfesion, PrimerNombre, SegundoNombre, TercerNombre, ApellidoPaterno, ApellidoMaterno,
         FechaNacimiento, LugarNacimiento, TelefonoFijo, TelefonoCelular, EmailPersonal, FechaAfiliacionAFP,
         NumeroAFP, PKIDGradoAcademico, PKIDNacionalidad, PKIDPais, BreveteNumero, BreveteFechaCaducidad,
         PasaporteNumero, PasaporteCaducidad, GrupoSanguineo, PKIDSituacionRegistro, PKIDEstadoCivil,
         NumeroSeguroSocial, Talla, PKIDModalidadFormativa, PKIDInstitutoEducativo, PKIDProfesionFormativa,
         FechaEgresoFormativa, PKIDTipoCentroFormativo, LibretaMilitar)
        OUTPUT inserted.PKID
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        """

        params = (
            data.IDPersonaNatural,
            data.PKIDTipoDocumentoIdentidad,
            data.NumeroDocumentoIdentidad,
            data.PKIDSexo,
            data.PKIDNivelInstruccion,
            data.PKIDProfesion,
            data.PrimerNombre,
            data.SegundoNombre,
            data.TercerNombre,
            data.ApellidoPaterno,
            data.ApellidoMaterno,
            data.FechaNacimiento,
            data.LugarNacimiento,
            data.TelefonoFijo,
            data.TelefonoCelular,
            data.EmailPersonal,
            data.FechaAfiliacionAFP,
            data.NumeroAFP,
            data.PKIDGradoAcademico,
            data.PKIDNacionalidad,
            data.PKIDPais,
            data.BreveteNumero,
            data.BreveteFechaCaducidad,
            data.PasaporteNumero,
            data.PasaporteCaducidad,
            data.GrupoSanguineo,
            data.PKIDSituacionRegistro,
            data.PKIDEstadoCivil,
            data.NumeroSeguroSocial,
            data.Talla,
            data.PKIDModalidadFormativa,
            data.PKIDInstitutoEducativo,
            data.PKIDProfesionFormativa,
            data.FechaEgresoFormativa,
            data.PKIDTipoCentroFormativo,
            data.LibretaMilitar
        )
        cur.execute(insert_sql, params)
        new_pkid = cur.fetchone()[0]
        conn.commit()

        cur.execute("SELECT * FROM dbo.PersonaNatural WHERE PKID = ?", new_pkid)
        row = cur.fetchone()
        return row_to_dict(cur, row)
    except pyodbc.IntegrityError as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=f"Violación de integridad referencial o unicidad: {str(e)}")
    finally:
        cur.close()
        conn.close()


@router.put("/{pkid}", response_model=Dict[str, Any])
def actualizar_persona(pkid: int, data: PersonaNaturalIn, user: dict = Depends(get_current_user)):
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT PKID FROM dbo.PersonaNatural WHERE PKID = ?", pkid)
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Persona no encontrada")

        # Validación de unicidad de documento (excluyendo la misma persona)
        cur.execute("""
            SELECT COUNT(*) FROM dbo.PersonaNatural
            WHERE PKID <> ? AND PKIDTipoDocumentoIdentidad = ? AND NumeroDocumentoIdentidad = ?
        """, pkid, data.PKIDTipoDocumentoIdentidad, data.NumeroDocumentoIdentidad)
        if cur.fetchone()[0] > 0:
            raise HTTPException(status_code=400, detail="Ya existe otra persona con el mismo tipo y número de documento.")

        # Validación de unicidad de IDPersonaNatural (excluyendo la misma persona)
        cur.execute("""
            SELECT COUNT(*) FROM dbo.PersonaNatural
            WHERE PKID <> ? AND IDPersonaNatural = ?
        """, pkid, data.IDPersonaNatural)
        if cur.fetchone()[0] > 0:
            raise HTTPException(status_code=400, detail="IDPersonaNatural ya está usado por otra persona.")

        update_sql = """
        UPDATE dbo.PersonaNatural SET
          IDPersonaNatural=?,
          PKIDTipoDocumentoIdentidad=?, NumeroDocumentoIdentidad=?,
          PKIDSexo=?, PKIDNivelInstruccion=?, PKIDProfesion=?,
          PrimerNombre=?, SegundoNombre=?, TercerNombre=?,
          ApellidoPaterno=?, ApellidoMaterno=?,
          FechaNacimiento=?, LugarNacimiento=?,
          TelefonoFijo=?, TelefonoCelular=?, EmailPersonal=?,
          FechaAfiliacionAFP=?, NumeroAFP=?,
          PKIDGradoAcademico=?, PKIDNacionalidad=?, PKIDPais=?,
          BreveteNumero=?, BreveteFechaCaducidad=?,
          PasaporteNumero=?, PasaporteCaducidad=?,
          GrupoSanguineo=?, PKIDSituacionRegistro=?,
          PKIDEstadoCivil=?, NumeroSeguroSocial=?, Talla=?,
          PKIDModalidadFormativa=?, PKIDInstitutoEducativo=?,
          PKIDProfesionFormativa=?, FechaEgresoFormativa=?,
          PKIDTipoCentroFormativo=?, LibretaMilitar=?
        WHERE PKID=?
        """
        params = (
            data.IDPersonaNatural,
            data.PKIDTipoDocumentoIdentidad, data.NumeroDocumentoIdentidad,
            data.PKIDSexo, data.PKIDNivelInstruccion, data.PKIDProfesion,
            data.PrimerNombre, data.SegundoNombre, data.TercerNombre,
            data.ApellidoPaterno, data.ApellidoMaterno,
            data.FechaNacimiento, data.LugarNacimiento,
            data.TelefonoFijo, data.TelefonoCelular, data.EmailPersonal,
            data.FechaAfiliacionAFP, data.NumeroAFP,
            data.PKIDGradoAcademico, data.PKIDNacionalidad, data.PKIDPais,
            data.BreveteNumero, data.BreveteFechaCaducidad,
            data.PasaporteNumero, data.PasaporteCaducidad,
            data.GrupoSanguineo, data.PKIDSituacionRegistro,
            data.PKIDEstadoCivil, data.NumeroSeguroSocial, data.Talla,
            data.PKIDModalidadFormativa, data.PKIDInstitutoEducativo,
            data.PKIDProfesionFormativa, data.FechaEgresoFormativa,
            data.PKIDTipoCentroFormativo, data.LibretaMilitar,
            pkid
        )
        cur.execute(update_sql, params)
        conn.commit()

        cur.execute("SELECT * FROM dbo.PersonaNatural WHERE PKID = ?", pkid)
        row = cur.fetchone()
        return row_to_dict(cur, row)
    except pyodbc.IntegrityError as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=f"Violación de integridad: {str(e)}")
    finally:
        cur.close()
        conn.close()


@router.delete("/{pkid}")
def eliminar_persona(pkid: int, user: dict = Depends(get_current_user)):
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT PKID FROM dbo.PersonaNatural WHERE PKID = ?", pkid)
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Persona no encontrada")

        cur.execute("DELETE FROM dbo.PersonaNatural WHERE PKID = ?", pkid)
        conn.commit()
        return {"detail": "Eliminado"}
    except pyodbc.IntegrityError as e:
        conn.rollback()
        # Puede estar referenciado por otras tablas (Trabajador, etc.)
        raise HTTPException(status_code=400, detail=f"No se puede eliminar. Registro referenciado. {str(e)}")
    finally:
        cur.close()
        conn.close()
