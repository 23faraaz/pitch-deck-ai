from typing import List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from utils.available_models import list_available_openai_compatible_models

OPENAI_ROUTER = APIRouter(prefix="/openai", tags=["OpenAI"])


class AvailableModelsRequest(BaseModel):
    url: str
    api_key: str


@OPENAI_ROUTER.post("/models/available", response_model=List[str])
async def get_available_models(request: AvailableModelsRequest):
    try:
        return await list_available_openai_compatible_models(request.url, request.api_key)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
