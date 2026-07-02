"""
config.py
---------
WHAT: Provides the embedding model for the RAG pipeline.
WHY:  Converts text (document chunks and queries) into 384-dim vectors
      using the lightweight, local, free BAAI/bge-small-en-v1.5 model
      via fastembed (ONNX-quantized, ~33MB, fits Render free tier RAM).

No API key, no billing, no rate limits — the model runs locally on CPU.
"""

from langchain.embeddings.base import Embeddings
from fastembed import TextEmbedding
from typing import List

MODEL_NAME = "BAAI/bge-small-en-v1.5"

# Load the model once at import time and reuse it (singleton).
_model = TextEmbedding(model_name=MODEL_NAME)


class LocalEmbeddings(Embeddings):
    """LangChain-compatible wrapper around fastembed's TextEmbedding."""

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        # fastembed returns a generator of numpy arrays
        return [vec.tolist() for vec in _model.embed(texts)]

    def embed_query(self, text: str) -> List[float]:
        return list(_model.embed([text]))[0].tolist()


def get_embedder() -> LocalEmbeddings:
    return LocalEmbeddings()
