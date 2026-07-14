-- SouTrilheiro — remove as fotos de placeholder inseridas por seed_fotos_es.sql
-- Rode no SQL Editor do Supabase.

delete from fotos
where url like 'https://picsum.photos/%';
