import { supabase } from '../lib/supabaseClient';

export async function enviarAvaliacao(trilhaId, usuarioId, nota, comentario) {
  const { data, error } = await supabase
    .from('avaliacoes')
    .upsert(
      { trilha_id: trilhaId, usuario_id: usuarioId, nota, comentario: comentario || null },
      { onConflict: 'trilha_id,usuario_id' }
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function excluirAvaliacao(id) {
  const { error } = await supabase.from('avaliacoes').delete().eq('id', id);
  if (error) throw error;
}
