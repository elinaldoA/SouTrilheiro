import { supabase } from '../lib/supabaseClient';
import { atualizarTrilha } from './trilhas';

export async function proporTracado(usuarioId, percurso) {
  const { data, error } = await supabase
    .from('tracados_propostos')
    .insert({
      trilha_id: percurso.trilhaId,
      usuario_id: usuarioId,
      percurso_id: percurso.id,
      path_geojson: percurso.pathGeojson,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function buscarTracadoPropostoPorPercurso(percursoId) {
  const { data, error } = await supabase
    .from('tracados_propostos')
    .select('id, status')
    .eq('percurso_id', percursoId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function listarTracadosPropostosPendentes() {
  const { data, error } = await supabase
    .from('tracados_propostos')
    .select('id, trilha_id, usuario_id, path_geojson, criado_em, trilhas(nome, path_geojson), usuarios(nome)')
    .eq('status', 'pendente')
    .order('criado_em', { ascending: false });
  if (error) throw error;
  return data;
}

export async function listarTracadosPropostosDoGuia(usuarioId) {
  const { data, error } = await supabase
    .from('tracados_propostos')
    .select(
      'id, trilha_id, usuario_id, path_geojson, criado_em, trilhas!inner(nome, path_geojson, criado_por), usuarios(nome)'
    )
    .eq('status', 'pendente')
    .eq('trilhas.criado_por', usuarioId)
    .order('criado_em', { ascending: false });
  if (error) throw error;
  return data;
}

export async function aprovarTracadoProposto(id, trilhaId, pathGeojson) {
  await atualizarTrilha(trilhaId, { pathGeojson });
  const { error } = await supabase
    .from('tracados_propostos')
    .update({ status: 'aprovado', resolvido_em: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function rejeitarTracadoProposto(id) {
  const { error } = await supabase
    .from('tracados_propostos')
    .update({ status: 'rejeitado', resolvido_em: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}
