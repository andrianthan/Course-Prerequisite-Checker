"""LLM-powered prerequisite parser — converts natural language to structured rules."""

import os
import json
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()


def get_client():
    """Create an OpenRouter client."""
    return OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=os.getenv("OPENROUTER_API_KEY"),
    )


def parse_prerequisites_text(text):
    """Parse natural-language prerequisite descriptions into structured JSON rules."""
    # TODO: Implement LLM call
    pass
