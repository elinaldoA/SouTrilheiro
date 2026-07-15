import { supabase } from '../lib/supabaseClient';

export async function curtir(usuarioId, tipoAlvo, alvoId, reacao = 'adorei') {
  const { error } = await supabase
    .from('curtidas')
    .upsert(
      { usuario_id: usuarioId, tipo_alvo: tipoAlvo, alvo_id: alvoId, reacao },
      { onConflict: 'usuario_id,tipo_alvo,alvo_id' }
    );
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
 * Busca, em lote, quantas curtidas cada item tem, se o usuário atual já reagiu, com
 * qual reação, e a contagem por tipo de reação. Usa a função agregada `curtidas_resumo`
 * no banco em vez de trazer todas as linhas.
 * @param {{tipo: string, id: string}[]} itens
 */
export async function buscarCurtidasEmLote(itens) {
  const resultado = {};
  for (const item of itens) resultado[`${item.tipo}:${item.id}`] = { total: 0, curtido: false, minhaReacao: null, porReacao: {} };
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
        resultado[`${tipo}:${row.alvo_id}`] = {
          total: Number(row.total),
          curtido: row.curtido ?? false,
          minhaReacao: row.minha_reacao ?? null,
          porReacao: row.contagem ?? {},
        };
      }
    })
  );

  return resultado;
}

/**
 * Calcula o próximo estado otimista de curtidas ao reagir com `reacao`.
 * Reagir de novo com a mesma reação já ativa remove a curtida; qualquer outra
 * reação substitui a anterior.
 * @returns {{ estado: object, remover: boolean }}
 */
export function aplicarReacaoOtimista(atual, reacao) {
  const base = atual ?? { total: 0, curtido: false, minhaReacao: null, porReacao: {} };
  const remover = base.curtido && base.minhaReacao === reacao;

  const porReacao = { ...base.porReacao };
  if (base.curtido) porReacao[base.minhaReacao] = Math.max(0, (porReacao[base.minhaReacao] ?? 1) - 1);
  if (!remover) porReacao[reacao] = (porReacao[reacao] ?? 0) + 1;

  const total = remover ? base.total - 1 : base.curtido ? base.total : base.total + 1;

  return { estado: { total, curtido: !remover, minhaReacao: remover ? null : reacao, porReacao }, remover };
}
