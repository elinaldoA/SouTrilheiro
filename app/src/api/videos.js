import { supabase } from '../lib/supabaseClient';
import { validarVideo, enviarArquivoParaBucket } from '../lib/uploadSeguro';

const BUCKET = 'videos-trilhas';
const CAMPOS = 'id, url, legenda, localizacao, criado_em, usuarios(id, nome)';

export async function enviarVideo(trilhaId, usuarioId, arquivo, legenda, localizacao) {
  const { extensao, contentType } = validarVideo(arquivo);
  const pasta = trilhaId ?? `${usuarioId}/feed`;
  const caminho = `${pasta}/${usuarioId}-${Date.now()}.${extensao}`;
  const url = await enviarArquivoParaBucket(BUCKET, caminho, arquivo, contentType);

  const { data, error } = await supabase
    .from('videos')
    .insert({
      trilha_id: trilhaId ?? null,
      usuario_id: usuarioId,
      url,
      legenda: legenda || null,
      localizacao: localizacao || null,
    })
    .select(CAMPOS)
    .single();
  if (error) throw error;
  return data;
}

export async function listarVideos(trilhaId) {
  const { data, error } = await supabase.from('videos').select(CAMPOS).eq('trilha_id', trilhaId).order('criado_em', { ascending: false });
  if (error) throw error;
  return data;
}

export async function atualizarVideo(id, legenda, localizacao) {
  const { data, error } = await supabase
    .from('videos')
    .update({ legenda: legenda || null, localizacao: localizacao || null })
    .eq('id', id)
    .select(CAMPOS)
    .single();
  if (error) throw error;
  return data;
}

export async function excluirVideo(id) {
  const { error } = await supabase.from('videos').delete().eq('id', id);
  if (error) throw error;
}
