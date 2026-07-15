import { supabase } from '../lib/supabaseClient';

export async function meuPerfilGuia(usuarioId) {
  const { data, error } = await supabase.from('guias').select('*').eq('usuario_id', usuarioId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function solicitarSerGuia(usuarioId, bio) {
  const { data, error } = await supabase
    .from('guias')
    .insert({ usuario_id: usuarioId, bio: bio || null })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function listarGuiasPendentes() {
  const { data, error } = await supabase
    .from('guias')
    .select('id, bio, criado_em, usuarios(id, nome)')
    .eq('aprovado', false)
    .order('criado_em', { ascending: false });
  if (error) throw error;
  return data;
}

export async function aprovarGuia(id) {
  const { error } = await supabase.from('guias').update({ aprovado: true }).eq('id', id);
  if (error) throw error;
}

export async function rejeitarGuia(id) {
  const { error } = await supabase.from('guias').delete().eq('id', id);
  if (error) throw error;
}

/** Entre os ids informados, retorna quais são guias aprovados. */
export async function listarGuiasAprovadosEntre(usuarioIds) {
  if (usuarioIds.length === 0) return new Set();
  const { data, error } = await supabase
    .from('guias')
    .select('usuario_id')
    .eq('aprovado', true)
    .in('usuario_id', usuarioIds);
  if (error) throw error;
  return new Set(data.map((g) => g.usuario_id));
}
