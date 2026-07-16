import { supabase } from '../lib/supabaseClient';
import { TABELAS, mapearLinha } from './feed';

const CAMPOS_COMENTARIO_FEED = 'id, texto, tipo_alvo, alvo_id, criado_em, usuarios(id, nome, avatar_url)';
const CAMPOS_STORY = 'id, tipo, url, criado_em, expira_em, trilha_id, usuarios!usuario_id(id, nome, avatar_url), trilhas(id, nome)';

/**
 * Lista usuários para o backoffice (nome, e-mail, status), paginado e buscável por nome/e-mail.
 * Usa a função admin_listar_usuarios (security definer), já que a tabela usuarios não guarda e-mail.
 */
export async function listarUsuariosAdmin({ termo = null, limite = 20, offset = 0 } = {}) {
  const { data, error } = await supabase.rpc('admin_listar_usuarios', { p_termo: termo, p_limite: limite, p_offset: offset });
  if (error) throw error;
  const total = data?.[0]?.total_geral ? Number(data[0].total_geral) : 0;
  return { usuarios: data ?? [], total };
}

export async function definirAdmin(id, valor) {
  const { error } = await supabase.from('usuarios').update({ is_admin: valor }).eq('id', id);
  if (error) throw error;
}

export async function banirUsuario(id, motivo) {
  const { error } = await supabase
    .from('usuarios')
    .update({ banido: true, banido_em: new Date().toISOString(), banido_motivo: motivo || null })
    .eq('id', id);
  if (error) throw error;
}

export async function desbanirUsuario(id) {
  const { error } = await supabase.from('usuarios').update({ banido: false, banido_em: null, banido_motivo: null }).eq('id', id);
  if (error) throw error;
}

export async function buscarMetricasDashboard() {
  const { data, error } = await supabase.rpc('admin_metricas_dashboard');
  if (error) throw error;
  return data;
}

/** Lista uma página de um tipo de conteúdo do feed, sem filtro de "quem eu sigo" (visão do admin). */
export async function listarConteudoAdmin(tabela, cursor = null, tamanhoPagina = 20) {
  const config = TABELAS[tabela];
  if (!config) throw new Error(`Tabela de conteúdo desconhecida: ${tabela}`);
  let q = supabase.from(tabela).select(config.campos).order('criado_em', { ascending: false }).limit(tamanhoPagina);
  if (cursor) q = q.lt('criado_em', cursor);
  const { data, error } = await q;
  if (error) throw error;
  return data.map((linha) => mapearLinha(tabela, config.tipo, linha));
}

/**
 * Lista uma página do feed completo do site (percursos, avaliações, fotos e vídeos de
 * todo mundo, mesclados por data — igual ao feed que o usuário vê, mas sem o filtro de
 * "quem eu sigo"). Mesma técnica de mesclagem por cursor usada em buscarFeed.
 */
export async function listarFeedCompletoAdmin(cursor = null, tamanhoPagina = 20) {
  const tabelas = Object.keys(TABELAS);
  const resultados = await Promise.all(
    tabelas.map((tabela) => {
      let q = supabase
        .from(tabela)
        .select(TABELAS[tabela].campos)
        .order('criado_em', { ascending: false })
        .limit(tamanhoPagina);
      if (cursor) q = q.lt('criado_em', cursor);
      return q;
    })
  );
  resultados.forEach((r) => {
    if (r.error) throw r.error;
  });

  const todos = tabelas.flatMap((tabela, i) =>
    resultados[i].data.map((linha) => mapearLinha(tabela, TABELAS[tabela].tipo, linha))
  );
  const todosOrdenados = todos.sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));
  return todosOrdenados.slice(0, tamanhoPagina);
}

export async function excluirConteudoAdmin(tabela, id) {
  if (!TABELAS[tabela]) throw new Error(`Tabela de conteúdo desconhecida: ${tabela}`);
  const { error } = await supabase.from(tabela).delete().eq('id', id);
  if (error) throw error;
}

export async function listarComentariosFeedAdmin(cursor = null, tamanhoPagina = 30) {
  let q = supabase.from('feed_comentarios').select(CAMPOS_COMENTARIO_FEED).order('criado_em', { ascending: false }).limit(tamanhoPagina);
  if (cursor) q = q.lt('criado_em', cursor);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export async function excluirComentarioFeedAdmin(id) {
  const { error } = await supabase.from('feed_comentarios').delete().eq('id', id);
  if (error) throw error;
}

/** Lista uma página de stories de todo mundo (inclusive já expirados), mais recentes primeiro. */
export async function listarStoriesAdmin(cursor = null, tamanhoPagina = 24) {
  let q = supabase.from('stories').select(CAMPOS_STORY).order('criado_em', { ascending: false }).limit(tamanhoPagina);
  if (cursor) q = q.lt('criado_em', cursor);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

/**
 * Detalhes "sociais" de um item do feed pro admin: quem reagiu (com qual reação),
 * quem foi marcado e quem foi mencionado. Um único item por vez — pensado pra um
 * painel de detalhes que abre sob demanda, não pra listagem em lote.
 */
export async function buscarDetalhesItemAdmin(tipoAlvo, alvoId) {
  const [reacoesRes, marcacoesRes, mencoesRes] = await Promise.all([
    supabase
      .from('curtidas')
      .select('usuario_id, reacao, criado_em, usuarios(id, nome, avatar_url)')
      .eq('tipo_alvo', tipoAlvo)
      .eq('alvo_id', alvoId)
      .order('criado_em', { ascending: false }),
    supabase
      .from('marcacoes')
      .select('id, usuarios:usuario_marcado_id(id, nome, avatar_url)')
      .eq('tipo_alvo', tipoAlvo)
      .eq('alvo_id', alvoId),
    supabase
      .from('mencoes')
      .select('id, texto_marcador, usuarios:usuario_mencionado_id(id, nome, avatar_url)')
      .eq('tipo_alvo', tipoAlvo)
      .eq('alvo_id', alvoId),
  ]);
  [reacoesRes, marcacoesRes, mencoesRes].forEach((r) => {
    if (r.error) throw r.error;
  });

  return {
    reacoes: reacoesRes.data,
    marcacoes: marcacoesRes.data,
    mencoes: mencoesRes.data,
  };
}

/**
 * Lista TODAS as conversas do site (diretas e grupos), com participantes e prévia
 * da última mensagem — a mesma ideia de listarConversas (api/chat.js), mas sem o
 * filtro de "só as minhas", já que o admin enxerga tudo (ver migration_admin_gestao_chat.sql).
 */
export async function listarConversasAdmin() {
  const { data: conversas, error: erroConversas } = await supabase
    .from('conversas')
    .select('id, tipo, nome, criado_por, fechado, criado_em')
    .order('criado_em', { ascending: false });
  if (erroConversas) throw erroConversas;
  if (conversas.length === 0) return [];

  const ids = conversas.map((c) => c.id);
  const [{ data: participantes, error: erroParticipantes }, { data: ultimas, error: erroUltimas }] = await Promise.all([
    supabase.from('conversa_participantes').select('conversa_id, usuarios(id, nome, avatar_url)').in('conversa_id', ids),
    supabase.rpc('ultimas_mensagens', { p_ids: ids }),
  ]);
  if (erroParticipantes) throw erroParticipantes;
  if (erroUltimas) throw erroUltimas;

  const participantesPorConversa = new Map();
  for (const p of participantes) {
    if (!participantesPorConversa.has(p.conversa_id)) participantesPorConversa.set(p.conversa_id, []);
    participantesPorConversa.get(p.conversa_id).push(p.usuarios);
  }
  const ultimaPorConversa = new Map(ultimas.map((m) => [m.conversa_id, m]));

  return conversas
    .map((c) => {
      const membros = participantesPorConversa.get(c.id) ?? [];
      const ultimaMensagem = ultimaPorConversa.get(c.id) ?? null;
      return {
        id: c.id,
        tipo: c.tipo,
        nome: c.tipo === 'grupo' ? c.nome : membros.map((m) => m.nome).join(' e ') || '(sem participantes)',
        fechado: c.fechado,
        membros,
        totalMembros: membros.length,
        ultimaMensagem,
        criadoEm: c.criado_em,
        ordenadoPor: ultimaMensagem?.criado_em ?? c.criado_em,
      };
    })
    .sort((a, b) => new Date(b.ordenadoPor) - new Date(a.ordenadoPor));
}

export async function buscarConfiguracao(chave) {
  const { data, error } = await supabase.from('configuracoes_app').select('chave, valor, atualizado_em').eq('chave', chave).maybeSingle();
  if (error) throw error;
  return data;
}

export async function definirConfiguracao(chave, valor, usuarioId) {
  const { error } = await supabase
    .from('configuracoes_app')
    .upsert({ chave, valor, atualizado_em: new Date().toISOString(), atualizado_por: usuarioId });
  if (error) throw error;
}
