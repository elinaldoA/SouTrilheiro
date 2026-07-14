import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { cadastrarTrilha } from '../api/trilhas';
import { enviarFoto } from '../api/fotos';
import { enviarVideo } from '../api/videos';
import { distanciaKm as calcularDistanciaKm } from '../lib/geo';
import { CATEGORIAS_TRILHA } from '../lib/categorias';
import TrailMap from '../components/TrailMap';

export default function CadastrarTrilha() {
  const { usuario, ehAdmin, ehGuiaAprovado } = useAuth();
  const navigate = useNavigate();

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [distanciaKm, setDistanciaKm] = useState('');
  const [elevacaoM, setElevacaoM] = useState('');
  const [tempoEstimadoMin, setTempoEstimadoMin] = useState('');
  const [dificuldade, setDificuldade] = useState('facil');
  const [categoria, setCategoria] = useState('mata');
  const [tipoPreco, setTipoPreco] = useState('gratuita');
  const [preco, setPreco] = useState('');
  const [foto, setFoto] = useState(null);
  const [video, setVideo] = useState(null);
  const [localizacao, setLocalizacao] = useState(null);
  const [buscandoLocalizacao, setBuscandoLocalizacao] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);

  const [gravando, setGravando] = useState(false);
  const [pathGravado, setPathGravado] = useState([]);
  const [erroGravacao, setErroGravacao] = useState(null);
  const watchIdRef = useRef(null);

  useEffect(() => {
    return () => {
      if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  if (!usuario) {
    return (
      <p className="state-message">
        <Link to="/perfil">Entre</Link> para cadastrar uma trilha nova.
      </p>
    );
  }

  if (!ehAdmin && !ehGuiaAprovado) {
    return <p className="state-message">Somente administradores e guias aprovados podem cadastrar trilhas.</p>;
  }

  function usarLocalizacaoAtual() {
    setBuscandoLocalizacao(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocalizacao({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setBuscandoLocalizacao(false);
      },
      () => {
        setErro('Não foi possível obter sua localização. Verifique a permissão de GPS.');
        setBuscandoLocalizacao(false);
      }
    );
  }

  function iniciarGravacaoTracado() {
    if (!navigator.geolocation) {
      setErroGravacao('Este navegador não oferece geolocalização.');
      return;
    }
    setErroGravacao(null);
    setPathGravado([]);
    setGravando(true);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setPathGravado((anteriores) => [...anteriores, [latitude, longitude]]);
      },
      () => setErroGravacao('Não foi possível acessar sua localização. Verifique a permissão de GPS.'),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 }
    );
  }

  function pararGravacaoTracado() {
    if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
    watchIdRef.current = null;
    setGravando(false);

    if (pathGravado.length > 0) {
      setLocalizacao({ lat: pathGravado[0][0], lng: pathGravado[0][1] });
    }
  }

  function descartarTracado() {
    setPathGravado([]);
  }

  async function enviar(e) {
    e.preventDefault();
    if (!localizacao) {
      setErro('Marque a localização do início da trilha antes de enviar.');
      return;
    }
    if (tipoPreco === 'paga' && !(Number(preco) > 0)) {
      setErro('Informe o preço da trilha paga.');
      return;
    }
    setErro(null);
    setEnviando(true);
    try {
      const pathGeojson =
        pathGravado.length > 1
          ? pathGravado
          : [
              [localizacao.lat, localizacao.lng],
              [localizacao.lat + 0.0008, localizacao.lng + 0.0008],
            ];
      const nova = await cadastrarTrilha(usuario.id, {
        nome,
        descricao,
        cidade,
        estado,
        distanciaKm: Number(distanciaKm),
        elevacaoM: Number(elevacaoM),
        tempoEstimadoMin: Number(tempoEstimadoMin),
        dificuldade,
        categoria,
        tipoPreco,
        preco: tipoPreco === 'paga' ? Number(preco) : null,
        lat: localizacao.lat,
        lng: localizacao.lng,
        pathGeojson,
        publicarDireto: ehGuiaAprovado,
      });
      if (foto) {
        await enviarFoto(nova.id, usuario.id, foto);
      }
      if (video) {
        await enviarVideo(nova.id, usuario.id, video);
      }
      navigate(`/trilha/${nova.id}`);
    } catch (e) {
      setErro(e.message ?? 'Não foi possível cadastrar a trilha.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <h1 style={{ fontSize: '1.2rem' }}>Cadastrar trilha</h1>
      <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginTop: -10 }}>
        {ehGuiaAprovado
          ? 'Como guia aprovado, sua trilha é publicada direto — sem esperar revisão.'
          : 'Sua trilha entra como pendente de revisão e aparece na busca assim que for aprovada.'}
      </p>

      <form onSubmit={enviar} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input type="text" placeholder="Nome da trilha" value={nome} onChange={(e) => setNome(e.target.value)} required className="field" />

        <textarea
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Descrição (opcional)"
          rows={3}
          className="field"
        />

        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            placeholder="Cidade"
            value={cidade}
            onChange={(e) => setCidade(e.target.value)}
            required
            className="field"
            style={{ flex: 1, minWidth: 0 }}
          />
          <input
            type="text"
            placeholder="UF"
            value={estado}
            onChange={(e) => setEstado(e.target.value.slice(0, 2))}
            required
            className="field"
            style={{ width: 70, flex: 'none', textTransform: 'uppercase' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="number"
            step="0.1"
            min="0"
            placeholder="Distância (km)"
            value={distanciaKm}
            onChange={(e) => setDistanciaKm(e.target.value)}
            required
            className="field"
            style={{ flex: 1, minWidth: 0 }}
          />
          <input
            type="number"
            min="0"
            placeholder="Elevação (m)"
            value={elevacaoM}
            onChange={(e) => setElevacaoM(e.target.value)}
            required
            className="field"
            style={{ flex: 1, minWidth: 0 }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="number"
            min="0"
            placeholder="Tempo estimado (min)"
            value={tempoEstimadoMin}
            onChange={(e) => setTempoEstimadoMin(e.target.value)}
            required
            className="field"
            style={{ flex: 1, minWidth: 0 }}
          />
          <select value={dificuldade} onChange={(e) => setDificuldade(e.target.value)} className="field" style={{ flex: 1, minWidth: 0 }}>
            <option value="facil">Fácil</option>
            <option value="moderada">Moderada</option>
            <option value="dificil">Difícil</option>
          </select>
        </div>

        <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="field">
          {CATEGORIAS_TRILHA.map((c) => (
            <option key={c.valor} value={c.valor}>
              {c.rotulo}
            </option>
          ))}
        </select>

        <div style={{ display: 'flex', gap: 8 }}>
          <select
            value={tipoPreco}
            onChange={(e) => setTipoPreco(e.target.value)}
            className="field"
            style={{ flex: 1, minWidth: 0 }}
          >
            <option value="gratuita">Gratuita</option>
            <option value="paga">Paga</option>
          </select>
          {tipoPreco === 'paga' && (
            <input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="Preço (R$)"
              value={preco}
              onChange={(e) => setPreco(e.target.value)}
              required
              className="field"
              style={{ flex: 1, minWidth: 0 }}
            />
          )}
        </div>

        <div>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFoto(e.target.files?.[0] ?? null)}
            style={{ display: 'none' }}
            id="input-foto-cadastro"
          />
          <label htmlFor="input-foto-cadastro" className="btn btn-outline" style={{ display: 'inline-flex', cursor: 'pointer' }}>
            {foto ? `Foto selecionada: ${foto.name}` : 'Escolher foto da trilha (opcional)'}
          </label>
        </div>

        <div>
          <input
            type="file"
            accept="video/*"
            onChange={(e) => setVideo(e.target.files?.[0] ?? null)}
            style={{ display: 'none' }}
            id="input-video-cadastro"
          />
          <label htmlFor="input-video-cadastro" className="btn btn-outline" style={{ display: 'inline-flex', cursor: 'pointer' }}>
            {video ? `Vídeo selecionado: ${video.name}` : 'Escolher vídeo da trilha (opcional)'}
          </label>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-outline" onClick={usarLocalizacaoAtual} disabled={buscandoLocalizacao || gravando}>
            {buscandoLocalizacao ? 'Buscando…' : localizacao ? 'Localização marcada ✓' : 'Usar minha localização atual'}
          </button>
          {!gravando ? (
            <button type="button" className="btn btn-outline" onClick={iniciarGravacaoTracado}>
              {pathGravado.length > 1 ? 'Regravar traçado no GPS' : 'Gravar traçado no GPS'}
            </button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={pararGravacaoTracado}>
              Parar gravação ({pathGravado.length} pontos)
            </button>
          )}
        </div>
        <p style={{ color: 'var(--muted)', fontSize: '0.78rem', margin: 0 }}>
          Caminhe pela trilha com o celular para gravar o percurso real no mapa, ou apenas marque o ponto de início.
        </p>

        {gravando && (
          <p style={{ color: 'var(--p1)', fontSize: '0.8rem', margin: 0, fontFamily: 'var(--mono)' }}>
            Gravando… {pathGravado.length} pontos capturados
            {pathGravado.length > 1 &&
              ` · ${pathGravado
                .slice(1)
                .reduce((soma, p, i) => soma + calcularDistanciaKm(pathGravado[i][0], pathGravado[i][1], p[0], p[1]), 0)
                .toFixed(2)} km`}
          </p>
        )}

        {!gravando && pathGravado.length > 1 && (
          <>
            <TrailMap path={pathGravado} alturaPx={180} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn btn-outline" onClick={descartarTracado}>
                Descartar traçado gravado
              </button>
            </div>
          </>
        )}

        {erroGravacao && <p style={{ color: 'var(--p0)', fontSize: '0.85rem', margin: 0 }}>{erroGravacao}</p>}

        {localizacao && (
          <p style={{ color: 'var(--muted)', fontSize: '0.78rem', margin: 0, fontFamily: 'var(--mono)' }}>
            {localizacao.lat.toFixed(5)}, {localizacao.lng.toFixed(5)}
          </p>
        )}

        {erro && <p style={{ color: 'var(--p0)', fontSize: '0.85rem', margin: 0 }}>{erro}</p>}

        <button type="submit" className="btn btn-primary" disabled={enviando}>
          {enviando ? 'Enviando…' : 'Enviar para revisão'}
        </button>
      </form>
    </>
  );
}
