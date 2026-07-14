import { supabase } from '../lib/supabaseClient';

export async function listarComentariosItem(tipoAlvo, alvoId) {
  const { data, error } = await supabase
    .from('feed_comentarios')
    .select('id, texto, criado_em, usuario_id, usuarios(id, nome, avatar_url)')
    .eq('tipo_alvo', tipoAlvo)
    .eq('alvo_id', alvoId)
    .order('criado_em', { ascending: true });
  if (error) throw error;
  return data;
}

/**
 * Busca, em lote, quantos comentários cada item do feed tem.
 * @param {{tipo: string, id: string}[]} itens
 */
export async function contarComentariosEmLote(itens) {
  const resultado = {};
  for (const item of itens) resultado[`${item.tipo}:${item.id}`] = 0;
  if (itens.length === 0) return resultado;

  const porTipo = itens.reduce((acc, item) => {
    (acc[item.tipo] ??= []).push(item.id);
    return acc;
  }, {});

  await Promise.all(
    Object.entries(porTipo).map(async ([tipo, ids]) => {
      const { data, error } = await supabase.rpc('comentarios_contagem', { p_tipo: tipo, p_ids: ids });
      if (error) {
        console.error(`Não foi possível carregar comentários do tipo "${tipo}":`, error);
        return;
      }
      for (const row of data) resultado[`${tipo}:${row.alvo_id}`] = Number(row.total);
    })
  );

  return resultado;
}

export async function criarComentarioItem(usuarioId, tipoAlvo, alvoId, texto) {
  const { data, error } = await supabase
    .from('feed_comentarios')
    .insert({ usuario_id: usuarioId, tipo_alvo: tipoAlvo, alvo_id: alvoId, texto })
    .select('id, texto, criado_em, usuario_id, usuarios(id, nome, avatar_url)')
    .single();
  if (error) throw error;
  return data;
}

export async function excluirComentarioItem(id) {
  const { error } = await supabase.from('feed_comentarios').delete().eq('id', id);
  if (error) throw error;
}
