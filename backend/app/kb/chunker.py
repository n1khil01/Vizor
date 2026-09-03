"""Splits a document's markdown/HTML-derived text into retrieval chunks.

docs/PROJECT_PLAN.md §6.2: split on structure (## headings), not character
count, 300-800 tokens; prepend title + section heading into the chunk text
so a chunk is self-describing out of context; never split a numbered
procedure across chunks.
"""

import re
from dataclasses import dataclass

_HEADING_RE = re.compile(r"^#{1,3}\s+(.*)$", re.MULTILINE)

# Rough token estimate without pulling in a tokenizer: ~4 chars/token.
_MIN_CHARS = 300 * 4
_MAX_CHARS = 800 * 4


@dataclass
class Chunk:
    content: str
    section_heading: str | None


def _split_sections(text: str) -> list[tuple[str | None, str]]:
    """Splits on ## / ### headings. Returns (heading, body) pairs, body
    includes the heading line itself for readability."""
    matches = list(_HEADING_RE.finditer(text))
    if not matches:
        return [(None, text.strip())] if text.strip() else []

    sections = []
    for i, m in enumerate(matches):
        start = m.start()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        heading = m.group(1).strip()
        body = text[start:end].strip()
        if body:
            sections.append((heading, body))
    return sections


def _merge_small_sections(sections: list[tuple[str | None, str]]) -> list[tuple[str | None, str]]:
    """A numbered procedure (## Steps) must never be split, but tiny
    adjacent sections (e.g. a one-line ## Deadlines) get merged forward so
    we don't emit a chunk with no useful context on its own."""
    merged: list[tuple[str | None, str]] = []
    for heading, body in sections:
        if merged and len(merged[-1][1]) < _MIN_CHARS and len(merged[-1][1]) + len(body) <= _MAX_CHARS:
            prev_heading, prev_body = merged[-1]
            merged[-1] = (prev_heading, prev_body + "\n\n" + body)
        else:
            merged.append((heading, body))
    return merged


def chunk_document(title: str, raw_text: str) -> list[Chunk]:
    sections = _merge_small_sections(_split_sections(raw_text))

    chunks = []
    for heading, body in sections:
        # Prepend title/heading context so the chunk reads correctly in
        # isolation ("Course Withdrawal -> Deadlines: Submit by ...").
        prefix = title if not heading else f"{title} → {heading}"
        content = f"{prefix}\n\n{body}"
        chunks.append(Chunk(content=content, section_heading=heading))
    return chunks
