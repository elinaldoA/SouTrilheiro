import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  listarTrilhasPendentes,
  aprovarTrilha,
  rejeitarTrilha,
  listarDenunciasPendentes,
  resolverDenuncia,
} from '../api/moderacao';
import { listarTodasTrilhas, atualizarTrilha, excluirTrilha } from '../api/trilhas';
import { enviarFoto } from '../api/fotos';
import { enviarVideo } from '../api/videos';
import { notificar } from '../api/notificacoesPush';
import { listarGuiasPendentes, aprovarGuia, rejeitarGuia } from '../api/guias';
import EditarTrilhaForm from '../components/EditarTrilhaForm';

const ROTULO_ALVO = { trilha: 'Trilha', foto: 'Foto', video: 'Vídeo', comentario: 'Comentário' };

function formatarData(iso) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export default function Moderacao() {
  const { usuario, carregando: carregandoAuth } = useAuth();
  const [trilhas, setTrilhas] = useState([]);
  const [denuncias, setDenuncias] = useState([]);
  const [todasTrilhas, setTodasTrilhas] = useState([]);
  const [guiasPendentes, setGuiasPendentes] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!usuario?.is_admin) return;
    let cancelado = false;
    Promise.all([listarTrilhasPendentes(), listarDenunciasPendentes(), listarTodasTrilhas(), listarGuiasPendentes()])
      .then(([t, d, todas, guias]) => {
        if (!cancelado) {
          setTrilhas(t);
          setDenuncias(d);
          setTodasTrilhas(todas);
          setGuiasPendentes(guias);
        }
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [usuario]);

  if (carregandoAuth) return <p className="state-message">Carregando…</p>;

  if (!usuario) {
    return (
      <p className="state-message">
        <Link to="/perfil">Entre</Link> para acessar a moderação.
      </p>
    );
  }

  if (!usuario.is_admin) {
    return <p className="state-message">Você não tem acesso à moderação.</p>;
  }

  async function aoAprovar(trilha) {
    await aprovarTrilha(trilha.id);
    setTrilhas((atuais) => atuais.filter((t) => t.id !== trilha.id));
    if (trilha.criado_por) {
      notificar(trilha.criado_por, 'Trilha aprovada', `"${trilha.nome}" já está publicada.`, `/trilha/${trilha.id}`);
    }
  }

  async function aoRejeitar(id, nome) {
    const confirmado = window.confirm(
      `Rejeitar "${nome}"? Isso apaga a trilha e qualquer percurso, avaliação, foto ou comentário já feito nela. Não dá para desfazer.`
    );
    if (!confirmado) return;
    await rejeitarTrilha(id);
    setTrilhas((atuais) => atuais.filter((t) => t.id !== id));
  }

  async function aoResolver(id) {
    await resolverDenuncia(id, 'revisado');
    setDenuncias((atuais) => atuais.filter((d) => d.id !== id));
  }

  async function aoAprovarGuia(id) {
    await aprovarGuia(id);
    setGuiasPendentes((atuais) => atuais.filter((g) => g.id !== id));
  }

  async function aoRejeitarGuia(id) {
    await rejeitarGuia(id);
    setGuiasPendentes((atuais) => atuais.filter((g) => g.id !== id));
  }

  async function aoSalvarEdicao(id, dados, foto, video) {
    const atualizada = await atualizarTrilha(id, dados);
    let fotoUrl;
    if (foto) {
      const registro = await enviarFoto(id, usuario.id, foto);
      fotoUrl = registro.url;
    }
    if (video) {
      await enviarVideo(id, usuario.id, video);
    }
    setTodasTrilhas((atuais) =>
      atuais.map((t) => (t.id === id ? { ...t, ...atualizada, fotoUrl: fotoUrl ?? t.fotoUrl } : t))
    );
    setEditandoId(null);
  }

  async function aoExcluir(id, nome) {
    const confirmado = window.confirm(`Excluir "${nome}"? Isso apaga a trilha e tudo que está ligado a ela. Não dá para desfazer.`);
    if (!confirmado) return;
    await excluirTrilha(id);
    setTodasTrilhas((atuais) => atuais.filter((t) => t.id !== id));
    setTrilhas((atuais) => atuais.filter((t) => t.id !== id));
  }

  return (
    <>
      <h1 style={{ fontSize: '1.2rem' }}>Moderação</h1>

      {carregando && <p className="state-message">Carregando fila…</p>}

      {!carregando && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h2 style={{ fontSize: '0.95rem' }}>Trilhas pendentes ({trilhas.length})</h2>
            {trilhas.length === 0 && <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Nenhuma trilha pendente.</p>}
            {trilhas.map((t) => (
              <div
                key={t.id}
                style={{
                  border: '1px solid var(--line)',
                  borderRadius: 10,
                  padding: 12,
                  background: 'var(--surface-raised)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div>
                  <Link to={`/trilha/${t.id}`} style={{ fontWeight: 600, fontSize: '0.92rem' }}>
                    {t.nome}
                  </Link>
                  <p style={{ margin: '2px 0 0', color: 'var(--muted)', fontSize: '0.8rem' }}>
                    {t.cidade}, {t.estado} · enviada por {t.usuarios?.nome ?? '—'} em {formatarData(t.criado_em)}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className="btn btn-outline" onClick={() => aoRejeitar(t.id, t.nome)}>
                    Rejeitar
                  </button>
                  <button type="button" className="btn btn-primary" onClick={() => aoAprovar(t)}>
                    Aprovar
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h2 style={{ fontSize: '0.95rem' }}>Denúncias pendentes ({denuncias.length})</h2>
            {denuncias.length === 0 && <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Nenhuma denúncia pendente.</p>}
            {denuncias.map((d) => (
              <div
                key={d.id}
                style={{
                  border: '1px solid var(--line)',
                  borderRadius: 10,
                  padding: 12,
                  background: 'var(--surface-raised)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  fontSize: '0.85rem',
                }}
              >
                <span className="mini-badge" style={{ alignSelf: 'flex-start' }}>
                  {ROTULO_ALVO[d.tipo_alvo]}
                </span>
                <p style={{ margin: 0 }}>{d.motivo}</p>
                <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.76rem' }}>
                  por {d.usuarios?.nome ?? '—'} em {formatarData(d.criado_em)}
                </p>
                <button type="button" className="btn btn-outline" style={{ flex: 'none', alignSelf: 'flex-start' }} onClick={() => aoResolver(d.id)}>
                  Marcar como revisado
                </button>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h2 style={{ fontSize: '0.95rem' }}>Guias pendentes ({guiasPendentes.length})</h2>
            {guiasPendentes.length === 0 && <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Nenhum pedido de guia pendente.</p>}
            {guiasPendentes.map((g) => (
              <div
                key={g.id}
                style={{
                  border: '1px solid var(--line)',
                  borderRadius: 10,
                  padding: 12,
                  background: 'var(--surface-raised)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div>
                  <strong style={{ fontSize: '0.92rem' }}>{g.usuarios?.nome ?? '—'}</strong>
                  {g.bio && <p style={{ margin: '2px 0 0', color: 'var(--muted)', fontSize: '0.82rem' }}>{g.bio}</p>}
                  <p style={{ margin: '2px 0 0', color: 'var(--muted)', fontSize: '0.78rem' }}>{formatarData(g.criado_em)}</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className="btn btn-outline" onClick={() => aoRejeitarGuia(g.id)}>
                    Rejeitar
                  </button>
                  <button type="button" className="btn btn-primary" onClick={() => aoAprovarGuia(g.id)}>
                    Aprovar
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h2 style={{ fontSize: '0.95rem' }}>Todas as trilhas ({todasTrilhas.length})</h2>
            {todasTrilhas.length === 0 && <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Nenhuma trilha cadastrada.</p>}
            {todasTrilhas.map((t) => (
              <div
                key={t.id}
                style={{
                  border: '1px solid var(--line)',
                  borderRadius: 10,
                  padding: 12,
                  background: 'var(--surface-raised)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                {editandoId === t.id ? (
                  <EditarTrilhaForm
                    trilha={t}
                    onCancelar={() => setEditandoId(null)}
                    onSalvar={(dados, foto, video) => aoSalvarEdicao(t.id, dados, foto, video)}
                  />
                ) : (
                  <>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      {t.fotoUrl && (
                        <img
                          src={t.fotoUrl}
                          alt={`Foto de ${t.nome}`}
                          style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--line)', flex: 'none' }}
                        />
                      )}
                      <div>
                        <Link to={`/trilha/${t.id}`} style={{ fontWeight: 600, fontSize: '0.92rem' }}>
                          {t.nome}
                        </Link>
                        <p style={{ margin: '2px 0 0', color: 'var(--muted)', fontSize: '0.8rem' }}>
                          {t.cidade}, {t.estado} · {t.status === 'publicada' ? 'publicada' : 'pendente de revisão'}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" className="btn btn-outline" onClick={() => setEditandoId(t.id)}>
                        Editar
                      </button>
                      <button type="button" className="btn btn-outline" onClick={() => aoExcluir(t.id, t.nome)}>
                        Excluir
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
