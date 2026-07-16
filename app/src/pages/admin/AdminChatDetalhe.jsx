import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  buscarConversa,
  listarParticipantes,
  listarMensagens,
  apagarMensagemParaTodos,
  renomearGrupo,
  fecharGrupo,
  reabrirGrupo,
  excluirGrupo,
  removerParticipante,
  adicionarParticipantes,
  enviarMensagem,
  assinarMensagens,
} from '../../api/chat';
import { listarUsuariosAdmin } from '../../api/admin';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../../components/Avatar';
import AnexoChat from '../../components/AnexoChat';
import { IconEnviar, IconX } from '../../components/ChatIcones';
import { formatarHora, rotuloData, agruparMensagens } from '../../lib/chatFormatacao';

export default function AdminChatDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario: eu } = useAuth();
  const [conversa, setConversa] = useState(null);
  const [participantes, setParticipantes] = useState([]);
  const [mensagens, setMensagens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [processando, setProcessando] = useState(false);
  const [editandoNome, setEditandoNome] = useState(false);
  const [nomeGrupo, setNomeGrupo] = useState('');
  const [buscandoMembro, setBuscandoMembro] = useState(false);
  const [termoMembro, setTermoMembro] = useState('');
  const [resultadosMembro, setResultadosMembro] = useState([]);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const fimRef = useRef(null);

  useEffect(() => {
    setCarregando(true);
    Promise.all([buscarConversa(id), listarParticipantes(id), listarMensagens(id, null)])
      .then(([c, p, m]) => {
        setConversa(c);
        setParticipantes(p);
        setMensagens(m);
        setNomeGrupo(c.nome ?? '');
        setErro(null);
      })
      .catch((e) => setErro(e.message ?? 'Não foi possível carregar esta conversa.'))
      .finally(() => setCarregando(false));
  }, [id]);

  useEffect(() => {
    const desinscrever = assinarMensagens(id, (nova) => {
      setMensagens((atuais) => (atuais.some((m) => m.id === nova.id) ? atuais : [...atuais, nova]));
    });
    return desinscrever;
  }, [id]);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ block: 'end' });
  }, [mensagens.length]);

  async function aoEnviarMensagem(e) {
    e.preventDefault();
    const valor = texto.trim();
    if (!valor || !eu) return;
    setTexto('');
    setEnviando(true);
    try {
      if (!participantes.some((p) => p.id === eu.id)) {
        await adicionarParticipantes(id, [eu.id]);
        setParticipantes((atuais) => [...atuais, eu]);
      }
      const registro = await enviarMensagem(id, eu.id, valor, null);
      setMensagens((atuais) => (atuais.some((m) => m.id === registro.id) ? atuais : [...atuais, registro]));
    } catch (e) {
      setErro(e.message ?? 'Não foi possível enviar a mensagem.');
    } finally {
      setEnviando(false);
    }
  }

  async function aoExcluirMensagem(mensagemId) {
    if (!window.confirm('Excluir esta mensagem para todos os participantes? Não dá para desfazer.')) return;
    await apagarMensagemParaTodos(mensagemId);
    setMensagens((atuais) => atuais.filter((m) => m.id !== mensagemId));
  }

  async function aoSalvarNome(e) {
    e.preventDefault();
    const valor = nomeGrupo.trim();
    if (!valor || valor === conversa.nome) {
      setEditandoNome(false);
      return;
    }
    setProcessando(true);
    try {
      setConversa(await renomearGrupo(id, valor));
      setEditandoNome(false);
    } catch (e) {
      setErro(e.message ?? 'Não foi possível renomear o grupo.');
    } finally {
      setProcessando(false);
    }
  }

  async function aoAlternarFechado() {
    setProcessando(true);
    try {
      setConversa(conversa.fechado ? await reabrirGrupo(id) : await fecharGrupo(id));
    } catch (e) {
      setErro(e.message ?? 'Não foi possível alterar o grupo.');
    } finally {
      setProcessando(false);
    }
  }

  async function aoExcluirConversa() {
    const aviso = ehGrupo
      ? 'Excluir este grupo para todo mundo? Apaga a conversa, os participantes e as mensagens. Não dá para desfazer.'
      : 'Excluir esta conversa para os dois participantes? Apaga a conversa e as mensagens. Não dá para desfazer.';
    if (!window.confirm(aviso)) return;
    setProcessando(true);
    try {
      await excluirGrupo(id);
      navigate('/admin/chats');
    } catch (e) {
      setErro(e.message ?? 'Não foi possível excluir a conversa.');
      setProcessando(false);
    }
  }

  async function aoRemoverMembro(membroId, nome) {
    if (!window.confirm(`Remover "${nome}" da conversa?`)) return;
    setProcessando(true);
    try {
      await removerParticipante(id, membroId);
      setParticipantes((atuais) => atuais.filter((p) => p.id !== membroId));
    } catch (e) {
      setErro(e.message ?? 'Não foi possível remover o membro.');
    } finally {
      setProcessando(false);
    }
  }

  async function aoBuscarMembro(e) {
    e.preventDefault();
    const termo = termoMembro.trim();
    if (!termo) return;
    setBuscandoMembro(true);
    try {
      const { usuarios } = await listarUsuariosAdmin({ termo, limite: 8 });
      const jaParticipa = new Set(participantes.map((p) => p.id));
      setResultadosMembro(usuarios.filter((u) => !jaParticipa.has(u.id)));
    } catch (e) {
      setErro(e.message ?? 'Não foi possível buscar usuários.');
    } finally {
      setBuscandoMembro(false);
    }
  }

  async function aoAdicionarMembro(u) {
    setProcessando(true);
    try {
      await adicionarParticipantes(id, [u.id]);
      setParticipantes((atuais) => [...atuais, u]);
      setResultadosMembro((atuais) => atuais.filter((x) => x.id !== u.id));
    } catch (e) {
      setErro(e.message ?? 'Não foi possível adicionar o membro.');
    } finally {
      setProcessando(false);
    }
  }

  if (carregando) return <p className="state-message">Carregando…</p>;
  if (erro && !conversa) return <p className="state-message">{erro}</p>;
  if (!conversa) return null;

  const ehGrupo = conversa.tipo === 'grupo';

  return (
    <div className="admin-page">
      <Link to="/admin/chats" className="admin-detalhes-toggle" style={{ paddingLeft: 0, alignSelf: 'flex-start' }}>
        ← Voltar aos chats
      </Link>

      <div className="admin-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          {ehGrupo && editandoNome ? (
            <form onSubmit={aoSalvarNome} style={{ display: 'flex', gap: 8, flex: 1 }}>
              <input className="field" value={nomeGrupo} onChange={(e) => setNomeGrupo(e.target.value)} autoFocus />
              <button type="submit" className="btn btn-primary btn-sm" disabled={processando}>
                Salvar
              </button>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditandoNome(false)} disabled={processando}>
                Cancelar
              </button>
            </form>
          ) : (
            <h1 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {ehGrupo && <span className="mini-badge">Grupo</span>}
              {conversa.nome || participantes.map((p) => p.nome).join(' e ')}
              {conversa.fechado && (
                <span className="mini-badge" style={{ color: 'var(--p1)', borderColor: 'var(--p1)' }}>
                  fechado
                </span>
              )}
            </h1>
          )}
          {ehGrupo && !editandoNome && (
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditandoNome(true)}>
              Renomear
            </button>
          )}
        </div>

        {erro && <p className="state-message">{erro}</p>}

        <div className="admin-lista-social-itens" style={{ marginTop: 10 }}>
          {participantes.map((p) => (
            <span key={p.id} className="admin-chip-removivel">
              <Avatar nome={p.nome} url={p.avatar_url} size={18} />
              {p.nome}
              {p.is_admin && ' (admin)'}
              <button type="button" onClick={() => aoRemoverMembro(p.id, p.nome)} aria-label={`Remover ${p.nome}`}>
                ×
              </button>
            </span>
          ))}
        </div>

        {ehGrupo && (
          <form onSubmit={aoBuscarMembro} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="field"
                placeholder="Buscar usuário por nome ou e-mail para adicionar"
                value={termoMembro}
                onChange={(e) => setTermoMembro(e.target.value)}
              />
              <button type="submit" className="btn btn-outline btn-sm" disabled={buscandoMembro}>
                Buscar
              </button>
            </div>
            {resultadosMembro.length > 0 && (
              <div className="admin-lista-social-itens">
                {resultadosMembro.map((u) => (
                  <button
                    type="button"
                    key={u.id}
                    className="admin-chip-removivel"
                    onClick={() => aoAdicionarMembro(u)}
                    disabled={processando}
                  >
                    <Avatar nome={u.nome} url={u.avatar_url} size={18} />
                    {u.nome} +
                  </button>
                ))}
              </div>
            )}
          </form>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button type="button" className="btn btn-outline btn-sm" onClick={aoAlternarFechado} disabled={processando}>
            {conversa.fechado ? 'Reabrir conversa' : 'Fechar conversa'}
          </button>
          <button type="button" className="btn btn-perigo btn-sm" onClick={aoExcluirConversa} disabled={processando}>
            {ehGrupo ? 'Excluir grupo' : 'Excluir conversa'}
          </button>
        </div>
      </div>

      <div className="admin-card admin-chat-card">
        <div className="chat-thread admin-chat-thread">
          {mensagens.length === 0 && (
            <p className="state-message" style={{ margin: 'auto' }}>
              Nenhuma mensagem ainda.
            </p>
          )}

          {(() => {
            const grupos = agruparMensagens(mensagens);
            let ultimaDataExibida = null;
            return grupos.map((grupo, i) => {
              const ehMinha = grupo.usuario_id === eu?.id;
              const autor = participantes.find((p) => p.id === grupo.usuario_id);
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
                    const botaoExcluir = (
                      <div className="chat-bubble-acoes">
                        <button
                          type="button"
                          className="chat-bubble-editar-btn"
                          onClick={() => aoExcluirMensagem(m.id)}
                          aria-label="Excluir mensagem"
                          title="Excluir mensagem"
                        >
                          <IconX />
                        </button>
                      </div>
                    );
                    return (
                      <div key={m.id} className={`chat-bubble-row chat-bubble-enter ${ehMinha ? 'mine' : ''}`}>
                        {!ehMinha && (
                          <span style={{ width: 26, flex: 'none' }}>
                            {ultimaDoGrupo && <Avatar nome={autor?.nome} url={autor?.avatar_url} size={26} />}
                          </span>
                        )}
                        {ehMinha && botaoExcluir}
                        <div className="chat-bubble">
                          {!ehMinha && j === 0 && (
                            <p className="chat-bubble-sender">{autor?.nome ?? 'Usuário removido'}</p>
                          )}
                          {m.anexo_url && <AnexoChat url={m.anexo_url} tipo={m.anexo_tipo} nome={m.anexo_nome} />}
                          {m.texto && <span>{m.texto}</span>}
                          {ultimaDoGrupo && (
                            <div className="chat-bubble-time">
                              {m.editado_em && <span className="chat-bubble-editado">editada</span>}
                              {formatarHora(m.criado_em)}
                            </div>
                          )}
                        </div>
                        {!ehMinha && botaoExcluir}
                      </div>
                    );
                  })}
                </div>
              );
            });
          })()}
          <div ref={fimRef} />
        </div>

        <form onSubmit={aoEnviarMensagem} className="chat-input-row admin-chat-input-row">
          <input
            className="field"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Enviar mensagem nesta conversa como admin…"
            style={{ flex: 1, minWidth: 0, borderRadius: 999 }}
            disabled={enviando}
          />
          <button type="submit" className="chat-send-btn" disabled={enviando || !texto.trim()} aria-label="Enviar">
            <IconEnviar />
          </button>
        </form>
      </div>
    </div>
  );
}
