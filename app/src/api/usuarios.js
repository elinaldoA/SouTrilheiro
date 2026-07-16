import { supabase } from '../lib/supabaseClient';
import { validarImagem, enviarArquivoParaBucket } from '../lib/uploadSeguro';

const BUCKET_AVATARES = 'avatares';
const TAMANHO_MAXIMO_AVATAR = 5 * 1024 * 1024;

export async function listarUsuarios(excluirId) {
  const { data, error } = await supabase
    .from('usuarios')
    .select('id, nome, avatar_url')
    .neq('id', excluirId)
    .order('nome')
    .limit(50);
  if (error) throw error;
  return data;
}

export async function buscarUsuariosPorNome(termo, excluirId) {
  if (!termo || !termo.trim()) return [];
  let q = supabase.from('usuarios').select('id, nome, avatar_url').ilike('nome', `%${termo.trim()}%`).order('nome').limit(8);
  if (excluirId) q = q.neq('id', excluirId);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export async function enviarAvatar(authUserId, arquivo) {
  const { extensao, contentType } = validarImagem(arquivo);
  if (arquivo.size > TAMANHO_MAXIMO_AVATAR) throw new Error('Avatar maior que 5MB.');
  const caminho = `${authUserId}/${Date.now()}.${extensao}`;
  return enviarArquivoParaBucket(BUCKET_AVATARES, caminho, arquivo, contentType);
}
