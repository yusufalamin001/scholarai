from langchain.embeddings.base import Embeddings
import httpx
import os
import time
from typing import List


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
                wait = 2 ** attempt
                time.sleep(wait)
                continue
            response.raise_for_status()
            return response.json()
        raise Exception("Embedding API rate limit exceeded after retries")

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        payload = {
            "requests": [
                {
                    "model": "models/gemini-embedding-001",
                    "content": {"parts": [{"text": text}]},
                    "task_type": "RETRIEVAL_DOCUMENT",
                    "output_dimensionality": 768,
                }
                for text in texts
            ]
        }
        result = self._request_with_retry(BATCH_URL, payload)
        return [e["values"] for e in result["embeddings"]]

    def embed_query(self, text: str) -> List[float]:
        payload = {
            "model": "models/gemini-embedding-001",
            "content": {"parts": [{"text": text}]},
            "task_type": "RETRIEVAL_QUERY",
            "output_dimensionality": 768,
        }
        result = self._request_with_retry(EMBED_URL, payload)
        return result["embedding"]["values"]


def get_embedder() -> GeminiEmbeddings:
    return GeminiEmbeddings()