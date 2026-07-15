import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import { listarPercursos } from '../api/percursos';
import { listarPercursosLocais, listarPercursosPendentes } from '../api/percursosLocais';
import { listarTrilhasDoUsuario, atualizarTrilha, excluirTrilha } from '../api/trilhas';
import { enviarAvatar } from '../api/usuarios';
import { solicitarSerGuia } from '../api/guias';
import { enviarFoto } from '../api/fotos';
import { enviarVideo } from '../api/videos';
import { BADGES } from '../lib/badges';
import PushToggle from '../components/PushToggle';
import InstalarPWA from '../components/InstalarPWA';
import EditarTrilhaForm from '../components/EditarTrilhaForm';
import PapelBadge from '../components/PapelBadge';
import { version as versaoApp } from '../../package.json';

const ROTULO_STATUS = { publicada: 'Publicada', pendente_revisao: 'Em revisão' };

export default function Perfil() {
  const { session, usuario, sair, atualizarPerfil, guia, ehAdmin, ehGuiaAprovado, recarregarGuia } = useAuth();
  const [nome, setNome] = useState(usuario?.nome ?? '');
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);
  const [minhasTrilhas, setMinhasTrilhas] = useState([]);
  const [percursos, setPercursos] = useState([]);
  const [enviandoAvatar, setEnviandoAvatar] = useState(false);
  const [erroAvatar, setErroAvatar] = useState(null);
  const inputAvatarRef = useRef(null);
  const [solicitandoGuia, setSolicitandoGuia] = useState(false);
  const [bioGuia, setBioGuia] = useState('');
  const [erroGuia, setErroGuia] = useState(null);
  const [editandoTrilhaId, setEditandoTrilhaId] = useState(null);

  useEffect(() => {
    if (!usuario) return;
    listarTrilhasDoUsuario(usuario.id)
      .then(setMinhasTrilhas)
      .catch(() => setMinhasTrilhas([]));

    const pendentes = listarPercursosPendentes(usuario.id).map((p) => ({
      trilhaId: p.trilhaId,
      distanciaKm: p.distanciaKm,
    }));

    listarPercursos(usuario.id)
      .then((dados) => {
        const remotos = dados.map((p) => ({ trilhaId: p.trilha_id, distanciaKm: p.distancia_km }));
        setPercursos([...remotos, ...pendentes]);
      })
      .catch(() => setPercursos([...listarPercursosLocais(), ...pendentes]));
  }, [usuario]);

  if (!usuario) return <p className="state-message">Carregando…</p>;

  const distanciaTotalKm = percursos.reduce((s, p) => s + p.distanciaKm, 0);
  const trilhasConcluidas = new Set(percursos.map((p) => p.trilhaId)).size;
  const stats = {
    percursosCount: percursos.length,
    distanciaTotalKm,
    trilhasConcluidas,
    trilhasCadastradas: minhasTrilhas.length,
  };

  async function salvarNome() {
    setSalvando(true);
    setErro(null);
    try {
      await atualizarPerfil({ nome });
      setEditando(false);
    } catch (e) {
      setErro(e.message ?? 'Não foi possível salvar.');
    } finally {
      setSalvando(false);
    }
  }

  async function aoSalvarEdicaoTrilha(id, dados, foto, video) {
    const atualizada = await atualizarTrilha(id, dados);
    let fotoUrl;
    if (foto) {
      const registro = await enviarFoto(id, usuario.id, foto);
      fotoUrl = registro.url;
    }
    if (video) {
      await enviarVideo(id, usuario.id, video);
    }
    setMinhasTrilhas((atuais) =>
      atuais.map((t) => (t.id === id ? { ...t, ...atualizada, fotoUrl: fotoUrl ?? t.fotoUrl } : t))
    );
    setEditandoTrilhaId(null);
  }

  async function aoExcluirTrilha(id, nome) {
    const confirmado = window.confirm(`Excluir "${nome}"? Isso apaga a trilha e tudo que está ligado a ela. Não dá para desfazer.`);
    if (!confirmado) return;
    await excluirTrilha(id);
    setMinhasTrilhas((atuais) => atuais.filter((t) => t.id !== id));
  }

  async function aoSolicitarGuia() {
    setSolicitandoGuia(true);
    setErroGuia(null);
    try {
      await solicitarSerGuia(usuario.id, bioGuia);
      await recarregarGuia();
    } catch (e) {
      if (e.code === '23505') {
        // já existe um pedido de guia para este usuário (ex: feito no cadastro) — só sincroniza o estado local
        await recarregarGuia();
      } else {
        setErroGuia(e.message ?? 'Não foi possível enviar o pedido para ser guia.');
      }
    } finally {
      setSolicitandoGuia(false);
    }
  }

  async function aoEscolherAvatar(e) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    setErroAvatar(null);
    setEnviandoAvatar(true);
    try {
      const url = await enviarAvatar(session.user.id, arquivo);
      await atualizarPerfil({ avatar_url: url });
    } catch (e) {
      setErroAvatar(e.message ?? 'Não foi possível enviar o avatar.');
    } finally {
      setEnviandoAvatar(false);
      if (inputAvatarRef.current) inputAvatarRef.current.value = '';
    }
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div className="avatar-upload">
          <Avatar nome={usuario?.nome} url={usuario?.avatar_url} />
          <input
            ref={inputAvatarRef}
            type="file"
            accept="image/*"
            onChange={aoEscolherAvatar}
            disabled={enviandoAvatar}
            style={{ display: 'none' }}
            id="input-avatar"
          />
          <label htmlFor="input-avatar" className="avatar-upload-label">
            {enviandoAvatar ? '…' : 'editar'}
          </label>
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          {editando ? (
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                className="field"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                style={{ height: 36, flex: 1, minWidth: 0 }}
              />
              <button type="button" className="btn btn-primary btn-sm" onClick={salvarNome} disabled={salvando}>
                Salvar
              </button>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <strong style={{ fontSize: '1.05rem' }}>{usuario?.nome}</strong>
                <PapelBadge ehAdmin={ehAdmin} ehGuia={ehGuiaAprovado} />
              </div>
              <button type="button" className="btn-link" onClick={() => setEditando(true)} style={{ display: 'block', marginTop: 2 }}>
                editar nome
              </button>
            </>
          )}
          <p style={{ color: 'var(--muted)', fontSize: '0.82rem', margin: '4px 0 0' }}>{session.user.email}</p>
        </div>
      </div>

      {erroAvatar && <p style={{ color: 'var(--p0)', fontSize: '0.85rem' }}>{erroAvatar}</p>}
      {erro && <p style={{ color: 'var(--p0)', fontSize: '0.85rem' }}>{erro}</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
        <div className="stat-tile">
          <div className="stat-tile-num">{distanciaTotalKm.toFixed(1)} km</div>
          <div className="stat-tile-cap">total percorrido</div>
        </div>
        <div className="stat-tile">
          <div className="stat-tile-num">{stats.percursosCount}</div>
          <div className="stat-tile-cap">percursos gravados</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h2 style={{ fontSize: '0.95rem' }}>Conquistas</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {BADGES.map((badge) => {
            const ganho = badge.conquistado(stats);
            return (
              <div
                key={badge.id}
                title={badge.descricao}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  padding: '12px 6px',
                  borderRadius: 10,
                  border: `1px ${ganho ? 'solid' : 'dashed'} ${ganho ? 'var(--accent)' : 'var(--line)'}`,
                  background: ganho ? 'color-mix(in srgb, var(--accent) 10%, var(--surface-raised))' : 'var(--surface-raised)',
                }}
              >
                <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke={ganho ? 'var(--accent)' : 'var(--line)'} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 2.5 12.4 7.6l5.6.8-4 4 1 5.6L10 15.3l-5 2.7 1-5.6-4-4 5.6-.8Z" />
                </svg>
                <span style={{ fontSize: '0.7rem', textAlign: 'center', color: ganho ? 'var(--ink)' : 'var(--muted)' }}>{badge.nome}</span>
              </div>
            );
          })}
        </div>
      </div>

      {minhasTrilhas.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h2 style={{ fontSize: '0.95rem' }}>Minhas trilhas cadastradas</h2>
          {minhasTrilhas.map((t) =>
            editandoTrilhaId === t.id ? (
              <div
                key={t.id}
                style={{ border: '1px solid var(--line)', borderRadius: 10, padding: 12, background: 'var(--surface-raised)' }}
              >
                <EditarTrilhaForm
                  trilha={t}
                  onCancelar={() => setEditandoTrilhaId(null)}
                  onSalvar={(dados, foto, video) => aoSalvarEdicaoTrilha(t.id, dados, foto, video)}
                />
              </div>
            ) : (
              <div
                key={t.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  padding: 10,
                  borderRadius: 10,
                  border: '1px solid var(--line)',
                  background: 'var(--surface-raised)',
                  fontSize: '0.88rem',
                }}
              >
                <Link to={`/trilha/${t.id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit' }}>
                  <span>{t.nome}</span>
                  <span
                    className="mini-badge"
                    style={t.status === 'pendente_revisao' ? { color: 'var(--p1)', borderColor: 'var(--p1)' } : undefined}
                  >
                    {ROTULO_STATUS[t.status]}
                  </span>
                </Link>
                {ehGuiaAprovado && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditandoTrilhaId(t.id)}>
                      Editar
                    </button>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => aoExcluirTrilha(t.id, t.nome)}>
                      Excluir
                    </button>
                  </div>
                )}
              </div>
            )
          )}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h2 style={{ fontSize: '0.95rem' }}>Guia de trilhas</h2>
        {guia ? (
          <>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
              {ehGuiaAprovado ? 'Você é um guia aprovado — pode agendar saídas em grupo nas trilhas.' : 'Seu cadastro de guia está em análise.'}
            </p>
            {ehGuiaAprovado && (
              <Link to="/painel-guia" className="btn btn-outline" style={{ textDecoration: 'none', textAlign: 'center' }}>
                Painel do guia
              </Link>
            )}
          </>
        ) : (
          <>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: 0 }}>
              Vire guia para agendar saídas em grupo nas trilhas.
            </p>
            <textarea
              value={bioGuia}
              onChange={(e) => setBioGuia(e.target.value)}
              placeholder="Conte sua experiência como guia (opcional)"
              rows={2}
              className="field"
            />
            <button type="button" className="btn btn-outline" onClick={aoSolicitarGuia} disabled={solicitandoGuia}>
              {solicitandoGuia ? 'Enviando…' : 'Quero ser guia'}
            </button>
            {erroGuia && <p style={{ color: 'var(--p0)', fontSize: '0.85rem', margin: 0 }}>{erroGuia}</p>}
          </>
        )}
      </div>

      <InstalarPWA />

      <PushToggle usuarioId={usuario.id} />

      <Link to="/salvos" className="btn btn-outline" style={{ textDecoration: 'none', textAlign: 'center' }}>
        Itens salvos
      </Link>

      {usuario.is_admin && (
        <Link to="/moderacao" className="btn btn-outline" style={{ textDecoration: 'none', textAlign: 'center' }}>
          Moderação
        </Link>
      )}

      <button type="button" className="btn btn-outline" onClick={sair}>
        Sair da conta
      </button>

      <footer className="profile-footer">
        <img src="/icons/logo.jpeg" alt="" />
        <span>SouTrilheiro</span>
        <span className="profile-footer-version">v{versaoApp}</span>
      </footer>
    </>
  );
}
