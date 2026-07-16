import { supabase } from '../lib/supabaseClient';
import { validarImagem, validarVideo, enviarArquivoParaBucket } from '../lib/uploadSeguro';

const BUCKET_POR_TIPO = { foto: 'fotos-trilhas', video: 'videos-trilhas' };

export async function criarStory(usuarioId, { tipo, arquivo, trilhaId = null }) {
  const bucket = BUCKET_POR_TIPO[tipo];
  const { extensao, contentType } = tipo === 'video' ? validarVideo(arquivo) : validarImagem(arquivo);
  const caminho = `stories/${usuarioId}-${Date.now()}.${extensao}`;
  const url = await enviarArquivoParaBucket(bucket, caminho, arquivo, contentType);

  const { data, error } = await supabase
    .from('stories')
    .insert({ usuario_id: usuarioId, trilha_id: trilhaId, tipo, url })
    .select('id, tipo, url, criado_em, expira_em, trilha_id, trilhas(id, nome)')
    .single();
  if (error) throw error;
  return data;
}

/**
 * Busca os stories ativos (não expirados) de uma lista de usuários, agrupados por
 * usuário e ordenados do mais antigo para o mais novo dentro de cada grupo.
 * @param {string[]} usuarioIds
 */
export async function listarStoriesAtivos(usuarioIds) {
  if (!usuarioIds || usuarioIds.length === 0) return [];

  const { data, error } = await supabase
    .from('stories')
    .select('id, tipo, url, criado_em, expira_em, trilha_id, usuario_id, usuarios!usuario_id(id, nome, avatar_url), trilhas(id, nome)')
    .in('usuario_id', usuarioIds)
    .gt('expira_em', new Date().toISOString())
    .order('criado_em', { ascending: true });
  if (error) throw error;

  const grupos = new Map();
  for (const story of data) {
    if (!grupos.has(story.usuario_id)) {
      grupos.set(story.usuario_id, { usuario: story.usuarios, itens: [] });
    }
    grupos.get(story.usuario_id).itens.push(story);
  }
  return [...grupos.values()];
}

export async function listarVistos(usuarioId, storyIds) {
  if (!storyIds || storyIds.length === 0) return [];
  const { data, error } = await supabase
    .from('story_visualizacoes')
    .select('story_id')
    .eq('usuario_id', usuarioId)
    .in('story_id', storyIds);
  if (error) throw error;
  return data.map((r) => r.story_id);
}

/** Quem viu um story específico — só o dono do story consegue ler isso (RLS). */
export async function listarVisualizadores(storyId) {
  const { data, error } = await supabase
    .from('story_visualizacoes')
    .select('visto_em, usuarios!usuario_id(id, nome, avatar_url)')
    .eq('story_id', storyId)
    .order('visto_em', { ascending: false });
  if (error) throw error;
  return data.map((r) => ({ ...r.usuarios, vistoEm: r.visto_em }));
}

export async function marcarVisto(storyId, usuarioId) {
  const { error } = await supabase
    .from('story_visualizacoes')
    .upsert({ story_id: storyId, usuario_id: usuarioId }, { onConflict: 'story_id,usuario_id' });
  if (error) throw error;
}

export async function excluirStory(id) {
  const { error } = await supabase.from('stories').delete().eq('id', id);
  if (error) throw error;
}
