import { supabase } from '../lib/supabaseClient';

const CAMPOS_PERCURSO = 'id, distancia_km, path_geojson, criado_em, usuarios(id, nome, avatar_url), trilhas(id, nome)';
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

const TABELAS = {
  percursos: { campos: CAMPOS_PERCURSO, tipo: 'percurso' },
  avaliacoes: { campos: CAMPOS_AVALIACAO, tipo: 'avaliacao' },
  fotos: { campos: CAMPOS_FOTO, tipo: 'foto' },
  videos: { campos: CAMPOS_VIDEO, tipo: 'video' },
};

const TABELA_POR_TIPO = Object.fromEntries(Object.entries(TABELAS).map(([tabela, v]) => [v.tipo, tabela]));

function mapearLinha(tabela, tipo, linha) {
  const base = { id: linha.id, tipo, criadoEm: linha.criado_em, usuario: linha.usuarios, trilha: linha.trilhas };
  if (tabela === 'percursos') return { ...base, distanciaKm: linha.distancia_km, pathGeojson: linha.path_geojson };
  if (tabela === 'avaliacoes') return { ...base, trilhaId: linha.trilha_id, nota: linha.nota, comentario: linha.comentario };
  return { ...base, url: linha.url, legenda: linha.legenda, localizacao: linha.localizacao };
}

/**
 * Busca uma página do feed, mesclando percursos, avaliações, fotos e vídeos por data.
 * Paginação por cursor: passe `cursor` como o `criadoEm` do último item da página
 * anterior (ou null na primeira página).
 * @param {string[]} tabelas Subconjunto de ['percursos','avaliacoes','fotos','videos'] a consultar (padrão: todas).
 */
export async function buscarFeed(seguidoIds, tamanhoPagina = 15, cursor = null, tabelas = null) {
  if (!seguidoIds || seguidoIds.length === 0) return { itens: [], proximoCursor: null, esgotado: true };

  const tabelasAlvo = tabelas ?? Object.keys(TABELAS);

  const resultados = await Promise.all(
    tabelasAlvo.map((tabela) => consulta(tabela, TABELAS[tabela].campos, seguidoIds, tamanhoPagina, cursor))
  );

  resultados.forEach((r) => {
    if (r.error) throw r.error;
  });

  const todos = tabelasAlvo.flatMap((tabela, i) =>
    resultados[i].data.map((linha) => mapearLinha(tabela, TABELAS[tabela].tipo, linha))
  );
  const todosOrdenados = todos.sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));
  const itens = todosOrdenados.slice(0, tamanhoPagina);
  const proximoCursor = itens.length > 0 ? itens[itens.length - 1].criadoEm : cursor;

  // Não há mais dados quando nenhuma das sub-consultas devolveu uma página cheia
  // (ou seja, nenhuma tabela tem mais linhas além do cursor atual).
  const esgotado = resultados.every((r) => r.data.length < tamanhoPagina);

  return { itens, proximoCursor, esgotado };
}

/**
 * Busca itens específicos do feed por tipo + id (não depende de quem o usuário segue).
 * Usado pela tela de "Salvos". Itens não encontrados (ex: excluídos depois de salvos) são omitidos.
 * @param {{tipo: string, id: string}[]} pares
 */
export async function buscarItensPorTipoEId(pares) {
  if (!pares || pares.length === 0) return [];

  const idsPorTabela = pares.reduce((acc, { tipo, id }) => {
    const tabela = TABELA_POR_TIPO[tipo];
    if (tabela) (acc[tabela] ??= []).push(id);
    return acc;
  }, {});

  const tabelas = Object.keys(idsPorTabela);
  const resultados = await Promise.all(
    tabelas.map((tabela) => supabase.from(tabela).select(TABELAS[tabela].campos).in('id', idsPorTabela[tabela]))
  );

  resultados.forEach((r) => {
    if (r.error) throw r.error;
  });

  return tabelas.flatMap((tabela, i) =>
    resultados[i].data.map((linha) => mapearLinha(tabela, TABELAS[tabela].tipo, linha))
  );
}

/**
 * Soma a distância percorrida (em km) nos últimos 7 dias por um grupo de usuários
 * (tipicamente o próprio usuário + quem ele segue), pro resumo semanal do feed.
 * @param {string[]} usuarioIds
 */
export async function buscarResumoSemanal(usuarioIds) {
  if (!usuarioIds || usuarioIds.length === 0) return null;

  const desde = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('percursos')
    .select('distancia_km, usuario_id')
    .in('usuario_id', usuarioIds)
    .gte('criado_em', desde);
  if (error) throw error;
  if (data.length === 0) return null;

  const totalKm = data.reduce((soma, p) => soma + Number(p.distancia_km ?? 0), 0);
  const participantes = new Set(data.map((p) => p.usuario_id)).size;
  return { totalKm, participantes };
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
