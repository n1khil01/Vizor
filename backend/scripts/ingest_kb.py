"""KB ingestion pipeline (docs/PROJECT_PLAN.md §6.2, §10 phase 3):

    seeds.yaml -> fetch (cache/) -> extract -> fixtures/kb/documents.json
               -> chunk -> embed -> pgvector

Each stage is independently re-runnable. `fixtures/kb/documents.json` is the
intermediate: retrieval gets re-chunked/re-embedded repeatedly while tuning,
and none of that should re-hit ASU or the handwritten files.

Usage:
    uv run scripts/ingest_kb.py fetch      # seeds.yaml -> documents.json (handwritten + static)
    uv run scripts/ingest_kb.py load       # documents.json -> chunk, embed, load to Supabase
    uv run scripts/ingest_kb.py all        # both, in order
"""

import json
import sys
import time
from pathlib import Path

import httpx
import trafilatura
import yaml

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.kb.chunker import chunk_document
from app.kb.embeddings import embed_texts
from app.kb.repository import delete_document_by_source, insert_chunks, upsert_document

BACKEND_DIR = Path(__file__).resolve().parent.parent
SEEDS_PATH = BACKEND_DIR / "seeds.yaml"
CACHE_DIR = BACKEND_DIR / "cache"
DOCUMENTS_PATH = BACKEND_DIR / "fixtures" / "kb" / "documents.json"

USER_AGENT = "VizorBot/0.1 (ASU advising assistant demo; contact: air-spark-challenge)"
RATE_LIMIT_SECONDS = 1.0


def _load_seeds() -> dict:
    with open(SEEDS_PATH) as f:
        return yaml.safe_load(f)


def _cache_path(url: str) -> Path:
    safe = url.replace("://", "_").replace("/", "_")
    return CACHE_DIR / f"{safe}.html"


def _fetch_static(url: str) -> str | None:
    cache_file = _cache_path(url)
    if cache_file.exists():
        return cache_file.read_text()

    try:
        response = httpx.get(url, headers={"User-Agent": USER_AGENT}, timeout=15, follow_redirects=True)
        response.raise_for_status()
    except httpx.HTTPError as exc:
        print(f"  ! fetch failed for {url}: {exc}")
        return None

    CACHE_DIR.mkdir(exist_ok=True)
    cache_file.write_text(response.text)
    time.sleep(RATE_LIMIT_SECONDS)
    return response.text


def cmd_fetch() -> None:
    seeds = _load_seeds()
    documents = []

    hw = seeds.get("handwritten") or {}
    hw_dir = BACKEND_DIR / hw.get("dir", "fixtures/kb/procedural")
    for path in sorted(hw_dir.glob("*.md")):
        text = path.read_text()
        # Title = first markdown H1; falls back to filename.
        title = next(
            (line.lstrip("# ").strip() for line in text.splitlines() if line.startswith("# ")),
            path.stem.replace("-", " ").title(),
        )
        documents.append(
            {
                "title": title,
                "source_url": f"handwritten://{path.name}",
                "doc_type": hw.get("doc_type", "procedural"),
                "majors": [],
                "raw_content": text,
            }
        )
        print(f"  handwritten: {path.name}")

    for entry in seeds.get("static") or []:
        html = _fetch_static(entry["url"])
        if html is None:
            continue
        extracted = trafilatura.extract(html, include_links=True, favor_recall=True)
        if not extracted:
            print(f"  ! trafilatura found no main content for {entry['url']}")
            continue
        documents.append(
            {
                "title": entry["title"],
                "source_url": entry["url"],
                "doc_type": entry.get("doc_type", "policy"),
                "majors": entry.get("majors", []),
                "raw_content": extracted,
            }
        )
        print(f"  fetched: {entry['url']}")

    # `api` sources (e.g. the club directory JSON endpoint) are deliberately
    # not handled generically here — each API has its own response shape.
    # Left as a documented next step; see seeds.yaml's `api:` block.
    if seeds.get("api"):
        print(
            f"  note: {len(seeds['api'])} api source(s) in seeds.yaml skipped — "
            "each needs a shape-specific parser, not written for the demo corpus."
        )

    DOCUMENTS_PATH.parent.mkdir(parents=True, exist_ok=True)
    DOCUMENTS_PATH.write_text(json.dumps(documents, indent=2))
    print(f"\nWrote {len(documents)} documents to {DOCUMENTS_PATH}")


def cmd_load() -> None:
    if not DOCUMENTS_PATH.exists():
        print(f"{DOCUMENTS_PATH} not found — run `fetch` first.")
        return

    documents = json.loads(DOCUMENTS_PATH.read_text())
    total_chunks = 0

    for doc in documents:
        delete_document_by_source(doc["source_url"])
        document_id = upsert_document(doc["title"], doc["source_url"], doc["raw_content"])

        chunks = chunk_document(doc["title"], doc["raw_content"])
        if not chunks:
            print(f"  ! no chunks for {doc['title']}")
            continue

        embeddings = embed_texts([c.content for c in chunks])
        rows = [
            {
                "content": chunk.content,
                "embedding": embedding,
                "doc_type": doc["doc_type"],
                "majors": doc["majors"],
                "source_url": doc["source_url"],
                "form_url": None,
                "title": doc["title"],
                "section_heading": chunk.section_heading,
            }
            for chunk, embedding in zip(chunks, embeddings)
        ]
        insert_chunks(document_id, rows)
        total_chunks += len(rows)
        print(f"  loaded {doc['title']}: {len(rows)} chunks")

    print(f"\nLoaded {len(documents)} documents, {total_chunks} chunks total.")


def main() -> None:
    command = sys.argv[1] if len(sys.argv) > 1 else "all"
    if command in ("fetch", "all"):
        print("== fetch ==")
        cmd_fetch()
    if command in ("load", "all"):
        print("== load ==")
        cmd_load()
    if command not in ("fetch", "load", "all"):
        print(__doc__)
        sys.exit(1)


if __name__ == "__main__":
    main()
