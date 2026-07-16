import { supabase } from '../lib/supabaseClient';
import { validarImagem, enviarArquivoParaBucket } from '../lib/uploadSeguro';

const BUCKET = 'fotos-trilhas';
const CAMPOS = 'id, url, legenda, localizacao, criado_em, usuarios(id, nome)';

export async function enviarFoto(trilhaId, usuarioId, arquivo, legenda, localizacao) {
  const { extensao, contentType } = validarImagem(arquivo);
  const pasta = trilhaId ?? `${usuarioId}/feed`;
  const caminho = `${pasta}/${usuarioId}-${Date.now()}.${extensao}`;
  const url = await enviarArquivoParaBucket(BUCKET, caminho, arquivo, contentType);

  const { data, error } = await supabase
    .from('fotos')
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

export async function listarFotos(trilhaId) {
  const { data, error } = await supabase.from('fotos').select(CAMPOS).eq('trilha_id', trilhaId).order('criado_em', { ascending: false });
  if (error) throw error;
  return data;
}

export async function atualizarFoto(id, legenda, localizacao) {
  const { data, error } = await supabase
    .from('fotos')
    .update({ legenda: legenda || null, localizacao: localizacao || null })
    .eq('id', id)
    .select(CAMPOS)
    .single();
  if (error) throw error;
  return data;
}

export async function excluirFoto(id) {
  const { error } = await supabase.from('fotos').delete().eq('id', id);
  if (error) throw error;
}
