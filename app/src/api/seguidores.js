import { supabase } from '../lib/supabaseClient';

export async function seguir(seguidorId, seguidoId) {
  const { error } = await supabase.from('seguidores').insert({ seguidor_id: seguidorId, seguido_id: seguidoId });
  if (error) throw error;
}

export async function deixarDeSeguir(seguidorId, seguidoId) {
  const { error } = await supabase
    .from('seguidores')
    .delete()
    .eq('seguidor_id', seguidorId)
    .eq('seguido_id', seguidoId);
  if (error) throw error;
}

export async function estaSeguindo(seguidorId, seguidoId) {
  const { data, error } = await supabase
    .from('seguidores')
    .select('seguidor_id')
    .eq('seguidor_id', seguidorId)
    .eq('seguido_id', seguidoId)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

export async function listarSeguidos(usuarioId) {
  const { data, error } = await supabase.from('seguidores').select('seguido_id').eq('seguidor_id', usuarioId);
  if (error) throw error;
  return data.map((r) => r.seguido_id);
}

export async function contarSeguidores(usuarioId) {
  const { count, error } = await supabase
    .from('seguidores')
    .select('*', { count: 'exact', head: true })
    .eq('seguido_id', usuarioId);
  if (error) throw error;
  return count ?? 0;
}

export async function contarSeguindo(usuarioId) {
  const { count, error } = await supabase
    .from('seguidores')
    .select('*', { count: 'exact', head: true })
    .eq('seguidor_id', usuarioId);
  if (error) throw error;
  return count ?? 0;
}

/** Trilheiros que seguem o usuário informado. */
export async function listarSeguidoresComPerfil(usuarioId) {
  const { data, error } = await supabase
    .from('seguidores')
    .select('criado_em, usuarios!seguidor_id(id, nome, avatar_url)')
    .eq('seguido_id', usuarioId)
    .order('criado_em', { ascending: false });
  if (error) throw error;
  return data.map((r) => r.usuarios);
}

/** Trilheiros que o usuário informado segue. */
export async function listarSeguindoComPerfil(usuarioId) {
  const { data, error } = await supabase
    .from('seguidores')
    .select('criado_em, usuarios!seguido_id(id, nome, avatar_url)')
    .eq('seguidor_id', usuarioId)
    .order('criado_em', { ascending: false });
  if (error) throw error;
  return data.map((r) => r.usuarios);
}
