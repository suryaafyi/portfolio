-- 1. Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- 2. Create the documents table
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  embedding vector(768) -- Gemini text-embedding-004 outputs 768 dimensions by default
);

-- 3. Create a function to search for documents
-- This function uses cosine similarity (<=>)
create or replace function match_documents (
  query_embedding vector(768),
  match_count int default 5
) returns table (
  id uuid,
  content text,
  similarity float
)
language sql stable
as $$
  select
    documents.id,
    documents.content,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  order by documents.embedding <=> query_embedding
  limit match_count;
$$;
