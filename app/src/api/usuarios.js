import { supabase } from '../lib/supabaseClient';

const BUCKET_AVATARES = 'avatares';

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
  const extensao = arquivo.name.split('.').pop();
  const caminho = `${authUserId}/${Date.now()}.${extensao}`;

  const { error: erroUpload } = await supabase.storage.from(BUCKET_AVATARES).upload(caminho, arquivo);
  if (erroUpload) throw erroUpload;

  const { data: publicUrlData } = supabase.storage.from(BUCKET_AVATARES).getPublicUrl(caminho);
  return publicUrlData.publicUrl;
}
