from langchain.embeddings.base import Embeddings
import httpx
import os
import time
import logging
from typing import List

logger = logging.getLogger(__name__)

EMBED_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent"
BATCH_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:batchEmbedContents"


class GeminiEmbeddings(Embeddings):
    def __init__(self):
        self.api_key = os.environ["GOOGLE_API_KEY"]
        self.headers = {
            "Content-Type": "application/json",
            "x-goog-api-key": self.api_key,
        }

    def _request_with_retry(self, url: str, payload: dict, retries: int = 5) -> dict:
        for attempt in range(retries):
            response = httpx.post(url, headers=self.headers, json=payload, timeout=60.0)
            if response.status_code == 429:
                time.sleep(2 ** attempt)
                continue
            if response.status_code >= 400:
                logger.error(f"[EMBED] {response.status_code} response: {response.text}")
            response.raise_for_status()
            return response.json()
        raise Exception("Embedding API rate limit exceeded after retries")

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        embeddings = []
        for text in texts:
            payload = {
                "model": "models/gemini-embedding-001",
                "content": {"parts": [{"text": text}]},
                "taskType": "RETRIEVAL_DOCUMENT",
                "outputDimensionality": 768,
            }
            result = self._request_with_retry(EMBED_URL, payload)
            embeddings.append(result["embedding"]["values"])
            time.sleep(0.5)
        return embeddings

    def embed_query(self, text: str) -> List[float]:
        payload = {
            "model": "models/gemini-embedding-001",
            "content": {"parts": [{"text": text}]},
            "taskType": "RETRIEVAL_QUERY",
            "outputDimensionality": 768,
        }
        result = self._request_with_retry(EMBED_URL, payload)
        return result["embedding"]["values"]


def get_embedder() -> GeminiEmbeddings:
    return GeminiEmbeddings()
