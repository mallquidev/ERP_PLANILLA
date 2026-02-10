from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from services.payroll_service import execute_stored_procedure  # Importas desde services
from security import get_current_user

router = APIRouter(prefix="/payroll")

class PayrollInput(BaseModel):
    CIA_CODCIA: int
    ANO_CODANO: int
    MES_CODMES: int
    TPL_CODTPL: int
    PPE_CORPPE: int
    P_CODAUX: int

@router.post("/video")
def execute_payroll(input: PayrollInput, user: dict = Depends(get_current_user)):
    try:
        result = execute_stored_procedure(
            input.CIA_CODCIA,
            input.ANO_CODANO,
            input.MES_CODMES,
            input.TPL_CODTPL,
            input.PPE_CORPPE,
            input.P_CODAUX
        )
        return {"data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
