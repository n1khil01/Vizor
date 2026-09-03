-- The ASU embedding model turned out to emit 4096-dim vectors, not 1536
-- (docs/PROJECT_PLAN.md §5: "N is set once we know the ASU embedding
-- model's dimension" — now known). Fixes kb_chunks and match_kb_chunks.
--
-- No ivfflat/HNSW index at this dimension: pgvector caps both at 2000
-- dims. Corpus is a few dozen chunks for the demo, so brute-force cosine
-- distance (no index) is plenty fast. Revisit if the corpus grows enough
-- to need one — options are re-indexing on a truncated/PCA'd vector, or
-- switching embedding models.

drop index if exists kb_chunks_embedding_idx;

alter table kb_chunks alter column embedding type vector(4096);

drop function if exists match_kb_chunks(vector(1536), int, text, text[]);

create or replace function match_kb_chunks(
  query_embedding vector(4096),
  match_count int default 5,
  filter_doc_type text default null,
  filter_majors text[] default null
)
returns table (
  id uuid,
  document_id uuid,
  content text,
  doc_type text,
  majors text[],
  source_url text,
  form_url text,
  title text,
  section_heading text,
  similarity float
)
language sql stable
as $$
  select
    kb_chunks.id,
    kb_chunks.document_id,
    kb_chunks.content,
    kb_chunks.doc_type,
    kb_chunks.majors,
    kb_chunks.source_url,
    kb_chunks.form_url,
    kb_chunks.title,
    kb_chunks.section_heading,
    1 - (kb_chunks.embedding <=> query_embedding) as similarity
  from kb_chunks
  where (filter_doc_type is null or kb_chunks.doc_type = filter_doc_type)
    and (filter_majors is null or kb_chunks.majors && filter_majors)
  order by kb_chunks.embedding <=> query_embedding
  limit match_count;
$$;
