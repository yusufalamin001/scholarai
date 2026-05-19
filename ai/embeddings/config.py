from langchain_google_genai import GoogleGenerativeAIEmbeddings
import os

def get_embedder() -> GoogleGenerativeAIEmbeddings:
    """
    Returns Google's embedding model via Gemini API.
    No local model download — runs entirely via API call.
    Uses the same GOOGLE_API_KEY as the rest of the pipeline.
    """
    return GoogleGenerativeAIEmbeddings(
        model="models/text-embedding-004",
        google_api_key=os.environ["GOOGLE_API_KEY"]
    )
