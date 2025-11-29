import json
import os
import aiohttp
from typing import Literal
import uuid
from fastapi import HTTPException
from pathvalidate import sanitize_filename

from models.pptx_models import PptxPresentationModel
from models.presentation_and_path import PresentationAndPath
from services.pptx_presentation_creator import PptxPresentationCreator
from services.temp_file_service import TEMP_FILE_SERVICE
from utils.asset_directory_utils import get_exports_directory
import uuid


async def export_presentation(
    presentation_id: uuid.UUID, title: str, export_as: Literal["pptx", "pdf"]
) -> PresentationAndPath:
    if export_as == "pptx":

        # Get the converted PPTX model from the Next.js service
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"http://localhost/api/presentation_to_pptx_model?id={presentation_id}"
            ) as response:
                if response.status != 200:
                    error_text = await response.text()
                    print(f"Failed to get PPTX model: {error_text}")
                    raise HTTPException(
                        status_code=500,
                        detail="Failed to convert presentation to PPTX model",
                    )
                pptx_model_data = await response.json()

        # Create PPTX file using the converted model
        pptx_model = PptxPresentationModel(**pptx_model_data)
        
        # Validate input model
        if not pptx_model.slides or len(pptx_model.slides) == 0:
            raise HTTPException(
                status_code=400,
                detail="Cannot export presentation: No slides provided in the model"
            )
        
        print(f"Exporting PPTX with {len(pptx_model.slides)} slide(s) for presentation {presentation_id}")
        
        temp_dir = TEMP_FILE_SERVICE.create_temp_dir()
        pptx_creator = PptxPresentationCreator(pptx_model, temp_dir)
        await pptx_creator.create_ppt()

        # Validate that slides were created
        if len(pptx_creator._ppt.slides) == 0:
            raise HTTPException(
                status_code=500,
                detail="Failed to create presentation: No slides were generated"
            )

        export_directory = get_exports_directory()
        pptx_path = os.path.join(
            export_directory,
            f"{sanitize_filename(title or str(uuid.uuid4()))}.pptx",
        )
        
        # Save with validation (save() method now includes validation)
        try:
            pptx_creator.save(pptx_path)
        except ValueError as e:
            # Handle validation errors from save()
            raise HTTPException(
                status_code=400,
                detail=f"Failed to save presentation: {str(e)}"
            )
        except Exception as e:
            # Handle other save errors
            print(f"ERROR: Failed to save PPTX file: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to save presentation file: {str(e)}"
            )
        
        # Additional verification after save
        if not os.path.exists(pptx_path):
            raise HTTPException(
                status_code=500,
                detail=f"File was not created at expected path: {pptx_path}"
            )
        
        file_size = os.path.getsize(pptx_path)
        if file_size == 0:
            raise HTTPException(
                status_code=500,
                detail=f"File was created but is empty: {pptx_path}"
            )
        
        print(f"PPTX export successful: {pptx_path} ({file_size} bytes)")
        
        return PresentationAndPath(
            presentation_id=presentation_id,
            path=pptx_path,
        )
    else:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                "http://localhost/api/export-as-pdf",
                json={
                    "id": str(presentation_id),
                    "title": sanitize_filename(title or str(uuid.uuid4())),
                },
            ) as response:
                response_json = await response.json()

        return PresentationAndPath(
            presentation_id=presentation_id,
            path=response_json["path"],
        )
