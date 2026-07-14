import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { buscarTrilhas } from '../api/trilhas';
import { useAuth } from '../context/AuthContext';
import SearchBar from '../components/SearchBar';
import FilterChips from '../components/FilterChips';
import TrailCard from '../components/TrailCard';

export default function Buscar() {
  const { ehAdmin, ehGuiaAprovado } = useAuth();
  const [termo, setTermo] = useState('');
  const [dificuldade, setDificuldade] = useState(null);
  const [distanciaMax, setDistanciaMax] = useState(null);
  const [categoria, setCategoria] = useState(null);
  const [estado, setEstado] = useState(null);
  const [tipoPreco, setTipoPreco] = useState(null);
  const [origem, setOrigem] = useState(null);
  const [trilhas, setTrilhas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setOrigem({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setOrigem(null),
      { enableHighAccuracy: false, timeout: 5000 }
    );
  }, []);

  useEffect(() => {
    let cancelado = false;
    setCarregando(true);
    setErro(null);

    buscarTrilhas({ termo: termo || undefined, dificuldade, distanciaMax, categoria, estado, tipoPreco, origem })
      .then((resultado) => {
        if (!cancelado) setTrilhas(resultado);
      })
      .catch((e) => {
        if (!cancelado) setErro(e.message ?? 'Não foi possível carregar as trilhas.');
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [termo, dificuldade, distanciaMax, categoria, estado, tipoPreco, origem]);

  return (
    <>
      <SearchBar value={termo} onChange={setTermo} />
      <FilterChips
        dificuldade={dificuldade}
        distanciaMax={distanciaMax}
        categoria={categoria}
        estado={estado}
        tipoPreco={tipoPreco}
        onChangeDificuldade={setDificuldade}
        onChangeDistancia={setDistanciaMax}
        onChangeCategoria={setCategoria}
        onChangeEstado={setEstado}
        onChangeTipoPreco={setTipoPreco}
      />

      {carregando && <p className="state-message">Carregando trilhas…</p>}
      {erro && <p className="state-message">{erro}</p>}
      {!carregando && !erro && trilhas.length === 0 && (
        <p className="state-message">Nenhuma trilha encontrada com esses filtros.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {trilhas.map((trilha) => (
          <TrailCard key={trilha.id} trilha={trilha} />
        ))}
      </div>

      {(ehAdmin || ehGuiaAprovado) && (
        <Link
          to="/cadastrar-trilha"
          style={{
            textAlign: 'center',
            fontFamily: 'var(--mono)',
            fontSize: '0.8rem',
            color: 'var(--accent)',
            textDecoration: 'none',
            padding: '10px 0',
          }}
        >
          + Cadastrar uma trilha
        </Link>
      )}
    </>
  );
}
