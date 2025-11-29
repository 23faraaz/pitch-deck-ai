# NOTE: Hard-coded model lists for reliable model loading
# These lists can be easily updated as new models become available

# OpenAI supported models
# Using actual model IDs that are commonly available
SUPPORTED_OPENAI_MODELS = [
    "gpt-4o",
    "gpt-4o-mini",
    "gpt-4-turbo",
    "gpt-4",
    "gpt-3.5-turbo",
]

# Google Gemini supported models
# Using the model name format expected by the Gemini API
SUPPORTED_GOOGLE_MODELS = [
    "models/gemini-1.5-flash",
    "models/gemini-1.5-pro",
    "models/gemini-2.0-flash-exp",
]
