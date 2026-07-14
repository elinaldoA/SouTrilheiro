import { supabase } from '../lib/supabaseClient';

export async function salvarPercurso(usuarioId, dados) {
  const { data, error } = await supabase
    .from('percursos')
    .insert({
      usuario_id: usuarioId,
      trilha_id: dados.trilhaId,
      distancia_km: dados.distanciaKm,
      duracao_seg: dados.duracaoSeg,
      elevacao_m: dados.elevacaoM,
      path_geojson: dados.pathGeojson,
      iniciado_em: dados.iniciadoEm,
      finalizado_em: dados.finalizadoEm,
      nota_percurso: dados.notaPercurso,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function listarPercursos(usuarioId) {
  const { data, error } = await supabase
    .from('percursos')
    .select('id, trilha_id, distancia_km, duracao_seg, elevacao_m, criado_em, trilhas(nome)')
    .eq('usuario_id', usuarioId)
    .order('criado_em', { ascending: false });
  if (error) throw error;
  return data;
}

export async function buscarPercursoPorId(id) {
  const { data, error } = await supabase
    .from('percursos')
    .select('id, trilha_id, distancia_km, duracao_seg, elevacao_m, path_geojson, nota_percurso, criado_em, trilhas(nome)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function excluirPercurso(id) {
  const { error } = await supabase.from('percursos').delete().eq('id', id);
  if (error) throw error;
}
