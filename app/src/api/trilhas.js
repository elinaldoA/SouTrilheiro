import { supabase } from '../lib/supabaseClient';
import { distanciaKm } from '../lib/geo';

/**
 * @param {{ origem?: {lat:number,lng:number}, dificuldade?: string, distanciaMax?: number, termo?: string, categoria?: string, estado?: string, tipoPreco?: string }} filtros
 */
export async function buscarTrilhas(filtros = {}) {
  let query = supabase
    .from('trilhas')
    .select(
      'id, nome, cidade, estado, distancia_km, elevacao_m, tempo_estimado_min, dificuldade, categoria, tipo_preco, preco, lat, lng, avaliacoes(nota), fotos(url)'
    )
    .eq('status', 'publicada')
    .order('criado_em', { foreignTable: 'fotos', ascending: false })
    .limit(1, { foreignTable: 'fotos' });

  if (filtros.dificuldade) {
    query = query.eq('dificuldade', filtros.dificuldade);
  }
  if (filtros.distanciaMax) {
    query = query.lte('distancia_km', filtros.distanciaMax);
  }
  if (filtros.categoria) {
    query = query.eq('categoria', filtros.categoria);
  }
  if (filtros.estado) {
    query = query.eq('estado', filtros.estado);
  }
  if (filtros.tipoPreco) {
    query = query.eq('tipo_preco', filtros.tipoPreco);
  }
  if (filtros.termo) {
    query = query.or(`nome.ilike.%${filtros.termo}%,cidade.ilike.%${filtros.termo}%`);
  }

  const { data, error } = await query;
  if (error) throw error;

  const comMetricas = (data ?? []).map((trilha) => {
    const notas = trilha.avaliacoes?.map((a) => a.nota) ?? [];
    const notaMedia = notas.length ? notas.reduce((s, n) => s + n, 0) / notas.length : null;
    const distanciaUsuarioKm = filtros.origem
      ? distanciaKm(filtros.origem.lat, filtros.origem.lng, trilha.lat, trilha.lng)
      : null;
    const fotoUrl = trilha.fotos?.[0]?.url ?? null;
    return { ...trilha, notaMedia, distanciaUsuarioKm, fotoUrl };
  });

  if (filtros.origem) {
    comMetricas.sort((a, b) => a.distanciaUsuarioKm - b.distanciaUsuarioKm);
  } else {
    comMetricas.sort((a, b) => a.nome.localeCompare(b.nome));
  }

  return comMetricas;
}

export async function buscarTrilhaPorId(id) {
  const { data, error } = await supabase
    .from('trilhas')
    .select('*, avaliacoes(usuario_id, nota, comentario, criado_em)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function cadastrarTrilha(usuarioId, dados) {
  const { data, error } = await supabase
    .from('trilhas')
    .insert({
      nome: dados.nome,
      descricao: dados.descricao || null,
      cidade: dados.cidade,
      estado: dados.estado.toUpperCase(),
      distancia_km: dados.distanciaKm,
      elevacao_m: dados.elevacaoM,
      tempo_estimado_min: dados.tempoEstimadoMin,
      dificuldade: dados.dificuldade,
      categoria: dados.categoria,
      tipo_preco: dados.tipoPreco,
      preco: dados.tipoPreco === 'paga' ? dados.preco : null,
      lat: dados.lat,
      lng: dados.lng,
      path_geojson: dados.pathGeojson,
      status: dados.publicarDireto ? 'publicada' : 'pendente_revisao',
      criado_por: usuarioId,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function listarTrilhasDoUsuario(usuarioId) {
  const { data, error } = await supabase
    .from('trilhas')
    .select(
      'id, nome, cidade, estado, distancia_km, elevacao_m, tempo_estimado_min, dificuldade, categoria, tipo_preco, preco, status, criado_em, lat, lng, path_geojson, fotos(url)'
    )
    .eq('criado_por', usuarioId)
    .order('criado_em', { foreignTable: 'fotos', ascending: false })
    .limit(1, { foreignTable: 'fotos' })
    .order('criado_em', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((t) => ({ ...t, fotoUrl: t.fotos?.[0]?.url ?? null }));
}

export async function listarTodasTrilhas() {
  const { data, error } = await supabase
    .from('trilhas')
    .select(
      'id, nome, cidade, estado, distancia_km, elevacao_m, tempo_estimado_min, dificuldade, categoria, tipo_preco, preco, status, criado_em, lat, lng, path_geojson, fotos(url)'
    )
    .order('criado_em', { foreignTable: 'fotos', ascending: false })
    .limit(1, { foreignTable: 'fotos' })
    .order('criado_em', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((t) => ({ ...t, fotoUrl: t.fotos?.[0]?.url ?? null }));
}

export async function atualizarTrilha(id, dados) {
  const atualizacao = {
    nome: dados.nome,
    descricao: dados.descricao || null,
    cidade: dados.cidade,
    estado: dados.estado.toUpperCase(),
    distancia_km: dados.distanciaKm,
    elevacao_m: dados.elevacaoM,
    tempo_estimado_min: dados.tempoEstimadoMin,
    dificuldade: dados.dificuldade,
    categoria: dados.categoria,
    tipo_preco: dados.tipoPreco,
    preco: dados.tipoPreco === 'paga' ? dados.preco : null,
    atualizado_em: new Date().toISOString(),
  };
  if (dados.lat != null && dados.lng != null) {
    atualizacao.lat = dados.lat;
    atualizacao.lng = dados.lng;
  }
  if (dados.pathGeojson !== undefined) {
    atualizacao.path_geojson = dados.pathGeojson;
  }

  const { data, error } = await supabase.from('trilhas').update(atualizacao).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function excluirTrilha(id) {
  const { error } = await supabase.from('trilhas').delete().eq('id', id);
  if (error) throw error;
}
