import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePresenca } from '../context/PresenceContext';
import { listarConversas, buscarOuCriarConversaDireta, criarGrupo, contarNaoLidas } from '../api/chat';
import { listarUsuarios } from '../api/usuarios';
import Avatar from '../components/Avatar';

function formatarData(iso) {
  const data = new Date(iso);
  const agora = new Date();
  const mesmoDia = data.toDateString() === agora.toDateString();
  if (mesmoDia) return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

const ROTULOS_ANEXO = { imagem: '📎 Foto', video: '📎 Vídeo', arquivo: '📎 Arquivo' };

function rotuloPreview(mensagem) {
  if (mensagem.texto) return mensagem.texto;
  return ROTULOS_ANEXO[mensagem.anexo_tipo] ?? '📎 Anexo';
}

function NovaConversa({ usuario, podeCriarGrupo, onCriada, onFechar }) {
  const { online } = usePresenca();
  const [modo, setModo] = useState('direta');
  const [usuarios, setUsuarios] = useState([]);
  const [selecionados, setSelecionados] = useState(new Set());
  const [nomeGrupo, setNomeGrupo] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    listarUsuarios(usuario.id).then((dados) => {
      setUsuarios(dados);
      setCarregando(false);
    });
  }, [usuario.id]);

  function alternarSelecao(id) {
    setSelecionados((atuais) => {
      const novo = new Set(atuais);
      novo.has(id) ? novo.delete(id) : novo.add(id);
      return novo;
    });
  }

  async function iniciarDireta(outroId) {
    setEnviando(true);
    setErro(null);
    try {
      const conversaId = await buscarOuCriarConversaDireta(usuario.id, outroId);
      onCriada(conversaId);
    } catch (e) {
      setErro(e.message ?? 'Não foi possível iniciar a conversa.');
    } finally {
      setEnviando(false);
    }
  }

  async function criar(e) {
    e.preventDefault();
    if (!podeCriarGrupo || !nomeGrupo.trim() || selecionados.size === 0) return;
    setEnviando(true);
    setErro(null);
    try {
      const conversaId = await criarGrupo(usuario.id, nomeGrupo.trim(), [...selecionados]);
      onCriada(conversaId);
    } catch (e) {
      setErro(e.message ?? 'Não foi possível criar o grupo.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="feed-card" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            className={`btn btn-sm ${modo === 'direta' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setModo('direta')}
          >
            Conversa
          </button>
          {podeCriarGrupo && (
            <button
              type="button"
              className={`btn btn-sm ${modo === 'grupo' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setModo('grupo')}
            >
              Grupo
            </button>
          )}
        </div>
        <button type="button" className="btn-link" onClick={onFechar} style={{ textDecoration: 'none' }}>
          Cancelar
        </button>
      </div>

      {modo === 'grupo' && (
        <input
          className="field"
          placeholder="Nome do grupo"
          value={nomeGrupo}
          onChange={(e) => setNomeGrupo(e.target.value)}
        />
      )}

      {carregando && <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Carregando trilheiros…</p>}

      {!carregando && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 280, overflowY: 'auto' }}>
          {usuarios.map((u) => (
            <button
              key={u.id}
              type="button"
              disabled={enviando}
              onClick={() => (modo === 'direta' ? iniciarDireta(u.id) : alternarSelecao(u.id))}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: 8,
                borderRadius: 10,
                border: `1px solid ${modo === 'grupo' && selecionados.has(u.id) ? 'var(--accent)' : 'var(--line)'}`,
                background: 'var(--surface-raised)',
                textAlign: 'left',
              }}
            >
              <Avatar nome={u.nome} url={u.avatar_url} size={32} online={online.has(u.id)} />
              <span style={{ fontSize: '0.88rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {u.nome}
              </span>
              {modo === 'grupo' && selecionados.has(u.id) && <span style={{ color: 'var(--accent)' }}>✓</span>}
            </button>
          ))}
        </div>
      )}

      {erro && <p style={{ color: 'var(--p0)', fontSize: '0.85rem', margin: 0 }}>{erro}</p>}

      {modo === 'grupo' && (
        <button type="button" className="btn btn-primary" onClick={criar} disabled={enviando || !nomeGrupo.trim() || selecionados.size === 0}>
          {enviando ? 'Criando…' : `Criar grupo${selecionados.size > 0 ? ` (${selecionados.size})` : ''}`}
        </button>
      )}
    </div>
  );
}

export default function Conversas() {
  const { usuario, ehAdmin, ehGuiaAprovado, carregando: carregandoAuth } = useAuth();
  const podeCriarGrupo = ehAdmin || ehGuiaAprovado;
  const { online } = usePresenca();
  const navigate = useNavigate();
  const [conversas, setConversas] = useState([]);
  const [naoLidas, setNaoLidas] = useState(new Map());
  const [carregando, setCarregando] = useState(true);
  const [criando, setCriando] = useState(false);

  useEffect(() => {
    if (!usuario) return;
    carregar();
  }, [usuario]);

  function carregar() {
    setCarregando(true);
    Promise.all([listarConversas(usuario.id), contarNaoLidas(usuario.id)]).then(([dados, lidas]) => {
      setConversas(dados);
      setNaoLidas(new Map(lidas.map((r) => [r.conversa_id, Number(r.total)])));
      setCarregando(false);
    });
  }

  if (carregandoAuth) return <p className="state-message">Carregando…</p>;

  if (!usuario) {
    return (
      <p className="state-message">
        <Link to="/perfil">Entre</Link> para conversar com outros trilheiros.
      </p>
    );
  }

  function aoCriar(conversaId) {
    setCriando(false);
    navigate(`/chat/${conversaId}`);
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: '1.2rem' }}>Chat</h1>
        <button type="button" className="btn btn-sm btn-primary" onClick={() => setCriando((v) => !v)}>
          {criando ? 'Fechar' : 'Nova'}
        </button>
      </div>

      {criando && (
        <NovaConversa usuario={usuario} podeCriarGrupo={podeCriarGrupo} onCriada={aoCriar} onFechar={() => setCriando(false)} />
      )}

      {carregando && <p className="state-message">Carregando conversas…</p>}

      {!carregando && conversas.length === 0 && !criando && (
        <p style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>
          Você ainda não tem conversas. Toque em "Nova" para falar com um trilheiro ou criar um grupo.
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {conversas.map((c) => {
          const outroId = c.tipo === 'direta' ? c.membros.find((m) => m.id !== usuario.id)?.id : null;
          const total = naoLidas.get(c.id) ?? 0;
          return (
            <Link key={c.id} to={`/chat/${c.id}`} className="chat-list-item">
              <Avatar nome={c.nome} url={c.avatarUrl} size={44} online={outroId ? online.has(outroId) : undefined} />
              <div className="chat-list-item-text">
                <span className="chat-list-item-name" style={{ fontWeight: total > 0 ? 700 : 600 }}>
                  {c.nome}
                  {c.tipo === 'grupo' && <span style={{ color: 'var(--muted)', fontWeight: 400 }}> · {c.totalMembros} membros</span>}
                </span>
                <span className="chat-list-item-preview" style={{ color: total > 0 ? 'var(--ink)' : 'var(--muted)' }}>
                  {c.ultimaMensagem
                    ? (c.ultimaMensagem.usuario_id === usuario.id ? 'Você: ' : '') + rotuloPreview(c.ultimaMensagem)
                    : 'Nenhuma mensagem ainda'}
                </span>
              </div>
              <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                {c.ultimaMensagem && <span className="chat-list-item-time">{formatarData(c.ultimaMensagem.criado_em)}</span>}
                {total > 0 && (
                  <span
                    style={{
                      minWidth: 18,
                      height: 18,
                      padding: '0 5px',
                      borderRadius: 999,
                      background: 'var(--accent)',
                      color: '#fff',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      fontFamily: 'var(--mono)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {total > 99 ? '99+' : total}
                  </span>
                )}
              </span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
