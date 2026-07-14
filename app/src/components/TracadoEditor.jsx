import { useEffect, useRef, useState } from 'react';
import { distanciaKm as calcularDistanciaKm, simplificarTracado } from '../lib/geo';
import TrailMap from './TrailMap';
import TrailMapDrawer from './TrailMapDrawer';
import TrailMapAoVivo from './TrailMapAoVivo';

function distanciaTotalKm(pontos) {
  if (pontos.length < 2) return 0;
  return pontos.slice(1).reduce((soma, p, i) => soma + calcularDistanciaKm(pontos[i][0], pontos[i][1], p[0], p[1]), 0);
}

export default function TracadoEditor({ localizacaoInicial = null, pathInicial = [], onChange }) {
  const [localizacao, setLocalizacao] = useState(localizacaoInicial);
  const [buscandoLocalizacao, setBuscandoLocalizacao] = useState(false);
  const [erro, setErro] = useState(null);

  const [gravando, setGravando] = useState(false);
  const [pathGravado, setPathGravado] = useState(pathInicial ?? []);
  const [erroGravacao, setErroGravacao] = useState(null);
  const watchIdRef = useRef(null);

  const [desenhandoNoMapa, setDesenhandoNoMapa] = useState(false);
  const [pontosDesenho, setPontosDesenho] = useState([]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  useEffect(() => {
    onChange?.({ localizacao, path: pathGravado });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localizacao, pathGravado]);

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

    setPathGravado((anteriores) => {
      const simplificado = simplificarTracado(anteriores);
      if (simplificado.length > 0) {
        setLocalizacao({ lat: simplificado[0][0], lng: simplificado[0][1] });
      }
      return simplificado;
    });
  }

  function descartarTracado() {
    setPathGravado([]);
  }

  function iniciarDesenhoNoMapa() {
    if (!localizacao) {
      setErro('Marque a localização do início da trilha antes de desenhar o traçado.');
      return;
    }
    setErro(null);
    setPontosDesenho(pathGravado.length > 1 ? pathGravado : []);
    setDesenhandoNoMapa(true);
  }

  function adicionarPontoDesenho(ponto) {
    setPontosDesenho((anteriores) => [...anteriores, ponto]);
  }

  function moverPontoDesenho(indice, novoPonto) {
    setPontosDesenho((anteriores) => anteriores.map((p, i) => (i === indice ? novoPonto : p)));
  }

  function removerPontoDesenho(indice) {
    setPontosDesenho((anteriores) => anteriores.filter((_, i) => i !== indice));
  }

  function desfazerPontoDesenho() {
    setPontosDesenho((anteriores) => anteriores.slice(0, -1));
  }

  function limparDesenho() {
    setPontosDesenho([]);
  }

  function concluirDesenho() {
    setPathGravado(pontosDesenho);
    setDesenhandoNoMapa(false);
  }

  function cancelarDesenho() {
    setDesenhandoNoMapa(false);
    setPontosDesenho([]);
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <button type="button" className="btn btn-outline" onClick={usarLocalizacaoAtual} disabled={buscandoLocalizacao || gravando}>
          {buscandoLocalizacao ? 'Buscando…' : localizacao ? 'Localização marcada ✓' : 'Usar minha localização atual'}
        </button>
        {!gravando ? (
          <button type="button" className="btn btn-outline" onClick={iniciarGravacaoTracado} disabled={desenhandoNoMapa}>
            {pathGravado.length > 1 ? 'Regravar traçado no GPS' : 'Gravar traçado no GPS'}
          </button>
        ) : (
          <button type="button" className="btn btn-primary" onClick={pararGravacaoTracado}>
            Parar gravação ({pathGravado.length} pontos)
          </button>
        )}
        {!desenhandoNoMapa && (
          <button type="button" className="btn btn-outline" onClick={iniciarDesenhoNoMapa} disabled={gravando}>
            Desenhar traçado no mapa
          </button>
        )}
      </div>
      <p style={{ color: 'var(--muted)', fontSize: '0.78rem', margin: 0 }}>
        Caminhe pela trilha com o celular para gravar o percurso real no mapa, marque só o ponto de início, ou desenhe o
        traçado clicando no mapa (arraste um ponto para ajustar a posição ou clique nele para removê-lo).
      </p>

      {desenhandoNoMapa && (
        <>
          <TrailMapDrawer
            centro={localizacao}
            pontos={pontosDesenho}
            onAdicionarPonto={adicionarPontoDesenho}
            onMoverPonto={moverPontoDesenho}
            onRemoverPonto={removerPontoDesenho}
            alturaPx={220}
          />
          <p style={{ color: 'var(--p1)', fontSize: '0.8rem', margin: 0, fontFamily: 'var(--mono)' }}>
            {pontosDesenho.length} pontos marcados
            {pontosDesenho.length > 1 && ` · ${distanciaTotalKm(pontosDesenho).toFixed(2)} km`}
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-outline" onClick={desfazerPontoDesenho} disabled={pontosDesenho.length === 0}>
              Desfazer último ponto
            </button>
            <button type="button" className="btn btn-outline" onClick={limparDesenho} disabled={pontosDesenho.length === 0}>
              Limpar
            </button>
            <button type="button" className="btn btn-primary" onClick={concluirDesenho} disabled={pontosDesenho.length < 2}>
              Concluir traçado
            </button>
            <button type="button" className="btn btn-outline" onClick={cancelarDesenho}>
              Cancelar
            </button>
          </div>
        </>
      )}

      {gravando && (
        <>
          <TrailMapAoVivo path={pathGravado} alturaPx={220} />
          <p style={{ color: 'var(--p1)', fontSize: '0.8rem', margin: 0, fontFamily: 'var(--mono)' }}>
            Gravando… {pathGravado.length} pontos capturados
            {pathGravado.length > 1 && ` · ${distanciaTotalKm(pathGravado).toFixed(2)} km`}
          </p>
        </>
      )}

      {!gravando && !desenhandoNoMapa && pathGravado.length > 1 && (
        <>
          <TrailMap path={pathGravado} alturaPx={180} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn btn-outline" onClick={descartarTracado}>
              Descartar traçado
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
    </>
  );
}
