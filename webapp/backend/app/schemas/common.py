from typing import Optional, Any, Dict
from pydantic import BaseModel


class ErrorDetail(BaseModel):
    code: str
    message: str


class APIResponse(BaseModel):
    ok: bool
    data: Optional[Any] = None
    error: Optional[ErrorDetail] = None


def success_response(data: Any) -> Dict[str, Any]:
    return {"ok": True, "data": data}


def error_response(code: str, message: str) -> Dict[str, Any]:
    return {"ok": False, "error": {"code": code, "message": message}}