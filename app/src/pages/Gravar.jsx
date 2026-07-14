import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { buscarTrilhaPorId } from '../api/trilhas';
import { obterTrilhaOffline } from '../api/trilhasOffline';
import { salvarPercurso } from '../api/percursos';
import { salvarPercursoLocal } from '../api/percursosLocais';
import { distanciaKm, formatarDuracao, formatarRitmo } from '../lib/geo';
import { useAuth } from '../context/AuthContext';
import TrailMap from '../components/TrailMap';

const LIMIAR_SINAL_FRACO_M = 30;

export default function Gravar() {
  const { trilhaId } = useParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [trilha, setTrilha] = useState(null);
  const [fase, setFase] = useState('preparando'); // preparando | gravando | pausado | resumo | erro
  const [erro, setErro] = useState(null);
  const [pontos, setPontos] = useState([]);
  const [distanciaTotalKm, setDistanciaTotalKm] = useState(0);
  const [elevacaoTotalM, setElevacaoTotalM] = useState(0);
  const [precisaoAtualM, setPrecisaoAtualM] = useState(null);
  const [tempoDecorridoSeg, setTempoDecorridoSeg] = useState(0);
  const [nota, setNota] = useState('');
  const [percursoSalvo, setPercursoSalvo] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [erroSalvar, setErroSalvar] = useState(null);

  const watchIdRef = useRef(null);
  const ultimaAltitudeRef = useRef(null);
  const tempoAcumuladoMsRef = useRef(0);
  const inicioSegmentoRef = useRef(null);
  const iniciadoEmRef = useRef(null);

  useEffect(() => {
    if (!trilhaId) return;
    buscarTrilhaPorId(trilhaId)
      .then(setTrilha)
      .catch(() => setTrilha(obterTrilhaOffline(trilhaId)));
  }, [trilhaId]);

  useEffect(() => {
    if (!trilhaId || !navigator.geolocation) {
      if (!navigator.geolocation) setErro('Este navegador não oferece geolocalização.');
      return;
    }

    iniciadoEmRef.current = new Date();
    inicioSegmentoRef.current = Date.now();
    setFase('gravando');

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy, altitude } = pos.coords;
        setPrecisaoAtualM(accuracy);

        setPontos((anteriores) => {
          if (anteriores.length > 0) {
            const [latAnt, lngAnt] = anteriores[anteriores.length - 1];
            setDistanciaTotalKm((d) => d + distanciaKm(latAnt, lngAnt, latitude, longitude));
          }
          return [...anteriores, [latitude, longitude]];
        });

        if (typeof altitude === 'number') {
          if (ultimaAltitudeRef.current != null && altitude > ultimaAltitudeRef.current) {
            setElevacaoTotalM((e) => e + (altitude - ultimaAltitudeRef.current));
          }
          ultimaAltitudeRef.current = altitude;
        }
      },
      () => setErro('Não foi possível acessar sua localização. Verifique a permissão de GPS.'),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 }
    );

    return () => {
      if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [trilhaId]);

  useEffect(() => {
    if (fase !== 'gravando') return;
    const intervalo = setInterval(() => {
      setTempoDecorridoSeg((tempoAcumuladoMsRef.current + (Date.now() - inicioSegmentoRef.current)) / 1000);
    }, 1000);
    return () => clearInterval(intervalo);
  }, [fase]);

  function pausar() {
    tempoAcumuladoMsRef.current += Date.now() - inicioSegmentoRef.current;
    setFase('pausado');
  }

  function retomar() {
    inicioSegmentoRef.current = Date.now();
    setFase('gravando');
  }

  function finalizar() {
    if (fase === 'gravando') {
      tempoAcumuladoMsRef.current += Date.now() - inicioSegmentoRef.current;
    }
    if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
    setTempoDecorridoSeg(tempoAcumuladoMsRef.current / 1000);
    setFase('resumo');
  }

  async function salvar() {
    const dados = {
      trilhaId,
      distanciaKm: Number(distanciaTotalKm.toFixed(2)),
      duracaoSeg: Math.round(tempoDecorridoSeg),
      elevacaoM: Math.round(elevacaoTotalM),
      pathGeojson: pontos,
      iniciadoEm: iniciadoEmRef.current?.toISOString(),
      finalizadoEm: new Date().toISOString(),
      notaPercurso: nota || null,
    };

    setSalvando(true);
    setErroSalvar(null);

    if (usuario && navigator.onLine) {
      try {
        const registro = await salvarPercurso(usuario.id, dados);
        setPercursoSalvo({ id: registro.id, remoto: true });
        setSalvando(false);
        return;
      } catch (e) {
        // provavelmente a conexão caiu no meio da tentativa — segue para o fallback local
      }
    }

    const registro = salvarPercursoLocal({
      ...dados,
      trilhaNome: trilha?.nome ?? null,
      usuarioId: usuario?.id ?? null,
      pendenteSync: Boolean(usuario),
    });
    setPercursoSalvo({ id: registro.id, remoto: false, pendenteSync: Boolean(usuario) });
    setSalvando(false);
  }

  if (!trilhaId) {
    return (
      <div className="state-message" style={{ padding: '64px 0' }}>
        <p style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', color: 'var(--ink)', marginBottom: 6 }}>
          Escolha uma trilha para gravar
        </p>
        <p>
          A gravação de percurso acompanha uma trilha específica.{' '}
          <Link to="/">Voltar para a busca</Link>.
        </p>
      </div>
    );
  }

  if (erro) {
    return <p className="state-message">{erro}</p>;
  }

  if (fase === 'resumo') {
    return (
      <>
        <h1 style={{ fontSize: '1.2rem' }}>Percurso concluído</h1>
        <TrailMap path={pontos} alturaPx={160} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          <div className="stat-tile">
            <div className="stat-tile-num">{distanciaTotalKm.toFixed(2)} km</div>
            <div className="stat-tile-cap">distância</div>
          </div>
          <div className="stat-tile">
            <div className="stat-tile-num">{formatarDuracao(tempoDecorridoSeg)}</div>
            <div className="stat-tile-cap">tempo</div>
          </div>
          <div className="stat-tile">
            <div className="stat-tile-num">{formatarRitmo(tempoDecorridoSeg, distanciaTotalKm)} /km</div>
            <div className="stat-tile-cap">ritmo médio</div>
          </div>
          <div className="stat-tile">
            <div className="stat-tile-num">{Math.round(elevacaoTotalM)} m</div>
            <div className="stat-tile-cap">elevação</div>
          </div>
        </div>

        {percursoSalvo ? (
          <div
            style={{
              border: '1px solid var(--line)',
              borderRadius: 10,
              padding: 12,
              background: 'var(--surface-raised)',
              fontSize: '0.9rem',
            }}
          >
            {percursoSalvo.remoto
              ? 'Percurso salvo na sua conta.'
              : percursoSalvo.pendenteSync
                ? 'Sem conexão agora — o percurso ficou salvo neste dispositivo e sincroniza sozinho assim que a internet voltar.'
                : 'Percurso salvo neste dispositivo (você não está logado — entre para sincronizar entre aparelhos).'}{' '}
            <Link to="/historico">Ver no histórico</Link> ou <Link to={`/trilha/${trilhaId}`}>voltar para a trilha</Link>.
          </div>
        ) : (
          <>
            {!usuario && (
              <p style={{ fontSize: '0.82rem', color: 'var(--muted)', margin: 0 }}>
                Você não está logado — o percurso será salvo só neste dispositivo. <Link to="/perfil">Entrar</Link> para
                salvar na sua conta.
              </p>
            )}
            <textarea
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Nota opcional sobre as condições da trilha"
              rows={3}
              style={{
                borderRadius: 10,
                border: '1px solid var(--line)',
                background: 'var(--surface-raised)',
                color: 'var(--ink)',
                padding: 10,
                fontSize: '0.88rem',
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
            />
            {erroSalvar && <p style={{ color: 'var(--p0)', fontSize: '0.85rem', margin: 0 }}>{erroSalvar}</p>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn btn-outline" onClick={() => navigate(`/trilha/${trilhaId}`)}>
                Descartar
              </button>
              <button type="button" className="btn btn-primary" onClick={salvar} disabled={salvando}>
                {salvando ? 'Salvando…' : 'Salvar percurso'}
              </button>
            </div>
          </>
        )}
      </>
    );
  }

  return (
    <>
      <p style={{ fontFamily: 'var(--mono)', fontSize: '0.75rem', color: 'var(--muted)' }}>
        Gravando: {trilha?.nome ?? '…'}
      </p>

      {precisaoAtualM != null && precisaoAtualM > LIMIAR_SINAL_FRACO_M && (
        <div
          style={{
            fontFamily: 'var(--mono)',
            fontSize: '0.72rem',
            color: 'var(--p1)',
            background: 'color-mix(in srgb, var(--p1) 12%, var(--surface-raised))',
            border: '1px solid var(--p1)',
            borderRadius: 8,
            padding: '6px 10px',
          }}
        >
          Sinal de GPS fraco (±{Math.round(precisaoAtualM)} m) — a distância registrada pode ficar imprecisa.
        </div>
      )}

      <TrailMap path={pontos.length > 1 ? pontos : trilha?.path_geojson ?? pontos} alturaPx={260} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
        <div className="stat-tile">
          <div className="stat-tile-num">{distanciaTotalKm.toFixed(2)} km</div>
          <div className="stat-tile-cap">distância</div>
        </div>
        <div className="stat-tile">
          <div className="stat-tile-num">{formatarDuracao(tempoDecorridoSeg)}</div>
          <div className="stat-tile-cap">tempo</div>
        </div>
        <div className="stat-tile">
          <div className="stat-tile-num">{formatarRitmo(tempoDecorridoSeg, distanciaTotalKm)} /km</div>
          <div className="stat-tile-cap">ritmo</div>
        </div>
        <div className="stat-tile">
          <div className="stat-tile-num">{Math.round(elevacaoTotalM)} m</div>
          <div className="stat-tile-cap">elevação</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        {fase === 'gravando' ? (
          <button type="button" className="btn btn-outline" onClick={pausar}>
            Pausar
          </button>
        ) : (
          <button type="button" className="btn btn-outline" onClick={retomar}>
            Retomar
          </button>
        )}
        <button type="button" className="btn btn-primary" onClick={finalizar}>
          Finalizar
        </button>
      </div>
    </>
  );
}
