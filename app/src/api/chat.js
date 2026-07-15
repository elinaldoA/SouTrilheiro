import { supabase } from '../lib/supabaseClient';
import { validarImagem, validarVideo } from '../lib/uploadSeguro';

/** Lista as conversas do usuário (diretas e grupos), com prévia da última mensagem. */
export async function listarConversas(usuarioId) {
  const { data: minhas, error: erroMinhas } = await supabase
    .from('conversa_participantes')
    .select('conversa_id')
    .eq('usuario_id', usuarioId);
  if (erroMinhas) throw erroMinhas;

  const ids = minhas.map((r) => r.conversa_id);
  if (ids.length === 0) return [];

  const [{ data: conversas, error: erroConversas }, { data: participantes, error: erroParticipantes }, { data: ultimas, error: erroUltimas }] =
    await Promise.all([
      supabase.from('conversas').select('id, tipo, nome, criado_em').in('id', ids),
      supabase.from('conversa_participantes').select('conversa_id, usuarios(id, nome, avatar_url)').in('conversa_id', ids),
      supabase.rpc('ultimas_mensagens', { p_ids: ids }),
    ]);
  if (erroConversas) throw erroConversas;
  if (erroParticipantes) throw erroParticipantes;
  if (erroUltimas) throw erroUltimas;

  const participantesPorConversa = new Map();
  for (const p of participantes) {
    if (!participantesPorConversa.has(p.conversa_id)) participantesPorConversa.set(p.conversa_id, []);
    participantesPorConversa.get(p.conversa_id).push(p.usuarios);
  }

  const ultimaPorConversa = new Map(ultimas.map((m) => [m.conversa_id, m]));

  const lista = conversas.map((c) => {
    const membros = participantesPorConversa.get(c.id) ?? [];
    const outros = membros.filter((m) => m.id !== usuarioId);
    const ultimaMensagem = ultimaPorConversa.get(c.id) ?? null;
    return {
      id: c.id,
      tipo: c.tipo,
      nome: c.tipo === 'grupo' ? c.nome : outros[0]?.nome ?? 'Trilheiro',
      avatarUrl: c.tipo === 'grupo' ? null : outros[0]?.avatar_url ?? null,
      membros,
      totalMembros: membros.length,
      ultimaMensagem,
      ordenadoPor: ultimaMensagem?.criado_em ?? c.criado_em,
    };
  });

  return lista.sort((a, b) => new Date(b.ordenadoPor) - new Date(a.ordenadoPor));
}

/** Retorna o id de uma conversa direta já existente entre os dois, ou cria uma nova. */
export async function buscarOuCriarConversaDireta(meuId, outroId) {
  const { data: minhas, error: erroMinhas } = await supabase
    .from('conversa_participantes')
    .select('conversa_id, conversas!inner(tipo)')
    .eq('usuario_id', meuId)
    .eq('conversas.tipo', 'direta');
  if (erroMinhas) throw erroMinhas;

  const idsMinhas = minhas.map((r) => r.conversa_id);
  if (idsMinhas.length > 0) {
    const { data: compartilhada, error: erroCompartilhada } = await supabase
      .from('conversa_participantes')
      .select('conversa_id')
      .eq('usuario_id', outroId)
      .in('conversa_id', idsMinhas)
      .limit(1)
      .maybeSingle();
    if (erroCompartilhada) throw erroCompartilhada;
    if (compartilhada) return compartilhada.conversa_id;
  }

  const { data: conversa, error: erroConversa } = await supabase
    .from('conversas')
    .insert({ tipo: 'direta', criado_por: meuId })
    .select('id')
    .single();
  if (erroConversa) throw erroConversa;

  const { error: erroSelf } = await supabase
    .from('conversa_participantes')
    .insert({ conversa_id: conversa.id, usuario_id: meuId });
  if (erroSelf) throw erroSelf;

  const { error: erroOutro } = await supabase
    .from('conversa_participantes')
    .insert({ conversa_id: conversa.id, usuario_id: outroId });
  if (erroOutro) throw erroOutro;

  return conversa.id;
}

export async function criarGrupo(meuId, nome, membroIds) {
  const { data: conversa, error: erroConversa } = await supabase
    .from('conversas')
    .insert({ tipo: 'grupo', nome, criado_por: meuId })
    .select('id')
    .single();
  if (erroConversa) throw erroConversa;

  const { error: erroSelf } = await supabase
    .from('conversa_participantes')
    .insert({ conversa_id: conversa.id, usuario_id: meuId });
  if (erroSelf) throw erroSelf;

  if (membroIds.length > 0) {
    const { error: erroMembros } = await supabase
      .from('conversa_participantes')
      .insert(membroIds.map((id) => ({ conversa_id: conversa.id, usuario_id: id })));
    if (erroMembros) throw erroMembros;
  }

  return conversa.id;
}

export async function buscarConversa(conversaId) {
  const { data, error } = await supabase.from('conversas').select('id, tipo, nome, criado_em').eq('id', conversaId).single();
  if (error) throw error;
  return data;
}

export async function listarParticipantes(conversaId) {
  const { data, error } = await supabase
    .from('conversa_participantes')
    .select('usuario_id, usuarios(id, nome, avatar_url)')
    .eq('conversa_id', conversaId);
  if (error) throw error;
  return data.map((r) => r.usuarios);
}

export async function adicionarParticipantes(conversaId, membroIds) {
  const { error } = await supabase
    .from('conversa_participantes')
    .insert(membroIds.map((id) => ({ conversa_id: conversaId, usuario_id: id })));
  if (error) throw error;
}

const CAMPOS_MENSAGEM = 'id, texto, criado_em, usuario_id, anexo_url, anexo_tipo, anexo_nome';

export async function listarMensagens(conversaId) {
  const { data, error } = await supabase
    .from('mensagens')
    .select(CAMPOS_MENSAGEM)
    .eq('conversa_id', conversaId)
    .order('criado_em', { ascending: true });
  if (error) throw error;
  return data;
}

function tipoDoAnexo(arquivo) {
  if (arquivo.type.startsWith('image/')) return 'imagem';
  if (arquivo.type.startsWith('video/')) return 'video';
  return 'arquivo';
}

/**
 * Envia o arquivo para o bucket de anexos do chat e retorna sua URL pública.
 * Imagens e vídeos são validados contra uma lista de tipos conhecidos; qualquer
 * outro tipo de arquivo é aceito (o chat permite documentos), mas é forçado como
 * "application/octet-stream" para que o navegador nunca o renderize inline (evita
 * que um HTML/SVG disfarçado de anexo execute script ao ser aberto direto do bucket).
 */
async function enviarAnexoParaStorage(conversaId, usuarioId, arquivo) {
  const tipo = tipoDoAnexo(arquivo);
  let extensao;
  let contentType;
  if (tipo === 'imagem') {
    ({ extensao, contentType } = validarImagem(arquivo));
  } else if (tipo === 'video') {
    ({ extensao, contentType } = validarVideo(arquivo));
  } else {
    extensao = (arquivo.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';
    contentType = 'application/octet-stream';
  }

  const caminho = `${conversaId}/${usuarioId}-${Date.now()}.${extensao}`;
  const { error: erroUpload } = await supabase.storage.from('anexos-chat').upload(caminho, arquivo, { contentType });
  if (erroUpload) throw erroUpload;
  const { data } = supabase.storage.from('anexos-chat').getPublicUrl(caminho);
  return { url: data.publicUrl, tipo, nome: arquivo.name };
}

/** Envia uma mensagem, opcionalmente com um arquivo anexado (imagem, vídeo ou documento). */
export async function enviarMensagem(conversaId, usuarioId, texto, arquivo) {
  let anexo = null;
  if (arquivo) anexo = await enviarAnexoParaStorage(conversaId, usuarioId, arquivo);

  const { data, error } = await supabase
    .from('mensagens')
    .insert({
      conversa_id: conversaId,
      usuario_id: usuarioId,
      texto: texto || null,
      anexo_url: anexo?.url ?? null,
      anexo_tipo: anexo?.tipo ?? null,
      anexo_nome: anexo?.nome ?? null,
    })
    .select(CAMPOS_MENSAGEM)
    .single();
  if (error) throw error;
  return data;
}

export function assinarMensagens(conversaId, aoReceber) {
  const canal = supabase
    .channel(`mensagens:${conversaId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'mensagens', filter: `conversa_id=eq.${conversaId}` },
      (payload) => aoReceber(payload.new)
    )
    .subscribe();
  return () => supabase.removeChannel(canal);
}

/** Assina TODAS as mensagens novas que o usuário tem permissão de ver (RLS filtra por conversa). */
export function assinarTodasMensagens(usuarioId, aoReceber) {
  const canal = supabase
    .channel(`mensagens-usuario:${usuarioId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensagens' }, (payload) => aoReceber(payload.new))
    .subscribe();
  return () => supabase.removeChannel(canal);
}

export async function marcarConversaLida(conversaId, usuarioId) {
  const { error } = await supabase
    .from('conversa_leituras')
    .upsert({ conversa_id: conversaId, usuario_id: usuarioId, lida_em: new Date().toISOString() }, { onConflict: 'conversa_id,usuario_id' });
  if (error) throw error;
}

/** Lê o registro de leitura de cada participante de uma conversa (para exibir "visto"). */
export async function listarLeituras(conversaId) {
  const { data, error } = await supabase
    .from('conversa_leituras')
    .select('usuario_id, lida_em')
    .eq('conversa_id', conversaId);
  if (error) throw error;
  return data;
}

/** Assina mudanças nas leituras de uma conversa, para atualizar os tiques de "visto" em tempo real. */
export function assinarLeituras(conversaId, aoAtualizar) {
  const canal = supabase
    .channel(`leituras:${conversaId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'conversa_leituras', filter: `conversa_id=eq.${conversaId}` },
      (payload) => aoAtualizar(payload.new)
    )
    .subscribe();
  return () => supabase.removeChannel(canal);
}

/**
 * Abre um canal de broadcast para sinalizar "digitando" numa conversa.
 * Retorna { enviar(usuarioId, nome), cancelar() } — um único canal cuida do envio e do recebimento.
 */
export function criarCanalDigitando(conversaId, aoReceber) {
  const canal = supabase
    .channel(`digitando:${conversaId}`)
    .on('broadcast', { event: 'digitando' }, ({ payload }) => aoReceber(payload))
    .subscribe();

  return {
    enviar(usuarioId, nome) {
      canal.send({ type: 'broadcast', event: 'digitando', payload: { usuario_id: usuarioId, nome } });
    },
    cancelar() {
      supabase.removeChannel(canal);
    },
  };
}

/** Retorna, por conversa, quantas mensagens não lidas o usuário tem. */
export async function contarNaoLidas(usuarioId) {
  const { data, error } = await supabase.rpc('mensagens_nao_lidas', { p_usuario_id: usuarioId });
  if (error) throw error;
  return data;
}
