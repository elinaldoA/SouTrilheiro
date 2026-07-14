import { supabase } from '../lib/supabaseClient';

async function comVagasOcupadas(saidas) {
  if (saidas.length === 0) return [];
  const { data, error } = await supabase.rpc('saidas_vagas_ocupadas', { p_ids: saidas.map((s) => s.id) });
  if (error) throw error;
  const ocupadasPorId = Object.fromEntries((data ?? []).map((r) => [r.saida_id, Number(r.ocupadas)]));
  return saidas.map((s) => ({ ...s, vagasOcupadas: ocupadasPorId[s.id] ?? 0 }));
}

export async function listarSaidasDaTrilha(trilhaId, usuarioId) {
  let query = supabase
    .from('saidas_guiadas')
    .select(
      'id, data_hora, vagas_total, preco, ponto_encontro, observacoes, status, guias(id, usuarios(id, nome)), inscricoes_saida(usuario_id, status)'
    )
    .eq('trilha_id', trilhaId)
    .eq('status', 'agendada')
    .order('data_hora', { ascending: true });

  if (usuarioId) {
    query = query.eq('inscricoes_saida.usuario_id', usuarioId).eq('inscricoes_saida.status', 'confirmada');
  }

  const { data, error } = await query;
  if (error) throw error;
  const comInscrito = (data ?? []).map((s) => ({ ...s, inscrito: (s.inscricoes_saida ?? []).length > 0 }));
  return comVagasOcupadas(comInscrito);
}

export async function listarSaidasDoGuia(guiaId) {
  const { data, error } = await supabase
    .from('saidas_guiadas')
    .select('id, data_hora, vagas_total, preco, ponto_encontro, status, trilhas(id, nome)')
    .eq('guia_id', guiaId)
    .order('data_hora', { ascending: true });
  if (error) throw error;
  return comVagasOcupadas(data ?? []);
}

export async function criarSaida(guiaId, trilhaId, dados) {
  const { data, error } = await supabase
    .from('saidas_guiadas')
    .insert({
      trilha_id: trilhaId,
      guia_id: guiaId,
      data_hora: dados.dataHora,
      vagas_total: dados.vagasTotal,
      preco: dados.preco || null,
      ponto_encontro: dados.pontoEncontro || null,
      observacoes: dados.observacoes || null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function minhaInscricaoNaSaida(saidaId, usuarioId) {
  const { data, error } = await supabase
    .from('inscricoes_saida')
    .select('*')
    .eq('saida_id', saidaId)
    .eq('usuario_id', usuarioId)
    .eq('status', 'confirmada')
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function inscreverNaSaida(saidaId, usuarioId) {
  const { data, error } = await supabase
    .from('inscricoes_saida')
    .insert({ saida_id: saidaId, usuario_id: usuarioId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function cancelarInscricao(saidaId, usuarioId) {
  const { error } = await supabase
    .from('inscricoes_saida')
    .delete()
    .eq('saida_id', saidaId)
    .eq('usuario_id', usuarioId);
  if (error) throw error;
}
