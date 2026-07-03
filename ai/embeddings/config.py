"""
config.py
---------
WHAT: Provides the embedding model for the RAG pipeline.
WHY:  Converts text (document chunks and queries) into 512-dim vectors
      using Jina's free embedding API (jina-embeddings-v3).

No local model — runs entirely via API call, so no RAM/onnxruntime issues.
Free tier: 100 RPM, 100K tokens/min, no credit card required.
"""

from langchain.embeddings.base import Embeddings
import httpx
import os
from typing import List

JINA_URL = "https://api.jina.ai/v1/embeddings"
MODEL = "jina-embeddings-v3"
DIMENSIONS = 512


class JinaEmbeddings(Embeddings):
    """LangChain-compatible wrapper around Jina's embedding API."""

    def __init__(self):
        self.api_key = os.environ["JINA_API_KEY"]
        self.headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
        }

    def _embed(self, texts: List[str], task: str) -> List[List[float]]:
        payload = {
            "model": MODEL,
            "task": task,
            "dimensions": DIMENSIONS,
            "input": texts,
        }
        response = httpx.post(JINA_URL, headers=self.headers, json=payload, timeout=60.0)
        response.raise_for_status()
        data = response.json()["data"]
        # Sort by index to preserve input order, then extract embeddings
        return [item["embedding"] for item in sorted(data, key=lambda x: x["index"])]

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return self._embed(texts, "retrieval.passage")

    def embed_query(self, text: str) -> List[float]:
        return self._embed([text], "retrieval.query")[0]


def get_embedder() -> JinaEmbeddings:
    return JinaEmbeddings()
