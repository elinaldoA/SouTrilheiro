import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { buscarPercursoPorId } from '../api/percursos';
import { buscarPercursoLocalPorId } from '../api/percursosLocais';
import { proporTracado, buscarTracadoPropostoPorPercurso } from '../api/tracadosPropostos';
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
  const [tracadoProposto, setTracadoProposto] = useState(null);
  const [propondo, setPropondo] = useState(false);
  const [erroProposta, setErroProposta] = useState(null);

  useEffect(() => {
    if (carregandoAuth) return;
    let cancelado = false;
    setCarregando(true);

    const normalizarRemoto = (p) => ({
      id: p.id,
      remoto: true,
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

  useEffect(() => {
    if (!percurso?.remoto || !percurso.trilhaId) return;
    let cancelado = false;
    buscarTracadoPropostoPorPercurso(percurso.id).then((p) => {
      if (!cancelado) setTracadoProposto(p);
    });
    return () => {
      cancelado = true;
    };
  }, [percurso]);

  async function aoSugerirTracado() {
    setPropondo(true);
    setErroProposta(null);
    try {
      const proposta = await proporTracado(usuario.id, percurso);
      setTracadoProposto(proposta);
    } catch (e) {
      setErroProposta(e.message ?? 'Não foi possível enviar a sugestão.');
    } finally {
      setPropondo(false);
    }
  }

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

      {percurso.remoto && percurso.trilhaId && (
        <>
          {tracadoProposto ? (
            <p style={{ color: 'var(--muted)', fontSize: '0.82rem', margin: 0 }}>
              {tracadoProposto.status === 'pendente' && 'Traçado sugerido — aguardando revisão.'}
              {tracadoProposto.status === 'aprovado' && 'Sua sugestão de traçado foi aprovada.'}
              {tracadoProposto.status === 'rejeitado' && 'Sua sugestão de traçado foi rejeitada.'}
            </p>
          ) : (
            <button type="button" className="btn btn-outline" onClick={aoSugerirTracado} disabled={propondo}>
              {propondo ? 'Enviando…' : 'Sugerir este percurso como traçado oficial da trilha'}
            </button>
          )}
          {erroProposta && <p style={{ color: 'var(--p0)', fontSize: '0.85rem', margin: 0 }}>{erroProposta}</p>}
        </>
      )}
    </>
  );
}
