from langchain.embeddings.base import Embeddings
import httpx
import os
from typing import List


EMBED_URL = "https://generativelanguage.googleapis.com/v1/models/text-embedding-004:embedContent"


class GeminiEmbeddings(Embeddings):
    """
    Custom embeddings class calling Google's REST API v1 directly.
    Bypasses all SDK gRPC v1beta routing issues.
    """
    def __init__(self):
        self.api_key = os.environ["GOOGLE_API_KEY"]

    def _embed(self, text: str, task_type: str) -> List[float]:
        response = httpx.post(
            f"{EMBED_URL}?key={self.api_key}",
            json={
                "model": "models/text-embedding-004",
                "content": {"parts": [{"text": text}]},
                "taskType": task_type
            },
            timeout=30.0
        )
        response.raise_for_status()
        return response.json()["embedding"]["values"]

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return [self._embed(text, "RETRIEVAL_DOCUMENT") for text in texts]

    def embed_query(self, text: str) -> List[float]:
        return self._embed(text, "RETRIEVAL_QUERY")


def get_embedder() -> GeminiEmbeddings:
    return GeminiEmbeddings()
