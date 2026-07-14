import { supabase } from '../lib/supabaseClient';

/**
 * @param {{usuarioId: string, textoMarcador: string}[]} mencoes
 */
export async function salvarMencoes(tipoAlvo, alvoId, criadoPorId, mencoes) {
  if (!mencoes || mencoes.length === 0) return;
  const linhas = mencoes.map((m) => ({
    tipo_alvo: tipoAlvo,
    alvo_id: alvoId,
    usuario_mencionado_id: m.usuarioId,
    criado_por: criadoPorId,
    texto_marcador: m.textoMarcador,
  }));
  const { error } = await supabase.from('mencoes').insert(linhas);
  if (error) throw error;
}

/**
 * Busca, em lote, as menções de cada item (para linkar "@Nome" dentro da legenda).
 * @param {{tipo: string, id: string}[]} itens
 * @returns {Promise<Record<string, {usuarioId: string, textoMarcador: string}[]>>}
 */
export async function listarMencoesEmLote(itens) {
  const resultado = {};
  for (const item of itens) resultado[`${item.tipo}:${item.id}`] = [];
  if (itens.length === 0) return resultado;

  const porTipo = itens.reduce((acc, item) => {
    (acc[item.tipo] ??= []).push(item.id);
    return acc;
  }, {});

  await Promise.all(
    Object.entries(porTipo).map(async ([tipo, ids]) => {
      const { data, error } = await supabase
        .from('mencoes')
        .select('alvo_id, usuario_mencionado_id, texto_marcador')
        .eq('tipo_alvo', tipo)
        .in('alvo_id', ids);
      if (error) {
        console.error(`Não foi possível carregar menções do tipo "${tipo}":`, error);
        return;
      }
      for (const row of data) {
        resultado[`${tipo}:${row.alvo_id}`].push({ usuarioId: row.usuario_mencionado_id, textoMarcador: row.texto_marcador });
      }
    })
  );

  return resultado;
}
