import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePresenca } from '../context/PresenceContext';
import { useChatBadge } from '../context/ChatBadgeContext';
import {
  buscarConversa,
  listarParticipantes,
  listarMensagens,
  enviarMensagem,
  assinarMensagens,
  marcarConversaLida,
  listarLeituras,
  assinarLeituras,
  assinarExclusaoMensagens,
  criarCanalDigitando,
  apagarMensagemParaMim,
  apagarMensagemParaTodos,
  editarMensagem,
  assinarEdicoesMensagens,
  adicionarParticipantes,
  removerParticipante,
  renomearGrupo,
  fecharGrupo,
  reabrirGrupo,
  excluirGrupo,
} from '../api/chat';
import { listarGuiasAprovadosEntre } from '../api/guias';
import { listarUsuarios } from '../api/usuarios';
import { notificar } from '../api/notificacoesPush';
import { tocarSomMensagem, somMudo, alternarSomMudo } from '../lib/sound';
import Avatar from '../components/Avatar';
import EmojiPicker from '../components/EmojiPicker';

function formatarHora(iso) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function rotuloData(iso) {
  const data = new Date(iso);
  const hoje = new Date();
  const ontem = new Date();
  ontem.setDate(hoje.getDate() - 1);
  if (data.toDateString() === hoje.toDateString()) return 'Hoje';
  if (data.toDateString() === ontem.toDateString()) return 'Ontem';
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: hoje.getFullYear() === data.getFullYear() ? undefined : 'numeric' });
}

const JANELA_AGRUPAMENTO_MS = 5 * 60 * 1000;
const TAMANHO_MAXIMO_ANEXO = 20 * 1024 * 1024;

function agruparMensagens(mensagens) {
  const grupos = [];
  let grupoAtual = null;

  for (const m of mensagens) {
    const novaData = grupoAtual && rotuloData(m.criado_em) !== rotuloData(grupoAtual.data);
    const novoAutor = grupoAtual && grupoAtual.usuario_id !== m.usuario_id;
    const tempoLongo =
      grupoAtual && new Date(m.criado_em) - new Date(grupoAtual.itens[grupoAtual.itens.length - 1].criado_em) > JANELA_AGRUPAMENTO_MS;

    if (!grupoAtual || novaData || novoAutor || tempoLongo) {
      grupoAtual = { usuario_id: m.usuario_id, data: m.criado_em, itens: [m] };
      grupos.push(grupoAtual);
    } else {
      grupoAtual.itens.push(m);
    }
  }
  return grupos;
}

function IconEnviar() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
      <path d="M2.5 10 17 3.3 12.8 17l-3.3-5.5L2.5 10Z" />
    </svg>
  );
}

function IconSom({ mudo }) {
  if (mudo) {
    return (
      <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 8v4h3l4 4V4L6 8H3Z" fill="currentColor" stroke="none" />
        <path d="m13 7 4 6M17 7l-4 6" />
      </svg>
    );
  }
  return (
    <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8v4h3l4 4V4L6 8H3Z" fill="currentColor" stroke="none" />
      <path d="M13.5 7.2a4 4 0 0 1 0 5.6M16 4.7a7.5 7.5 0 0 1 0 10.6" />
    </svg>
  );
}

function IconChecagem({ dupla }) {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m2.5 10.5 3.2 3.2L11 8.4" />
      {dupla && <path d="m8 10.5 3.2 3.2L16.7 8.4" />}
    </svg>
  );
}

function IconClipe() {
  return (
    <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 6.5 8 13a2.5 2.5 0 1 0 3.5 3.5L18 10a4.5 4.5 0 1 0-6.4-6.4L4.9 10.3a6 6 0 0 0 8.5 8.5" />
    </svg>
  );
}

function IconArquivo() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 2.5h6l4 4v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-14a1 1 0 0 1 1-1Z" />
      <path d="M11 2.5V7h4" />
    </svg>
  );
}

function IconX() {
  return (
    <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <path d="m4 4 12 12M16 4 4 16" />
    </svg>
  );
}

function IconLapis() {
  return (
    <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13.5 3.5 16.5 6.5 6.7 16.3 3 17l0.7-3.7L13.5 3.5Z" />
    </svg>
  );
}

function IconOpcoes() {
  return (
    <svg width="17" height="17" viewBox="0 0 20 20" fill="currentColor">
      <circle cx="10" cy="4" r="1.6" />
      <circle cx="10" cy="10" r="1.6" />
      <circle cx="10" cy="16" r="1.6" />
    </svg>
  );
}

function IconMais() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <path d="M10 4v12M4 10h12" />
    </svg>
  );
}

/** Painel de gestão do grupo: membros, adicionar/remover, renomear e excluir (para o admin). */
function PainelGrupo({ conversa, participantes, usuario, ehAdmin, souAdminGrupo, onFechar, onAtualizado, onSaiu, onExcluido }) {
  const [mostrarAdicionar, setMostrarAdicionar] = useState(false);
  const [candidatos, setCandidatos] = useState([]);
  const [selecionados, setSelecionados] = useState(new Set());
  const [carregandoCandidatos, setCarregandoCandidatos] = useState(false);
  const [editandoNome, setEditandoNome] = useState(false);
  const [nomeGrupo, setNomeGrupo] = useState(conversa.nome ?? '');
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState('');

  const idsAtuais = new Set(participantes.map((p) => p.id));

  // O admin geral do site manda mais que o admin do grupo: só ele pode remover
  // o próprio criador do grupo ou outro admin geral que esteja no grupo. O
  // admin do grupo remove membros comuns normalmente.
  function podeRemover(p) {
    if (!souAdminGrupo || p.id === usuario.id) return false;
    const alvoEhSuperior = p.id === conversa.criado_por || p.is_admin;
    return ehAdmin || !alvoEhSuperior;
  }

  async function abrirAdicionar() {
    setMostrarAdicionar(true);
    setErro('');
    setCarregandoCandidatos(true);
    try {
      const todos = await listarUsuarios(usuario.id);
      setCandidatos(todos.filter((u) => !idsAtuais.has(u.id)));
    } finally {
      setCarregandoCandidatos(false);
    }
  }

  function alternarSelecao(id) {
    setSelecionados((atuais) => {
      const novo = new Set(atuais);
      novo.has(id) ? novo.delete(id) : novo.add(id);
      return novo;
    });
  }

  async function confirmarAdicionar() {
    if (selecionados.size === 0) return;
    setProcessando(true);
    setErro('');
    try {
      await adicionarParticipantes(conversa.id, [...selecionados]);
      await onAtualizado();
      setMostrarAdicionar(false);
      setSelecionados(new Set());
    } catch (e) {
      setErro(e.message ?? 'Não foi possível adicionar os membros.');
    } finally {
      setProcessando(false);
    }
  }

  async function remover(membroId) {
    if (!window.confirm('Remover este membro do grupo?')) return;
    setProcessando(true);
    try {
      await removerParticipante(conversa.id, membroId);
      await onAtualizado();
    } finally {
      setProcessando(false);
    }
  }

  async function sair() {
    if (!window.confirm('Sair deste grupo?')) return;
    setProcessando(true);
    try {
      await removerParticipante(conversa.id, usuario.id);
      onSaiu();
    } finally {
      setProcessando(false);
    }
  }

  async function excluir() {
    if (!window.confirm('Excluir este grupo para todos os participantes? Essa ação não pode ser desfeita.')) return;
    setProcessando(true);
    try {
      await excluirGrupo(conversa.id);
      onExcluido();
    } finally {
      setProcessando(false);
    }
  }

  async function alternarFechado() {
    setProcessando(true);
    setErro('');
    try {
      if (conversa.fechado) await reabrirGrupo(conversa.id);
      else await fecharGrupo(conversa.id);
      await onAtualizado();
    } catch (e) {
      setErro(e.message ?? 'Não foi possível alterar o grupo.');
    } finally {
      setProcessando(false);
    }
  }

  async function salvarNome(e) {
    e.preventDefault();
    const valor = nomeGrupo.trim();
    if (!valor || valor === conversa.nome) {
      setEditandoNome(false);
      return;
    }
    setProcessando(true);
    setErro('');
    try {
      await renomearGrupo(conversa.id, valor);
      await onAtualizado();
      setEditandoNome(false);
    } catch (e2) {
      setErro(e2.message ?? 'Não foi possível renomear o grupo.');
    } finally {
      setProcessando(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 20, background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'flex-end' }} onClick={onFechar}>
      <div
        className="feed-card"
        style={{ width: 320, maxWidth: '100%', height: '100%', overflowY: 'auto', borderRadius: 0, padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <strong style={{ fontSize: '1rem' }}>Informações do grupo</strong>
          <button type="button" className="painel-icone-btn" onClick={onFechar} aria-label="Fechar">
            <IconX />
          </button>
        </div>

        {editandoNome ? (
          <form onSubmit={salvarNome} style={{ display: 'flex', gap: 6 }}>
            <input className="field" value={nomeGrupo} onChange={(e) => setNomeGrupo(e.target.value)} autoFocus style={{ flex: 1 }} />
            <button type="submit" className="btn btn-sm btn-primary" disabled={processando}>Salvar</button>
            <button type="button" className="btn btn-sm btn-outline" onClick={() => { setEditandoNome(false); setNomeGrupo(conversa.nome ?? ''); }}>Cancelar</button>
          </form>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 600 }}>{conversa.nome}</span>
            {souAdminGrupo && (
              <button type="button" className="painel-icone-btn" onClick={() => setEditandoNome(true)} aria-label="Renomear grupo" title="Renomear grupo">
                <IconLapis />
              </button>
            )}
          </div>
        )}

        {erro && <p style={{ color: 'var(--p0)', fontSize: '0.8rem', margin: 0 }}>{erro}</p>}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{participantes.length} membros</span>
          {souAdminGrupo && (
            <button type="button" className="btn btn-sm btn-outline" onClick={abrirAdicionar} disabled={processando}>
              <IconMais /> Adicionar
            </button>
          )}
        </div>

        {mostrarAdicionar && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, border: '1px solid var(--line)', borderRadius: 10, padding: 10 }}>
            {carregandoCandidatos && <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Carregando trilheiros…</span>}
            {!carregandoCandidatos && candidatos.length === 0 && (
              <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Todos os trilheiros já estão no grupo.</span>
            )}
            {!carregandoCandidatos && candidatos.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto' }}>
                {candidatos.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => alternarSelecao(u.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: 6,
                      borderRadius: 8,
                      border: `1px solid ${selecionados.has(u.id) ? 'var(--accent)' : 'var(--line)'}`,
                      background: 'var(--surface-raised)',
                      textAlign: 'left',
                    }}
                  >
                    <Avatar nome={u.nome} url={u.avatar_url} size={26} />
                    <span style={{ fontSize: '0.84rem', flex: 1 }}>{u.nome}</span>
                    {selecionados.has(u.id) && <span style={{ color: 'var(--accent)' }}>✓</span>}
                  </button>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-sm btn-outline" onClick={() => setMostrarAdicionar(false)}>Cancelar</button>
              <button type="button" className="btn btn-sm btn-primary" onClick={confirmarAdicionar} disabled={processando || selecionados.size === 0}>
                Adicionar {selecionados.size > 0 ? `(${selecionados.size})` : ''}
              </button>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {participantes.map((p) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar nome={p.nome} url={p.avatar_url} size={30} />
              <span style={{ fontSize: '0.86rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.nome}
                {p.id === usuario.id && ' (você)'}
              </span>
              {p.id === conversa.criado_por && <span className="mini-badge">Admin</span>}
              {p.id !== conversa.criado_por && p.is_admin && <span className="mini-badge">Admin do site</span>}
              {podeRemover(p) && (
                <button type="button" className="painel-icone-btn" onClick={() => remover(p.id)} disabled={processando} aria-label={`Remover ${p.nome}`} title="Remover do grupo">
                  <IconX />
                </button>
              )}
            </div>
          ))}
        </div>

        {conversa.fechado && (
          <p style={{ fontSize: '0.78rem', color: 'var(--muted)', margin: 0 }}>
            Grupo fechado: só o admin pode enviar mensagens.
          </p>
        )}

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {souAdminGrupo && (
            <button type="button" className="btn btn-sm btn-outline" onClick={alternarFechado} disabled={processando}>
              {conversa.fechado ? 'Reabrir grupo' : 'Fechar grupo'}
            </button>
          )}
          <button type="button" className="btn btn-sm btn-outline" onClick={sair} disabled={processando}>
            Sair do grupo
          </button>
          {souAdminGrupo && (
            <button type="button" className="btn btn-sm btn-perigo" onClick={excluir} disabled={processando}>
              Excluir grupo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function tipoDeArquivo(arquivo) {
  if (arquivo.type.startsWith('image/')) return 'imagem';
  if (arquivo.type.startsWith('video/')) return 'video';
  return 'arquivo';
}

function formatarTamanho(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function Anexo({ url, tipo, nome }) {
  if (tipo === 'imagem') {
    return (
      <a href={url} target="_blank" rel="noreferrer">
        <img src={url} alt={nome ?? 'imagem'} className="chat-anexo-imagem" />
      </a>
    );
  }
  if (tipo === 'video') {
    return <video src={url} controls preload="metadata" className="chat-anexo-video" />;
  }
  return (
    <a href={url} target="_blank" rel="noreferrer" className="chat-anexo-arquivo">
      <IconArquivo />
      <span className="chat-anexo-arquivo-nome">{nome ?? 'Arquivo'}</span>
    </a>
  );
}

export default function Chat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario, ehAdmin, ehGuiaAprovado, carregando: carregandoAuth } = useAuth();
  const { online } = usePresenca();
  const { definirConversaAberta, atualizar: atualizarBadge } = useChatBadge();
  const [conversa, setConversa] = useState(null);
  const [participantes, setParticipantes] = useState([]);
  const [painelGrupoAberto, setPainelGrupoAberto] = useState(false);
  const [guiasAprovados, setGuiasAprovados] = useState(new Set());
  const [mensagens, setMensagens] = useState([]);
  const [leituras, setLeituras] = useState(new Map());
  const [digitando, setDigitando] = useState(new Map());
  const [texto, setTexto] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [mudo, setMudo] = useState(somMudo());
  const [arquivo, setArquivo] = useState(null);
  const [previewArquivo, setPreviewArquivo] = useState(null);
  const [erroAnexo, setErroAnexo] = useState('');
  const [editandoId, setEditandoId] = useState(null);
  const [textoEdicao, setTextoEdicao] = useState('');
  const [menuMensagemId, setMenuMensagemId] = useState(null);
  const fimRef = useRef(null);
  const inputArquivoRef = useRef(null);
  const canalDigitandoRef = useRef(null);
  const ultimoEnvioDigitandoRef = useRef(0);
  const timeoutsDigitandoRef = useRef(new Map());

  useEffect(() => {
    if (!usuario) return;
    let cancelado = false;
    setCarregando(true);
    Promise.all([buscarConversa(id), listarParticipantes(id), listarMensagens(id, usuario.id), listarLeituras(id)])
      .then(async ([c, p, m, l]) => {
        if (cancelado) return;
        setConversa(c);
        setParticipantes(p);
        setMensagens(m);
        setLeituras(new Map(l.map((r) => [r.usuario_id, r.lida_em])));
        const guias = await listarGuiasAprovadosEntre(p.map((x) => x.id));
        if (cancelado) return;
        setGuiasAprovados(guias);
        setCarregando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [id, usuario]);

  useEffect(() => {
    if (!usuario) return;
    const desinscrever = assinarMensagens(id, (nova) => {
      setMensagens((atuais) => (atuais.some((m) => m.id === nova.id) ? atuais : [...atuais, nova]));
      if (nova.usuario_id !== usuario.id) {
        marcarConversaLida(id, usuario.id);
        tocarSomMensagem();
      }
    });
    return desinscrever;
  }, [id, usuario]);

  useEffect(() => {
    if (!usuario) return;
    const desinscrever = assinarLeituras(id, (leitura) => {
      setLeituras((atuais) => new Map(atuais).set(leitura.usuario_id, leitura.lida_em));
    });
    return desinscrever;
  }, [id, usuario]);

  useEffect(() => {
    if (!usuario) return;
    const desinscrever = assinarExclusaoMensagens(id, (mensagemId) => {
      setMensagens((atuais) => atuais.filter((m) => m.id !== mensagemId));
    });
    return desinscrever;
  }, [id, usuario]);

  useEffect(() => {
    if (!usuario) return;
    const desinscrever = assinarEdicoesMensagens(id, (editada) => {
      setMensagens((atuais) => atuais.map((m) => (m.id === editada.id ? editada : m)));
    });
    return desinscrever;
  }, [id, usuario]);

  useEffect(() => {
    if (!usuario) return;
    const timeouts = timeoutsDigitandoRef.current;
    const canal = criarCanalDigitando(id, ({ usuario_id, nome }) => {
      if (usuario_id === usuario.id) return;
      setDigitando((atuais) => new Map(atuais).set(usuario_id, nome));
      clearTimeout(timeouts.get(usuario_id));
      timeouts.set(
        usuario_id,
        setTimeout(() => {
          setDigitando((atuais) => {
            const copia = new Map(atuais);
            copia.delete(usuario_id);
            return copia;
          });
        }, 3000)
      );
    });
    canalDigitandoRef.current = canal;
    return () => {
      timeouts.forEach(clearTimeout);
      timeouts.clear();
      canal.cancelar();
    };
  }, [id, usuario]);

  useEffect(() => {
    if (!usuario) return;
    definirConversaAberta(id);
    marcarConversaLida(id, usuario.id).then(atualizarBadge);
    return () => definirConversaAberta(null);
  }, [id, usuario]);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ block: 'end' });
  }, [mensagens.length]);

  useEffect(() => {
    return () => {
      if (previewArquivo) URL.revokeObjectURL(previewArquivo);
    };
  }, [previewArquivo]);

  if (carregandoAuth) return <p className="state-message">Carregando…</p>;

  if (!usuario) {
    return (
      <p className="state-message">
        <Link to="/perfil">Entre</Link> para acessar suas conversas.
      </p>
    );
  }

  if (carregando || !conversa) return <p className="state-message">Carregando conversa…</p>;

  const participantesPorId = new Map(participantes.map((p) => [p.id, p]));
  const outros = participantes.filter((p) => p.id !== usuario.id);
  const nomeConversa = conversa.tipo === 'grupo' ? conversa.nome : outros[0]?.nome ?? 'Trilheiro';
  const avatarUrl = conversa.tipo === 'grupo' ? null : outros[0]?.avatar_url ?? null;
  const outroOnline = conversa.tipo === 'direta' && outros[0] ? online.has(outros[0].id) : false;
  const totalOnlineGrupo = conversa.tipo === 'grupo' ? outros.filter((p) => online.has(p.id)).length : 0;
  const souAdminGrupo = conversa.tipo === 'grupo' && (ehAdmin || conversa.criado_por === usuario.id);
  const grupoFechadoParaMim = conversa.tipo === 'grupo' && conversa.fechado && !souAdminGrupo;

  let statusTexto = null;
  if (conversa.tipo === 'direta') statusTexto = outroOnline ? 'Online' : null;
  else if (totalOnlineGrupo > 0) statusTexto = `${totalOnlineGrupo} online`;

  const grupos = agruparMensagens(mensagens);
  let ultimaDataExibida = null;

  function usuarioEhComum(usuarioId) {
    return !participantesPorId.get(usuarioId)?.is_admin && !guiasAprovados.has(usuarioId);
  }

  // Em grupo, só admin apaga para todos. Em direta, além do admin, o guia
  // aprovado tem o mesmo poder quando fala com um usuário comum; entre dois
  // usuários comuns, cada um apaga as próprias mensagens normalmente.
  function podeApagarParaTodos(m) {
    if (ehAdmin) return true;
    if (souAdminGrupo) return true;
    if (conversa.tipo === 'direta') {
      const outroId = outros[0]?.id;
      if (ehGuiaAprovado && usuarioEhComum(outroId)) return true;
      if (m.usuario_id === usuario.id && usuarioEhComum(usuario.id) && usuarioEhComum(outroId)) return true;
    }
    return false;
  }

  const ultimaMensagemMinha = [...mensagens].reverse().find((m) => m.usuario_id === usuario.id) ?? null;
  const vistaPorTodos =
    ultimaMensagemMinha != null &&
    outros.length > 0 &&
    outros.every((p) => {
      const lidaEm = leituras.get(p.id);
      return lidaEm && new Date(lidaEm) >= new Date(ultimaMensagemMinha.criado_em);
    });

  const nomesDigitando = [...digitando.values()];

  async function enviar(e) {
    e.preventDefault();
    if (grupoFechadoParaMim) return;
    const valor = texto.trim();
    if (!valor && !arquivo) return;
    setTexto('');
    const arquivoParaEnviar = arquivo;
    cancelarAnexo();
    setEnviando(true);
    try {
      const registro = await enviarMensagem(id, usuario.id, valor, arquivoParaEnviar);
      setMensagens((atuais) => (atuais.some((m) => m.id === registro.id) ? atuais : [...atuais, registro]));
      const corpoNotificacao = valor || (arquivoParaEnviar ? 'Enviou um anexo' : '');
      for (const participante of outros) {
        notificar(participante.id, usuario.nome, corpoNotificacao, `/chat/${id}`);
      }
    } catch {
      setErroAnexo('Não foi possível enviar. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  }

  function aoEscolherArquivo(e) {
    const escolhido = e.target.files?.[0];
    if (!escolhido) return;
    if (escolhido.size > TAMANHO_MAXIMO_ANEXO) {
      setErroAnexo('Arquivo maior que 20MB.');
      e.target.value = '';
      return;
    }
    setErroAnexo('');
    setArquivo(escolhido);
    setPreviewArquivo(tipoDeArquivo(escolhido) === 'imagem' ? URL.createObjectURL(escolhido) : null);
  }

  function cancelarAnexo() {
    if (previewArquivo) URL.revokeObjectURL(previewArquivo);
    setArquivo(null);
    setPreviewArquivo(null);
    if (inputArquivoRef.current) inputArquivoRef.current.value = '';
  }

  function aoDigitar(e) {
    setTexto(e.target.value);
    const agora = Date.now();
    if (agora - ultimoEnvioDigitandoRef.current > 1500) {
      ultimoEnvioDigitandoRef.current = agora;
      canalDigitandoRef.current?.enviar(usuario.id, usuario.nome);
    }
  }

  function alternarMudo() {
    setMudo(alternarSomMudo());
  }

  async function apagarMensagemMim(m) {
    setMenuMensagemId(null);
    if (!window.confirm('Apagar esta mensagem só para você? Ela continua visível para os outros participantes.')) return;
    await apagarMensagemParaMim(m.id, usuario.id);
    setMensagens((atuais) => atuais.filter((x) => x.id !== m.id));
  }

  async function apagarMensagemTodos(m) {
    setMenuMensagemId(null);
    if (!window.confirm('Apagar esta mensagem para todos os participantes? Essa ação não pode ser desfeita.')) return;
    await apagarMensagemParaTodos(m.id);
    setMensagens((atuais) => atuais.filter((x) => x.id !== m.id));
  }

  function iniciarEdicao(m) {
    setEditandoId(m.id);
    setTextoEdicao(m.texto ?? '');
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setTextoEdicao('');
  }

  async function atualizarGrupo() {
    const [c, p] = await Promise.all([buscarConversa(id), listarParticipantes(id)]);
    setConversa(c);
    setParticipantes(p);
  }

  function aoSairDoGrupo() {
    setPainelGrupoAberto(false);
    navigate('/chat');
  }

  function aoExcluirGrupo() {
    setPainelGrupoAberto(false);
    navigate('/chat');
  }

  async function salvarEdicao(e, m) {
    e.preventDefault();
    const valor = textoEdicao.trim();
    if (!valor && !m.anexo_url) return;
    if (valor === (m.texto ?? '')) {
      cancelarEdicao();
      return;
    }
    try {
      const atualizada = await editarMensagem(m.id, usuario.id, valor);
      setMensagens((atuais) => atuais.map((x) => (x.id === atualizada.id ? atualizada : x)));
    } finally {
      cancelarEdicao();
    }
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Link to="/chat" style={{ fontFamily: 'var(--mono)', fontSize: '0.8rem', color: 'var(--muted)' }}>
          ←
        </Link>
        {conversa.tipo === 'grupo' ? (
          <button
            type="button"
            onClick={() => setPainelGrupoAberto(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
          >
            <Avatar nome={nomeConversa} url={avatarUrl} size={38} />
            <div style={{ minWidth: 0 }}>
              <strong style={{ fontSize: '0.98rem', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {nomeConversa}
              </strong>
              <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
                {participantes.length} membros{statusTexto ? ` · ${statusTexto}` : ''}
              </span>
            </div>
          </button>
        ) : (
          <>
            <Avatar nome={nomeConversa} url={avatarUrl} size={38} online={outroOnline} />
            <div style={{ minWidth: 0 }}>
              <strong style={{ fontSize: '0.98rem', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {nomeConversa}
              </strong>
              {statusTexto && <span style={{ fontSize: '0.72rem', color: 'var(--good)' }}>{statusTexto}</span>}
            </div>
          </>
        )}
        <button
          type="button"
          className="chat-mute-btn"
          style={{ marginLeft: 'auto' }}
          onClick={alternarMudo}
          aria-label={mudo ? 'Ativar som de novas mensagens' : 'Silenciar som de novas mensagens'}
          title={mudo ? 'Som desativado' : 'Som ativado'}
        >
          <IconSom mudo={mudo} />
        </button>
      </div>

      <div className="chat-thread">
        {mensagens.length === 0 && (
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem', textAlign: 'center', marginTop: 20 }}>
            Nenhuma mensagem ainda. Diga oi!
          </p>
        )}

        {grupos.map((grupo, i) => {
          const ehMinha = grupo.usuario_id === usuario.id;
          const autor = participantesPorId.get(grupo.usuario_id);
          const rotulo = rotuloData(grupo.data);
          const mostrarSeparador = rotulo !== ultimaDataExibida;
          ultimaDataExibida = rotulo;

          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {mostrarSeparador && (
                <div style={{ textAlign: 'center', margin: '8px 0 2px' }}>
                  <span className="mini-badge">{rotulo}</span>
                </div>
              )}
              {grupo.itens.map((m, j) => {
                const ultimaDoGrupo = j === grupo.itens.length - 1;
                const ehUltimaMinhaGeral = ehMinha && m.id === ultimaMensagemMinha?.id;
                const emEdicao = editandoId === m.id;
                const botoesAcao = !emEdicao && (
                  <div className="chat-bubble-acoes">
                    {ehMinha && (
                      <button
                        type="button"
                        className="chat-bubble-editar-btn"
                        onClick={() => iniciarEdicao(m)}
                        aria-label="Editar mensagem"
                        title="Editar mensagem"
                      >
                        <IconLapis />
                      </button>
                    )}
                    <div style={{ position: 'relative' }}>
                      <button
                        type="button"
                        className="chat-bubble-editar-btn"
                        onClick={() => setMenuMensagemId((atual) => (atual === m.id ? null : m.id))}
                        aria-label="Opções da mensagem"
                        title="Opções da mensagem"
                      >
                        <IconOpcoes />
                      </button>
                      {menuMensagemId === m.id && (
                        <>
                          <div style={{ position: 'fixed', inset: 0, zIndex: 9 }} onClick={() => setMenuMensagemId(null)} />
                          <div className={`chat-bubble-menu ${ehMinha ? 'esquerda' : 'direita'}`}>
                            <button type="button" onClick={() => apagarMensagemMim(m)}>
                              Apagar para mim
                            </button>
                            {podeApagarParaTodos(m) && (
                              <button type="button" className="perigo" onClick={() => apagarMensagemTodos(m)}>
                                Apagar para todos
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
                return (
                  <div key={m.id} className={`chat-bubble-row chat-bubble-enter ${ehMinha ? 'mine' : ''}`}>
                    {!ehMinha && (
                      <span style={{ width: 26, flex: 'none' }}>
                        {ultimaDoGrupo && <Avatar nome={autor?.nome} url={autor?.avatar_url} size={26} />}
                      </span>
                    )}
                    {ehMinha && botoesAcao}
                    <div className="chat-bubble">
                      {!ehMinha && conversa.tipo === 'grupo' && j === 0 && <p className="chat-bubble-sender">{autor?.nome ?? 'Trilheiro'}</p>}
                      {m.anexo_url && <Anexo url={m.anexo_url} tipo={m.anexo_tipo} nome={m.anexo_nome} />}
                      {emEdicao ? (
                        <form onSubmit={(e) => salvarEdicao(e, m)} className="chat-bubble-editar-form">
                          <input
                            className="field"
                            value={textoEdicao}
                            onChange={(e) => setTextoEdicao(e.target.value)}
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Escape') cancelarEdicao();
                            }}
                          />
                          <div className="chat-bubble-editar-acoes">
                            <button type="button" onClick={cancelarEdicao}>Cancelar</button>
                            <button type="submit">Salvar</button>
                          </div>
                        </form>
                      ) : (
                        m.texto && <span>{m.texto}</span>
                      )}
                      {ultimaDoGrupo && !emEdicao && (
                        <div className="chat-bubble-time">
                          {m.editado_em && <span className="chat-bubble-editado">editada</span>}
                          {formatarHora(m.criado_em)}
                          {ehUltimaMinhaGeral && conversa.tipo === 'direta' && (
                            <span className={`chat-read-receipt ${vistaPorTodos ? 'vista' : ''}`}>
                              <IconChecagem dupla={vistaPorTodos} />
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    {!ehMinha && botoesAcao}
                  </div>
                );
              })}
            </div>
          );
        })}
        {nomesDigitando.length > 0 && (
          <div className="chat-bubble-row chat-bubble-enter">
            <span style={{ width: 26, flex: 'none' }} />
            <div className="chat-bubble chat-typing-indicator" aria-live="polite">
              {conversa.tipo === 'grupo' && <span className="chat-typing-nome">{nomesDigitando.join(', ')}</span>}
              <span className="chat-typing-dot" />
              <span className="chat-typing-dot" />
              <span className="chat-typing-dot" />
            </div>
          </div>
        )}
        <div ref={fimRef} />
      </div>

      {erroAnexo && <p style={{ color: 'var(--p0)', fontSize: '0.76rem', margin: '2px 0' }}>{erroAnexo}</p>}

      {arquivo && (
        <div className="chat-anexo-preview">
          {previewArquivo ? (
            <img src={previewArquivo} alt="" className="chat-anexo-preview-imagem" />
          ) : (
            <span className="chat-anexo-preview-arquivo">
              <IconArquivo />
              <span className="chat-anexo-arquivo-nome">{arquivo.name}</span>
              <span style={{ color: 'var(--muted)', fontSize: '0.7rem' }}>{formatarTamanho(arquivo.size)}</span>
            </span>
          )}
          <button type="button" className="chat-anexo-preview-remover" onClick={cancelarAnexo} aria-label="Remover anexo">
            <IconX />
          </button>
        </div>
      )}

      {grupoFechadoParaMim ? (
        <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--muted)', padding: '10px 0' }}>
          Grupo fechado: só o admin pode enviar mensagens.
        </p>
      ) : (
        <form onSubmit={enviar} className="chat-input-row">
          <EmojiPicker onEscolher={(emoji) => setTexto((atual) => atual + emoji)} />
          <input
            ref={inputArquivoRef}
            type="file"
            id="input-anexo-chat"
            style={{ display: 'none' }}
            onChange={aoEscolherArquivo}
          />
          <label htmlFor="input-anexo-chat" className="emoji-picker-btn" aria-label="Anexar arquivo" style={{ cursor: 'pointer' }}>
            <IconClipe />
          </label>
          <input
            className="field"
            value={texto}
            onChange={aoDigitar}
            placeholder="Escreva uma mensagem…"
            style={{ flex: 1, minWidth: 0, borderRadius: 999 }}
          />
          <button type="submit" className="chat-send-btn" disabled={enviando || (!texto.trim() && !arquivo)} aria-label="Enviar">
            <IconEnviar />
          </button>
        </form>
      )}

      {painelGrupoAberto && conversa.tipo === 'grupo' && (
        <PainelGrupo
          conversa={conversa}
          participantes={participantes}
          usuario={usuario}
          ehAdmin={ehAdmin}
          souAdminGrupo={souAdminGrupo}
          onFechar={() => setPainelGrupoAberto(false)}
          onAtualizado={atualizarGrupo}
          onSaiu={aoSairDoGrupo}
          onExcluido={aoExcluirGrupo}
        />
      )}
    </>
  );
}
