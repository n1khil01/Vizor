-- Vector similarity search over kb_chunks, filtered by doc_type/majors.
-- PostgREST can't express `ORDER BY embedding <=> $1`, so this is exposed
-- as an RPC the backend calls via supabase-py's .rpc(). See
-- docs/PROJECT_PLAN.md §6.2.

create or replace function match_kb_chunks(
  query_embedding vector(1536),
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
