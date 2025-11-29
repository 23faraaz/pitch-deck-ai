from typing import Optional

from models.llm_message import LLMSystemMessage, LLMUserMessage
from models.presentation_layout import PresentationLayoutModel
from models.presentation_outline_model import PresentationOutlineModel
from models.presentation_structure_model import PresentationStructureModel

from services.llm_client import LLMClient, load_template
from utils.llm_client_error_handler import handle_llm_client_exceptions
from utils.llm_provider import get_model


async def generate_presentation_structure(
    presentation_outline: PresentationOutlineModel,
    presentation_layout: PresentationLayoutModel,
    instructions: Optional[str] = None,
    using_slides_markdown: bool = False,
) -> PresentationStructureModel:
    """
    Schema-first presentation structure generation using ai/template.json.

    - Loads template.json
    - Injects systemPrompt + userPromptTemplate
    - Appends context
    - Calls generate_structured() with strict schema
    """

    # ------------------------------------------------------------
    # 1. Load schema-first template
    # ------------------------------------------------------------
    template = load_template()
    system_prompt = template["systemPrompt"]
    user_prompt_template = template["userPromptTemplate"]
    schema = template["schema"]

    # ------------------------------------------------------------
    # 2. Build context (outline, layout, instructions)
    # ------------------------------------------------------------
    presentation_context = (
        f"Presentation Outline:\n{presentation_outline.to_string()}\n\n"
        f"Presentation Layout:\n{presentation_layout.to_string()}\n\n"
        f"{'Instructions: ' + instructions if instructions else ''}\n\n"
        f"Number of slides: {len(presentation_outline.slides)}\n"
        f"Select layout for each slide to best serve the presentation purpose."
    )

    # ------------------------------------------------------------
    # 3. Format user prompt template
    # ------------------------------------------------------------
    if isinstance(user_prompt_template, dict):
        # If userPromptTemplate is structured JSON, fallback to simple context injection
        user_prompt_content = presentation_context
    else:
        try:
            user_prompt_content = str(user_prompt_template).format(
                data=presentation_outline.to_string(),
                layout=presentation_layout.to_string(),
                n_slides=len(presentation_outline.slides),
                instructions=instructions or "",
            )
        except Exception:
            user_prompt_content = f"{user_prompt_template}\n\n{presentation_context}"

    # ------------------------------------------------------------
    # 4. Build messages: [system, user, context]
    # ------------------------------------------------------------
    full_messages = [
        LLMSystemMessage(role="system", content=system_prompt),
        LLMUserMessage(role="user", content=user_prompt_content),
        LLMUserMessage(role="user", content=presentation_context),
    ]

    # ------------------------------------------------------------
    # 5. Call structured generation with strict schema
    # ------------------------------------------------------------
    client = LLMClient()
    model = get_model()

    try:
        response = await client.generate_structured(
            model=model,
            messages=full_messages,
            response_format=schema,   # <-- from template.json
            strict=True,
        )
        return PresentationStructureModel(**response)

    except Exception as e:
        raise handle_llm_client_exceptions(e)
