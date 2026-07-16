import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { buscarTrilhaPorId } from '../api/trilhas';
import { salvarTrilhaOffline, obterTrilhaOffline, estaSalvaOffline } from '../api/trilhasOffline';
import { prebuscarTilesDaTrilha } from '../lib/tilesOffline';
import { useAuth } from '../context/AuthContext';
import TrailMap from '../components/TrailMap';
import FormularioAvaliacao from '../components/FormularioAvaliacao';
import ComentariosTrilha from '../components/ComentariosTrilha';
import FotosTrilha from '../components/FotosTrilha';
import VideosTrilha from '../components/VideosTrilha';
import BotaoDenunciar from '../components/BotaoDenunciar';
import SaidasGuiadas from '../components/SaidasGuiadas';
import { useCategorias } from '../context/CategoriasContext';

const ROTULO_DIFICULDADE = {
  facil: 'Fácil',
  moderada: 'Moderada',
  dificil: 'Difícil',
};

function formatarTempo(minutos) {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h${String(m).padStart(2, '0')}`;
}

export default function DetalheTrilha() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const { rotulo } = useCategorias();
  const [trilha, setTrilha] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [offlineSalva, setOfflineSalva] = useState(false);
  const [salvandoOffline, setSalvandoOffline] = useState(false);

  useEffect(() => {
    let cancelado = false;
    setCarregando(true);
    setErro(null);

    buscarTrilhaPorId(id)
      .then((dado) => {
        if (!cancelado) setTrilha(dado);
      })
      .catch((e) => {
        const offline = obterTrilhaOffline(id);
        if (cancelado) return;
        if (offline) {
          setTrilha(offline);
        } else {
          setErro(e.message ?? 'Não foi possível carregar esta trilha (sem conexão e sem cópia salva).');
        }
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });

    setOfflineSalva(estaSalvaOffline(id));

    return () => {
      cancelado = true;
    };
  }, [id]);

  async function salvarOffline() {
    setSalvandoOffline(true);
    salvarTrilhaOffline(trilha);
    await prebuscarTilesDaTrilha(trilha.path_geojson);
    setOfflineSalva(true);
    setSalvandoOffline(false);
  }

  if (carregando) return <p className="state-message">Carregando trilha…</p>;
  if (erro) return <p className="state-message">{erro}</p>;
  if (!trilha) return null;

  const avaliacoes = trilha.avaliacoes ?? [];
  const notaMedia = avaliacoes.length
    ? avaliacoes.reduce((s, a) => s + a.nota, 0) / avaliacoes.length
    : null;
  const minhaAvaliacao = usuario ? avaliacoes.find((a) => a.usuario_id === usuario.id) : null;
  const outrasAvaliacoes = avaliacoes.filter((a) => a.usuario_id !== usuario?.id);

  function aoSalvarAvaliacao(registro) {
    setTrilha((atual) => {
      const semAMinha = (atual.avaliacoes ?? []).filter((a) => a.usuario_id !== usuario.id);
      return { ...atual, avaliacoes: [...semAMinha, registro] };
    });
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" style={{ fontFamily: 'var(--mono)', fontSize: '0.8rem', color: 'var(--muted)' }}>
          ← voltar
        </Link>
        <BotaoDenunciar tipoAlvo="trilha" alvoId={trilha.id} />
      </div>

      <h1 style={{ fontSize: '1.35rem' }}>{trilha.nome}</h1>
      <p style={{ color: 'var(--muted)', margin: '-8px 0 0', fontSize: '0.9rem' }}>
        {trilha.cidade}, {trilha.estado}
        {notaMedia != null && <> · ★ {notaMedia.toFixed(1)} ({avaliacoes.length})</>}
      </p>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {trilha.categoria && <span className="mini-badge">{rotulo[trilha.categoria]}</span>}
        <span className="mini-badge" style={trilha.tipo_preco === 'paga' ? { color: 'var(--accent)', borderColor: 'var(--accent)' } : undefined}>
          {trilha.tipo_preco === 'paga' ? `R$ ${Number(trilha.preco).toFixed(2)}` : 'Gratuita'}
        </span>
      </div>

      <TrailMap path={trilha.path_geojson} />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 8,
        }}
      >
        <div className="stat-tile">
          <div className="stat-tile-num">{trilha.distancia_km} km</div>
          <div className="stat-tile-cap">distância</div>
        </div>
        <div className="stat-tile">
          <div className="stat-tile-num">{trilha.elevacao_m} m</div>
          <div className="stat-tile-cap">elevação</div>
        </div>
        <div className="stat-tile">
          <div className="stat-tile-num">{formatarTempo(trilha.tempo_estimado_min)}</div>
          <div className="stat-tile-cap">tempo estimado</div>
        </div>
        <div className="stat-tile">
          <div className="stat-tile-num">{ROTULO_DIFICULDADE[trilha.dificuldade]}</div>
          <div className="stat-tile-cap">dificuldade</div>
        </div>
      </div>

      {trilha.descricao && <p style={{ fontSize: '0.92rem', color: 'var(--muted)' }}>{trilha.descricao}</p>}

      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" className="btn btn-outline" onClick={salvarOffline} disabled={offlineSalva || salvandoOffline}>
          {offlineSalva ? 'Salva offline ✓' : salvandoOffline ? 'Salvando…' : 'Salvar offline'}
        </button>
        <Link to={`/gravar/${trilha.id}`} className="btn btn-primary" style={{ textDecoration: 'none', textAlign: 'center' }}>
          Iniciar percurso
        </Link>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h2 style={{ fontSize: '1rem' }}>Avaliações</h2>

        {usuario ? (
          <FormularioAvaliacao
            trilhaId={trilha.id}
            usuarioId={usuario.id}
            avaliacaoExistente={minhaAvaliacao}
            onSalvo={aoSalvarAvaliacao}
          />
        ) : (
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
            <Link to="/perfil">Entre</Link> para avaliar esta trilha.
          </p>
        )}

        {avaliacoes.length === 0 && (
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>Ainda não há avaliações para esta trilha.</p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {outrasAvaliacoes.slice(0, 3).map((a, i) => (
            <div
              key={i}
              style={{
                border: '1px solid var(--line)',
                borderRadius: 10,
                padding: 10,
                background: 'var(--surface-raised)',
                fontSize: '0.86rem',
              }}
            >
              <strong>★ {a.nota}</strong>
              {a.comentario && <p style={{ margin: '4px 0 0', color: 'var(--muted)' }}>{a.comentario}</p>}
            </div>
          ))}
        </div>
      </div>

      <SaidasGuiadas trilhaId={trilha.id} />

      <FotosTrilha trilhaId={trilha.id} />

      <VideosTrilha trilhaId={trilha.id} />

      <ComentariosTrilha trilhaId={trilha.id} trilhaNome={trilha.nome} trilhaCriadoPor={trilha.criado_por} />
    </>
  );
}
