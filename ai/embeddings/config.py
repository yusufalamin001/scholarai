from langchain.embeddings.base import Embeddings
import httpx
import os
from typing import List


EMBED_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent"


class GeminiEmbeddings(Embeddings):
    """
    Custom embeddings class calling Google's REST API directly.
    Uses gemini-embedding-001, the current Gemini embedding model.
    API key is sent via header to keep it out of logs.
    """
    def __init__(self):
        self.api_key = os.environ["GOOGLE_API_KEY"]

    def _embed(self, text: str, task_type: str) -> List[float]:
        response = httpx.post(
            EMBED_URL,
            headers={
                "Content-Type": "application/json",
                "x-goog-api-key": self.api_key,
            },
            json={
                "model": "models/gemini-embedding-001",
                "content": {"parts": [{"text": text}]},
                "task_type": task_type,
                "output_dimensionality": 768,
            },
            timeout=30.0,
        )
        response.raise_for_status()
        return response.json()["embedding"]["values"]

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return [self._embed(text, "RETRIEVAL_DOCUMENT") for text in texts]

    def embed_query(self, text: str) -> List[float]:
        return self._embed(text, "RETRIEVAL_QUERY")


def get_embedder() -> GeminiEmbeddings:
    return GeminiEmbeddings()