from langchain.embeddings.base import Embeddings
import httpx
import os
import time
import logging
from typing import List

logger = logging.getLogger(__name__)

MODEL = "models/gemini-embedding-001"
EMBED_URL = f"https://generativelanguage.googleapis.com/v1beta/{MODEL}:embedContent"
BATCH_URL = f"https://generativelanguage.googleapis.com/v1beta/{MODEL}:batchEmbedContents"

# Google's batch endpoint accepts up to 100 requests per call
BATCH_SIZE = 100


class GeminiEmbeddings(Embeddings):
    def __init__(self):
        self.api_key = os.environ["GOOGLE_API_KEY"]
        self.headers = {
            "Content-Type": "application/json",
            "x-goog-api-key": self.api_key,
        }

    def _request_with_retry(self, url: str, payload: dict, retries: int = 6) -> dict:
        for attempt in range(retries):
            response = httpx.post(url, headers=self.headers, json=payload, timeout=120.0)
            if response.status_code == 429:
                wait = 5 * (2 ** attempt)
                logger.warning(f"[EMBED] 429 rate limited, waiting {wait}s")
                time.sleep(wait)
                continue
            if response.status_code >= 400:
                logger.error(f"[EMBED] {response.status_code} response: {response.text}")
            response.raise_for_status()
            return response.json()
        raise Exception("Embedding API rate limit exceeded after retries")

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        all_embeddings = []
        # Process in batches of BATCH_SIZE
        for i in range(0, len(texts), BATCH_SIZE):
            batch = texts[i:i + BATCH_SIZE]
            payload = {
                "requests": [
                    {
                        "model": MODEL,
                        "content": {"parts": [{"text": text}]},
                        "taskType": "RETRIEVAL_DOCUMENT",
                        "outputDimensionality": 768,
                    }
                    for text in batch
                ]
            }
            result = self._request_with_retry(BATCH_URL, payload)
            for emb in result["embeddings"]:
                all_embeddings.append(emb["values"])
            logger.info(f"[EMBED] Batch {i // BATCH_SIZE + 1} embedded ({len(batch)} chunks)")
        return all_embeddings

    def embed_query(self, text: str) -> List[float]:
        payload = {
            "model": MODEL,
            "content": {"parts": [{"text": text}]},
            "taskType": "RETRIEVAL_QUERY",
            "outputDimensionality": 768,
        }
        result = self._request_with_retry(EMBED_URL, payload)
        return result["embedding"]["values"]


def get_embedder() -> GeminiEmbeddings:
    return GeminiEmbeddings()