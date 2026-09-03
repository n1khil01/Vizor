"""Reads and writes kb_documents / kb_chunks. Vector search runs through a
Postgres RPC (`match_kb_chunks`, added in migration 0002) since PostgREST
can't do a `<=>` similarity ORDER BY on its own — pgvector needs raw SQL.
"""

from app.db.client import get_supabase


def upsert_document(title: str, source_url: str | None, raw_content: str) -> str:
    sb = get_supabase()
    result = (
        sb.table("kb_documents")
        .insert({"title": title, "source_url": source_url, "raw_content": raw_content})
        .execute()
    )
    return result.data[0]["id"]


def delete_document_by_source(source_url: str) -> None:
    sb = get_supabase()
    sb.table("kb_documents").delete().eq("source_url", source_url).execute()


def insert_chunks(document_id: str, chunks: list[dict]) -> None:
    """Each chunk dict: content, embedding, doc_type, majors, source_url,
    form_url, title, section_heading."""
    if not chunks:
        return
    sb = get_supabase()
    rows = [{**chunk, "document_id": document_id} for chunk in chunks]
    sb.table("kb_chunks").insert(rows).execute()


def search_chunks(
    query_embedding: list[float],
    doc_type: str | None = None,
    majors: list[str] | None = None,
    limit: int = 5,
) -> list[dict]:
    sb = get_supabase()
    result = sb.rpc(
        "match_kb_chunks",
        {
            "query_embedding": query_embedding,
            "match_count": limit,
            "filter_doc_type": doc_type,
            "filter_majors": majors,
        },
    ).execute()
    return result.data or []
