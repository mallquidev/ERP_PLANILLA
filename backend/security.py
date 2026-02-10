
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")
SECRET_KEY = "secret"
ALGORITHM = "HS256"

def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return {"sub": payload.get("sub"), "rol": payload.get("rol")}
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")
