"""LLM-powered transcript parser — extracts courses and grades from unofficial transcripts."""

import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()


def get_client():
    """Create an OpenRouter client."""
    return OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=os.getenv("OPENROUTER_API_KEY"),
    )


def parse_transcript_text(text):
    """Parse raw transcript text into a structured student record."""
    # TODO: Implement LLM call
    pass


def parse_transcript_pdf(pdf_path):
    """Extract text from a transcript PDF and parse it into a student record."""
    # TODO: Extract text from PDF, then call parse_transcript_text()
    pass
