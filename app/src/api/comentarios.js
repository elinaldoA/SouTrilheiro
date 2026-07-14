import { supabase } from '../lib/supabaseClient';

export async function listarComentarios(trilhaId) {
  const { data, error } = await supabase
    .from('comentarios')
    .select('id, tipo, km_referencia, texto, criado_em, usuarios(id, nome)')
    .eq('trilha_id', trilhaId)
    .order('criado_em', { ascending: false });
  if (error) throw error;
  return data;
}

export async function enviarComentario(trilhaId, usuarioId, { tipo, kmReferencia, texto }) {
  const { data, error } = await supabase
    .from('comentarios')
    .insert({
      trilha_id: trilhaId,
      usuario_id: usuarioId,
      tipo,
      km_referencia: kmReferencia || null,
      texto,
    })
    .select('id, tipo, km_referencia, texto, criado_em, usuarios(id, nome)')
    .single();
  if (error) throw error;
  return data;
}
