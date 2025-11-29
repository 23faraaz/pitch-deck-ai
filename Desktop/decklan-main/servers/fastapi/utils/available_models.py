from anthropic import AsyncAnthropic
from openai import AsyncOpenAI
from google import genai

from constants.supported_models import SUPPORTED_OPENAI_MODELS, SUPPORTED_GOOGLE_MODELS


# NOTE: OpenAI model loading uses a fixed list instead of API-based listing
# This ensures reliable model loading and avoids issues with the models.list endpoint
async def list_available_openai_compatible_models(url: str, api_key: str) -> list[str]:
    # Simply return the hard-coded list of supported models
    # Key validation will happen during actual generation
    # This prevents false negatives from unreliable API listing endpoints
    if not api_key or len(api_key.strip()) == 0:
        raise Exception("API key is required")
    
    return SUPPORTED_OPENAI_MODELS


async def list_available_anthropic_models(api_key: str) -> list[str]:
    client = AsyncAnthropic(api_key=api_key)
    return list(map(lambda x: x.id, (await client.models.list(limit=50)).data))


# NOTE: Gemini model loading uses a fixed list instead of API-based listing
# The Gemini models.list endpoint can be unreliable, so we use a curated list
async def list_available_google_models(api_key: str) -> list[str]:
    # Simply return the hard-coded list of supported models
    # Key validation will happen during actual generation
    # This prevents false negatives from unreliable API listing endpoints
    if not api_key or len(api_key.strip()) == 0:
        raise Exception("API key is required")
    
    return SUPPORTED_GOOGLE_MODELS
