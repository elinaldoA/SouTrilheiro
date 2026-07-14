import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { buscarPercursoPorId } from '../api/percursos';
import { buscarPercursoLocalPorId } from '../api/percursosLocais';
import { formatarDuracao, formatarRitmo } from '../lib/geo';
import TrailMap from '../components/TrailMap';

function formatarDataHora(iso) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function DetalhePercurso() {
  const { id } = useParams();
  const { usuario, carregando: carregandoAuth } = useAuth();
  const [percurso, setPercurso] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (carregandoAuth) return;
    let cancelado = false;
    setCarregando(true);

    const normalizarRemoto = (p) => ({
      trilhaId: p.trilha_id,
      trilhaNome: p.trilhas?.nome ?? 'Trilha',
      distanciaKm: p.distancia_km,
      duracaoSeg: p.duracao_seg,
      elevacaoM: p.elevacao_m,
      pathGeojson: p.path_geojson,
      notaPercurso: p.nota_percurso,
      criadoEm: p.criado_em,
    });

    const carregar = usuario
      ? buscarPercursoPorId(id)
          .then(normalizarRemoto)
          .catch(() => buscarPercursoLocalPorId(id))
      : Promise.resolve(buscarPercursoLocalPorId(id));

    carregar
      .then((p) => {
        if (!cancelado) setPercurso(p);
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [id, usuario, carregandoAuth]);

  if (carregando) return <p className="state-message">Carregando…</p>;

  if (!percurso) {
    return (
      <div className="state-message" style={{ padding: '64px 0' }}>
        <p>
          Percurso não encontrado. <Link to="/historico">Voltar ao histórico</Link>.
        </p>
      </div>
    );
  }

  return (
    <>
      <Link to="/historico" style={{ fontFamily: 'var(--mono)', fontSize: '0.8rem', color: 'var(--muted)' }}>
        ← voltar
      </Link>

      <h1 style={{ fontSize: '1.2rem' }}>{percurso.trilhaNome ?? 'Percurso'}</h1>
      <p style={{ color: 'var(--muted)', margin: '-8px 0 0', fontSize: '0.85rem' }}>
        {formatarDataHora(percurso.criadoEm)}
      </p>

      <TrailMap path={percurso.pathGeojson} alturaPx={200} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
        <div className="stat-tile">
          <div className="stat-tile-num">{percurso.distanciaKm} km</div>
          <div className="stat-tile-cap">distância</div>
        </div>
        <div className="stat-tile">
          <div className="stat-tile-num">{formatarDuracao(percurso.duracaoSeg)}</div>
          <div className="stat-tile-cap">tempo</div>
        </div>
        <div className="stat-tile">
          <div className="stat-tile-num">{formatarRitmo(percurso.duracaoSeg, percurso.distanciaKm)} /km</div>
          <div className="stat-tile-cap">ritmo médio</div>
        </div>
        <div className="stat-tile">
          <div className="stat-tile-num">{percurso.elevacaoM} m</div>
          <div className="stat-tile-cap">elevação</div>
        </div>
      </div>

      {percurso.notaPercurso && (
        <div
          style={{
            border: '1px solid var(--line)',
            borderRadius: 10,
            padding: 12,
            background: 'var(--surface-raised)',
            fontSize: '0.9rem',
          }}
        >
          {percurso.notaPercurso}
        </div>
      )}

      {percurso.trilhaId && (
        <Link
          to={`/trilha/${percurso.trilhaId}`}
          className="btn btn-outline"
          style={{ textDecoration: 'none', textAlign: 'center' }}
        >
          Ver a trilha
        </Link>
      )}
    </>
  );
}
