import { supabase } from '../lib/supabaseClient';

const CAMPOS_PERCURSO = 'id, distancia_km, criado_em, usuarios(id, nome, avatar_url), trilhas(id, nome)';
const CAMPOS_AVALIACAO = 'id, nota, comentario, trilha_id, criado_em, usuarios(id, nome, avatar_url), trilhas(id, nome)';
const CAMPOS_FOTO = 'id, url, legenda, localizacao, criado_em, usuarios(id, nome, avatar_url), trilhas(id, nome)';
const CAMPOS_VIDEO = 'id, url, legenda, localizacao, criado_em, usuarios(id, nome, avatar_url), trilhas(id, nome)';

function consulta(tabela, campos, seguidoIds, tamanhoPagina, cursor) {
  let q = supabase
    .from(tabela)
    .select(campos)
    .in('usuario_id', seguidoIds)
    .order('criado_em', { ascending: false })
    .limit(tamanhoPagina);
  if (cursor) q = q.lt('criado_em', cursor);
  return q;
}

/**
 * Busca uma página do feed, mesclando percursos, avaliações e fotos por data.
 * Paginação por cursor: passe `cursor` como o `criadoEm` do último item da página
 * anterior (ou null na primeira página).
 */
export async function buscarFeed(seguidoIds, tamanhoPagina = 15, cursor = null) {
  if (!seguidoIds || seguidoIds.length === 0) return { itens: [], proximoCursor: null, esgotado: true };

  const [percursosRes, avaliacoesRes, fotosRes, videosRes] = await Promise.all([
    consulta('percursos', CAMPOS_PERCURSO, seguidoIds, tamanhoPagina, cursor),
    consulta('avaliacoes', CAMPOS_AVALIACAO, seguidoIds, tamanhoPagina, cursor),
    consulta('fotos', CAMPOS_FOTO, seguidoIds, tamanhoPagina, cursor),
    consulta('videos', CAMPOS_VIDEO, seguidoIds, tamanhoPagina, cursor),
  ]);

  if (percursosRes.error) throw percursosRes.error;
  if (avaliacoesRes.error) throw avaliacoesRes.error;
  if (fotosRes.error) throw fotosRes.error;
  if (videosRes.error) throw videosRes.error;

  const percursos = percursosRes.data.map((p) => ({
    id: p.id,
    tipo: 'percurso',
    criadoEm: p.criado_em,
    usuario: p.usuarios,
    trilha: p.trilhas,
    distanciaKm: p.distancia_km,
  }));

  const avaliacoes = avaliacoesRes.data.map((a) => ({
    id: a.id,
    tipo: 'avaliacao',
    criadoEm: a.criado_em,
    usuario: a.usuarios,
    trilha: a.trilhas,
    trilhaId: a.trilha_id,
    nota: a.nota,
    comentario: a.comentario,
  }));

  const fotos = fotosRes.data.map((f) => ({
    id: f.id,
    tipo: 'foto',
    criadoEm: f.criado_em,
    usuario: f.usuarios,
    trilha: f.trilhas,
    url: f.url,
    legenda: f.legenda,
    localizacao: f.localizacao,
  }));

  const videos = videosRes.data.map((v) => ({
    id: v.id,
    tipo: 'video',
    criadoEm: v.criado_em,
    usuario: v.usuarios,
    trilha: v.trilhas,
    url: v.url,
    legenda: v.legenda,
    localizacao: v.localizacao,
  }));

  const todosOrdenados = [...percursos, ...avaliacoes, ...fotos, ...videos].sort(
    (a, b) => new Date(b.criadoEm) - new Date(a.criadoEm)
  );
  const itens = todosOrdenados.slice(0, tamanhoPagina);
  const proximoCursor = itens.length > 0 ? itens[itens.length - 1].criadoEm : cursor;

  // Não há mais dados quando nenhuma das sub-consultas devolveu uma página cheia
  // (ou seja, nenhuma tabela tem mais linhas além do cursor atual).
  const esgotado =
    percursosRes.data.length < tamanhoPagina &&
    avaliacoesRes.data.length < tamanhoPagina &&
    fotosRes.data.length < tamanhoPagina &&
    videosRes.data.length < tamanhoPagina;

  return { itens, proximoCursor, esgotado };
}

export async function buscarUltimaAtividadeEm(seguidoIds) {
  if (!seguidoIds || seguidoIds.length === 0) return null;

  const [p, a, f, v] = await Promise.all([
    supabase.from('percursos').select('criado_em').in('usuario_id', seguidoIds).order('criado_em', { ascending: false }).limit(1),
    supabase.from('avaliacoes').select('criado_em').in('usuario_id', seguidoIds).order('criado_em', { ascending: false }).limit(1),
    supabase.from('fotos').select('criado_em').in('usuario_id', seguidoIds).order('criado_em', { ascending: false }).limit(1),
    supabase.from('videos').select('criado_em').in('usuario_id', seguidoIds).order('criado_em', { ascending: false }).limit(1),
  ]);

  const datas = [p.data?.[0]?.criado_em, a.data?.[0]?.criado_em, f.data?.[0]?.criado_em, v.data?.[0]?.criado_em].filter(Boolean);
  if (datas.length === 0) return null;
  return datas.sort((x, y) => new Date(y) - new Date(x))[0];
}
