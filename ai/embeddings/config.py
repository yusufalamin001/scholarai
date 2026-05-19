from langchain.embeddings.base import Embeddings
import google.generativeai as genai
import os
from typing import List


class GeminiEmbeddings(Embeddings):
    """
    Custom embeddings class using Google Gemini API directly.
    Bypasses langchain_google_genai's v1beta routing issue.
    """
    def __init__(self):
        genai.configure(api_key=os.environ["GOOGLE_API_KEY"])
        self.model = "models/text-embedding-004"

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        embeddings = []
        for text in texts:
            result = genai.embed_content(
                model=self.model,
                content=text,
                task_type="retrieval_document"
            )
            embeddings.append(result["embedding"])
        return embeddings

    def embed_query(self, text: str) -> List[float]:
        result = genai.embed_content(
            model=self.model,
            content=text,
            task_type="retrieval_query"
        )
        return result["embedding"]


def get_embedder() -> GeminiEmbeddings:
    return GeminiEmbeddings()
