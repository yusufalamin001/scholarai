from langchain_huggingface import HuggingFaceEmbeddings
import os

# Using a free, local embedding model — no API cost
# all-MiniLM-L6-v2 is fast, lightweight, and works well for academic text
EMBEDDING_MODEL_NAME = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")

def get_embedder() -> HuggingFaceEmbeddings:
    """
    Returns the shared embedding model instance.
    This model runs locally — no API call, no cost per embedding.
    """
    return HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL_NAME)
