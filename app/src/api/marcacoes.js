import { supabase } from '../lib/supabaseClient';

export async function excluirMarcacao(id) {
  const { error } = await supabase.from('marcacoes').delete().eq('id', id);
  if (error) throw error;
}

export async function marcarPessoas(tipoAlvo, alvoId, criadoPorId, usuarioIds) {
  if (!usuarioIds || usuarioIds.length === 0) return;
  const linhas = usuarioIds.map((usuarioMarcadoId) => ({
    tipo_alvo: tipoAlvo,
    alvo_id: alvoId,
    usuario_marcado_id: usuarioMarcadoId,
    criado_por: criadoPorId,
  }));
  const { error } = await supabase.from('marcacoes').insert(linhas);
  if (error) throw error;
}

/**
 * Busca, em lote, quem foi marcado em cada item.
 * @param {{tipo: string, id: string}[]} itens
 * @returns {Promise<Record<string, {id: string, nome: string, avatar_url: string}[]>>}
 */
export async function listarMarcacoesEmLote(itens) {
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
        .from('marcacoes')
        .select('alvo_id, usuarios:usuario_marcado_id(id, nome, avatar_url)')
        .eq('tipo_alvo', tipo)
        .in('alvo_id', ids);
      if (error) {
        console.error(`Não foi possível carregar marcações do tipo "${tipo}":`, error);
        return;
      }
      for (const row of data) {
        resultado[`${tipo}:${row.alvo_id}`].push(row.usuarios);
      }
    })
  );

  return resultado;
}
