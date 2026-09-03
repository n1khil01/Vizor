from app.config import get_settings
from app.llm.client import get_llm_client


def embed_texts(texts: list[str]) -> list[list[float]]:
    if not texts:
        return []
    settings = get_settings()
    client = get_llm_client()
    response = client.embeddings.create(model=settings.asu_embedding_model, input=texts)
    # The API may not preserve input order in `data`; sort by its index field.
    ordered = sorted(response.data, key=lambda item: item.index)
    return [item.embedding for item in ordered]


def embed_query(text: str) -> list[float]:
    return embed_texts([text])[0]
