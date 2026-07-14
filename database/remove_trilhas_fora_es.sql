-- SouTrilheiro — remove do banco as trilhas que não são do Espírito Santo
-- ATENÇÃO: também apaga em cascata percursos, avaliações, fotos e comentários
-- ligados a essas trilhas (ON DELETE CASCADE definido no schema.sql).
-- Rode no SQL Editor do Supabase.

delete from trilhas
where estado <> 'ES';
