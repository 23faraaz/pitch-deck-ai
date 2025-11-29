from typing import Annotated, List
from fastapi import APIRouter, Body, HTTPException

from utils.available_models import list_available_google_models

GOOGLE_ROUTER = APIRouter(prefix="/google", tags=["Google"])


@GOOGLE_ROUTER.post("/models/available", response_model=List[str])
async def get_available_models(api_key: Annotated[str, Body(embed=True)]):
    try:
        if not api_key or not api_key.strip():
            raise HTTPException(
                status_code=400,
                detail="API key is required"
            )
        return await list_available_google_models(api_key)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch available models: {str(e)}"
        )
