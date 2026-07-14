import { supabase } from '../lib/supabaseClient';

export async function listarTrilhasPendentes() {
  const { data, error } = await supabase
    .from('trilhas')
    .select('id, nome, cidade, estado, dificuldade, criado_em, criado_por, usuarios(nome)')
    .eq('status', 'pendente_revisao')
    .order('criado_em', { ascending: false });
  if (error) throw error;
  return data;
}

export async function aprovarTrilha(id) {
  const { error } = await supabase.from('trilhas').update({ status: 'publicada' }).eq('id', id);
  if (error) throw error;
}

export async function rejeitarTrilha(id) {
  const { error } = await supabase.from('trilhas').delete().eq('id', id);
  if (error) throw error;
}

export async function criarDenuncia(usuarioId, tipoAlvo, alvoId, motivo) {
  const { error } = await supabase
    .from('denuncias')
    .insert({ usuario_id: usuarioId, tipo_alvo: tipoAlvo, alvo_id: alvoId, motivo });
  if (error) throw error;
}

export async function listarDenunciasPendentes() {
  const { data, error } = await supabase
    .from('denuncias')
    .select('id, tipo_alvo, alvo_id, motivo, criado_em, usuarios(nome)')
    .eq('status', 'pendente')
    .order('criado_em', { ascending: false });
  if (error) throw error;
  return data;
}

export async function resolverDenuncia(id, status) {
  const { error } = await supabase.from('denuncias').update({ status }).eq('id', id);
  if (error) throw error;
}
