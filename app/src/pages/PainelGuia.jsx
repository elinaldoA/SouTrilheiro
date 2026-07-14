import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { listarTrilhasDoUsuario, atualizarTrilha, excluirTrilha } from '../api/trilhas';
import { listarSaidasDoGuia } from '../api/saidas';
import { enviarFoto } from '../api/fotos';
import { enviarVideo } from '../api/videos';
import EditarTrilhaForm from '../components/EditarTrilhaForm';

const ROTULO_STATUS = { publicada: 'Publicada', pendente_revisao: 'Em revisão' };

function formatarDataHora(iso) {
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function PainelGuia() {
  const { usuario, guia, ehGuiaAprovado, carregando: carregandoAuth } = useAuth();
  const [minhasTrilhas, setMinhasTrilhas] = useState([]);
  const [minhasSaidas, setMinhasSaidas] = useState([]);
  const [editandoTrilhaId, setEditandoTrilhaId] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!usuario || !guia) return;
    setCarregando(true);
    Promise.all([listarTrilhasDoUsuario(usuario.id), listarSaidasDoGuia(guia.id)])
      .then(([trilhas, saidas]) => {
        setMinhasTrilhas(trilhas);
        setMinhasSaidas(saidas);
      })
      .finally(() => setCarregando(false));
  }, [usuario, guia]);

  if (carregandoAuth) return <p className="state-message">Carregando…</p>;

  if (!usuario) {
    return (
      <p className="state-message">
        <Link to="/perfil">Entre</Link> para acessar o painel do guia.
      </p>
    );
  }

  if (!guia) {
    return (
      <p className="state-message">
        Você ainda não é guia. Peça para virar guia no <Link to="/perfil">seu perfil</Link>.
      </p>
    );
  }

  if (!ehGuiaAprovado) {
    return <p className="state-message">Seu cadastro de guia ainda está em análise.</p>;
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

  return (
    <>
      <h1 style={{ fontSize: '1.2rem' }}>Painel do guia</h1>

      <Link to="/cadastrar-trilha" className="btn btn-primary" style={{ textDecoration: 'none', textAlign: 'center' }}>
        + Cadastrar trilha
      </Link>

      {carregando && <p className="state-message">Carregando…</p>}

      {!carregando && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h2 style={{ fontSize: '0.95rem' }}>Minhas trilhas ({minhasTrilhas.length})</h2>
            {minhasTrilhas.length === 0 && <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Você ainda não cadastrou trilhas.</p>}
            {minhasTrilhas.map((t) =>
              editandoTrilhaId === t.id ? (
                <div key={t.id} style={{ border: '1px solid var(--line)', borderRadius: 10, padding: 12, background: 'var(--surface-raised)' }}>
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
                  <Link to={`/trilha/${t.id}`} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, textDecoration: 'none', color: 'inherit' }}>
                    <span>{t.nome}</span>
                    <span className="mini-badge" style={t.status === 'pendente_revisao' ? { color: 'var(--p1)', borderColor: 'var(--p1)' } : undefined}>
                      {ROTULO_STATUS[t.status]}
                    </span>
                  </Link>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditandoTrilhaId(t.id)}>
                      Editar
                    </button>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => aoExcluirTrilha(t.id, t.nome)}>
                      Excluir
                    </button>
                  </div>
                </div>
              )
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h2 style={{ fontSize: '0.95rem' }}>Minhas saídas agendadas ({minhasSaidas.length})</h2>
            {minhasSaidas.length === 0 && (
              <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                Nenhuma saída agendada ainda. Acesse a página de uma trilha para agendar uma.
              </p>
            )}
            {minhasSaidas.map((s) => (
              <Link
                key={s.id}
                to={`/trilha/${s.trilhas?.id}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  padding: 10,
                  borderRadius: 10,
                  border: '1px solid var(--line)',
                  background: 'var(--surface-raised)',
                  fontSize: '0.86rem',
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <strong>{s.trilhas?.nome ?? 'Trilha'}</strong>
                <span style={{ color: 'var(--muted)' }}>{formatarDataHora(s.data_hora)}</span>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span className="mini-badge">{s.vagasOcupadas}/{s.vagas_total} vagas</span>
                  <span className="mini-badge">{s.status === 'agendada' ? 'Agendada' : s.status === 'concluida' ? 'Concluída' : 'Cancelada'}</span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  );
}
