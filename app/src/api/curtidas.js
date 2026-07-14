import { supabase } from '../lib/supabaseClient';

export async function curtir(usuarioId, tipoAlvo, alvoId) {
  const { error } = await supabase.from('curtidas').insert({ usuario_id: usuarioId, tipo_alvo: tipoAlvo, alvo_id: alvoId });
  if (error) throw error;
}

export async function descurtir(usuarioId, tipoAlvo, alvoId) {
  const { error } = await supabase
    .from('curtidas')
    .delete()
    .eq('usuario_id', usuarioId)
    .eq('tipo_alvo', tipoAlvo)
    .eq('alvo_id', alvoId);
  if (error) throw error;
}

/**
 * Busca, em lote, quantas curtidas cada item tem e se o usuário atual já curtiu.
 * Usa a função agregada `curtidas_resumo` no banco em vez de trazer todas as linhas.
 * @param {{tipo: string, id: string}[]} itens
 */
export async function buscarCurtidasEmLote(itens) {
  const resultado = {};
  for (const item of itens) resultado[`${item.tipo}:${item.id}`] = { total: 0, curtido: false };
  if (itens.length === 0) return resultado;

  const porTipo = itens.reduce((acc, item) => {
    (acc[item.tipo] ??= []).push(item.id);
    return acc;
  }, {});

  await Promise.all(
    Object.entries(porTipo).map(async ([tipo, ids]) => {
      const { data, error } = await supabase.rpc('curtidas_resumo', { p_tipo: tipo, p_ids: ids });
      if (error) {
        console.error(`Não foi possível carregar curtidas do tipo "${tipo}":`, error);
        return;
      }
      for (const row of data) {
        resultado[`${tipo}:${row.alvo_id}`] = { total: Number(row.total), curtido: row.curtido ?? false };
      }
    })
  );

  return resultado;
}
