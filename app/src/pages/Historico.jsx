import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { listarPercursos } from '../api/percursos';
import { listarPercursosLocais } from '../api/percursosLocais';
import { formatarDuracao } from '../lib/geo';

function formatarData(iso) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function Historico() {
  const { usuario, carregando: carregandoAuth } = useAuth();
  const [percursos, setPercursos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    if (carregandoAuth) return;
    let cancelado = false;
    setCarregando(true);
    setErro(null);

    const carregar = usuario
      ? listarPercursos(usuario.id).then((dados) =>
          dados.map((p) => ({
            id: p.id,
            trilhaId: p.trilha_id,
            trilhaNome: p.trilhas?.nome ?? 'Trilha',
            distanciaKm: p.distancia_km,
            duracaoSeg: p.duracao_seg,
            elevacaoM: p.elevacao_m,
            criadoEm: p.criado_em,
          }))
        )
      : Promise.resolve(listarPercursosLocais());

    carregar
      .then((dados) => {
        if (!cancelado) setPercursos(dados);
      })
      .catch((e) => {
        if (!cancelado) setErro(e.message ?? 'Não foi possível carregar o histórico.');
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [usuario, carregandoAuth]);

  if (carregando) return <p className="state-message">Carregando histórico…</p>;
  if (erro) return <p className="state-message">{erro}</p>;

  if (percursos.length === 0) {
    return (
      <div className="state-message" style={{ padding: '64px 0' }}>
        <p style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', color: 'var(--ink)', marginBottom: 6 }}>
          Nenhum percurso ainda
        </p>
        <p>
          Grave um percurso numa trilha para ele aparecer aqui. <Link to="/">Buscar trilhas</Link>.
        </p>
      </div>
    );
  }

  const distanciaTotalKm = percursos.reduce((s, p) => s + p.distanciaKm, 0);
  const elevacaoTotalM = percursos.reduce((s, p) => s + p.elevacaoM, 0);
  const trilhasConcluidas = new Set(percursos.map((p) => p.trilhaId ?? p.trilhaNome)).size;

  return (
    <>
      <h1 style={{ fontSize: '1.2rem' }}>Meu histórico</h1>
      {!usuario && (
        <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginTop: -10 }}>
          Salvo apenas neste dispositivo. <Link to="/perfil">Entrar</Link> para sincronizar entre aparelhos.
        </p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
        <div className="stat-tile">
          <div className="stat-tile-num">{distanciaTotalKm.toFixed(1)} km</div>
          <div className="stat-tile-cap">total percorrido</div>
        </div>
        <div className="stat-tile">
          <div className="stat-tile-num">{trilhasConcluidas}</div>
          <div className="stat-tile-cap">trilhas concluídas</div>
        </div>
        <div className="stat-tile">
          <div className="stat-tile-num">{percursos.length}</div>
          <div className="stat-tile-cap">percursos gravados</div>
        </div>
        <div className="stat-tile">
          <div className="stat-tile-num">{Math.round(elevacaoTotalM)} m</div>
          <div className="stat-tile-cap">elevação acumulada</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {percursos.map((p) => (
          <Link
            key={p.id}
            to={`/historico/${p.id}`}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 10,
              padding: 12,
              borderRadius: 12,
              border: '1px solid var(--line)',
              background: 'var(--surface-raised)',
              boxShadow: 'var(--shadow)',
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
              <strong style={{ fontSize: '0.95rem' }}>{p.trilhaNome ?? 'Trilha'}</strong>
              <span style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>{formatarData(p.criadoEm)}</span>
            </div>
            <div style={{ display: 'flex', gap: 6, flex: 'none' }}>
              <span className="mini-badge">{p.distanciaKm} km</span>
              <span className="mini-badge">{formatarDuracao(p.duracaoSeg)}</span>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
