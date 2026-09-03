from app.kb.embeddings import embed_query
from app.kb.repository import search_chunks


def search_policy_kb(
    query: str, doc_type: str | None = None, majors: list[str] | None = None
) -> list[dict]:
    """Semantic search over the policy/procedure/directory corpus
    (docs/PROJECT_PLAN.md §6.2). Never used for degree-progress questions —
    those go through the DARS tools instead."""
    embedding = embed_query(query)
    matches = search_chunks(embedding, doc_type=doc_type, majors=majors, limit=5)
    return [
        {
            "title": m["title"],
            "section_heading": m.get("section_heading"),
            "content": m["content"],
            "source_url": m.get("source_url"),
            "form_url": m.get("form_url"),
            "doc_type": m["doc_type"],
            "similarity": m.get("similarity"),
        }
        for m in matches
    ]
