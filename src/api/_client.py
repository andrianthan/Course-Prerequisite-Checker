"""Shared OpenRouter client factory for all LLM API modules."""

import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

# Primary model — free tier, advertises structured output support.
# Fallback: "meta-llama/llama-3.1-8b-instruct:free" if Gemma quota exhausted.
MODEL = "google/gemma-3-12b-it:free"


def get_client() -> OpenAI:
    """Return an OpenAI-compatible client pointed at OpenRouter.

    Raises EnvironmentError with a clear message if OPENROUTER_API_KEY
    is not set — BEFORE the OpenAI client is constructed, so callers
    always get a descriptive error instead of a 401 AuthenticationError.
    """
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise EnvironmentError(
            "OPENROUTER_API_KEY is not set. "
            "Copy .env.example to .env and fill in your OpenRouter API key."
        )
    return OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=api_key,
    )
