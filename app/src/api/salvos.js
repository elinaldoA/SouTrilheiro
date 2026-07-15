import { supabase } from '../lib/supabaseClient';
import { buscarItensPorTipoEId } from './feed';

export async function salvarItem(usuarioId, tipoAlvo, alvoId) {
  const { error } = await supabase.from('salvos').insert({ usuario_id: usuarioId, tipo_alvo: tipoAlvo, alvo_id: alvoId });
  if (error) throw error;
}

export async function removerSalvo(usuarioId, tipoAlvo, alvoId) {
  const { error } = await supabase
    .from('salvos')
    .delete()
    .eq('usuario_id', usuarioId)
    .eq('tipo_alvo', tipoAlvo)
    .eq('alvo_id', alvoId);
  if (error) throw error;
}

/** Devolve o conjunto de chaves "tipo:id" que o usuário já salvou, dentre os itens informados. */
export async function listarSalvosEmLote(usuarioId, itens) {
  const vazio = new Set();
  if (!itens || itens.length === 0) return vazio;

  const { data, error } = await supabase.from('salvos').select('tipo_alvo, alvo_id').eq('usuario_id', usuarioId);
  if (error) throw error;

  const chavesConhecidas = new Set(itens.map((i) => `${i.tipo}:${i.id}`));
  for (const row of data) {
    const chave = `${row.tipo_alvo}:${row.alvo_id}`;
    if (chavesConhecidas.has(chave)) vazio.add(chave);
  }
  return vazio;
}

/** Busca os itens completos que o usuário salvou, mais recentes primeiro. */
export async function listarItensSalvos(usuarioId) {
  const { data, error } = await supabase
    .from('salvos')
    .select('tipo_alvo, alvo_id, criado_em')
    .eq('usuario_id', usuarioId)
    .order('criado_em', { ascending: false });
  if (error) throw error;
  if (data.length === 0) return [];

  const itens = await buscarItensPorTipoEId(data.map((r) => ({ tipo: r.tipo_alvo, id: r.alvo_id })));
  const itensPorChave = new Map(itens.map((i) => [`${i.tipo}:${i.id}`, i]));

  return data
    .map((r) => itensPorChave.get(`${r.tipo_alvo}:${r.alvo_id}`))
    .filter(Boolean);
}
