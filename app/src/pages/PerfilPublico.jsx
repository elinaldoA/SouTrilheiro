import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import Avatar from '../components/Avatar';
import { listarPercursos } from '../api/percursos';
import { seguir, deixarDeSeguir, estaSeguindo, contarSeguidores, contarSeguindo } from '../api/seguidores';
import { buscarOuCriarConversaDireta } from '../api/chat';
import { meuPerfilGuia } from '../api/guias';
import PapelBadge from '../components/PapelBadge';

export default function PerfilPublico() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState(null);
  const [percursos, setPercursos] = useState([]);
  const [seguindo, setSeguindo] = useState(false);
  const [segueVoce, setSegueVoce] = useState(false);
  const [numSeguidores, setNumSeguidores] = useState(0);
  const [numSeguindo, setNumSeguindo] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [alternando, setAlternando] = useState(false);
  const [abrindoChat, setAbrindoChat] = useState(false);
  const [guiaPerfil, setGuiaPerfil] = useState(null);

  useEffect(() => {
    let cancelado = false;
    setCarregando(true);

    Promise.all([
      supabase.from('usuarios').select('id, nome, avatar_url, is_admin, criado_em').eq('id', id).single(),
      listarPercursos(id).catch(() => []),
      contarSeguidores(id),
      contarSeguindo(id),
      usuario ? estaSeguindo(usuario.id, id) : Promise.resolve(false),
      usuario ? estaSeguindo(id, usuario.id) : Promise.resolve(false),
      meuPerfilGuia(id).catch(() => null),
    ]).then(([perfilRes, percursosRes, seguidoresRes, seguindoRes, jaSegueRes, segueVoceRes, guiaRes]) => {
      if (cancelado) return;
      setPerfil(perfilRes.data);
      setPercursos(percursosRes);
      setNumSeguidores(seguidoresRes);
      setNumSeguindo(seguindoRes);
      setSeguindo(jaSegueRes);
      setSegueVoce(segueVoceRes);
      setGuiaPerfil(guiaRes);
      setCarregando(false);
    });

    return () => {
      cancelado = true;
    };
  }, [id, usuario]);

  if (usuario && usuario.id === id) return <Navigate to="/perfil" replace />;
  if (carregando) return <p className="state-message">Carregando…</p>;
  if (!perfil) return <p className="state-message">Trilheiro não encontrado.</p>;

  const distanciaTotalKm = percursos.reduce((s, p) => s + p.distancia_km, 0);
  const trilhasConcluidas = new Set(percursos.map((p) => p.trilha_id)).size;

  async function alternarSeguir() {
    setAlternando(true);
    try {
      if (seguindo) {
        await deixarDeSeguir(usuario.id, id);
        setSeguindo(false);
        setNumSeguidores((n) => n - 1);
      } else {
        await seguir(usuario.id, id);
        setSeguindo(true);
        setNumSeguidores((n) => n + 1);
      }
    } finally {
      setAlternando(false);
    }
  }

  async function abrirChat() {
    setAbrindoChat(true);
    try {
      const conversaId = await buscarOuCriarConversaDireta(usuario.id, id);
      navigate(`/chat/${conversaId}`);
    } finally {
      setAbrindoChat(false);
    }
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <Avatar nome={perfil.nome} url={perfil.avatar_url} />
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <strong style={{ fontSize: '1.05rem' }}>{perfil.nome}</strong>
            <PapelBadge ehAdmin={perfil.is_admin} ehGuia={guiaPerfil?.aprovado} />
          </div>
          <p style={{ color: 'var(--muted)', fontSize: '0.8rem', margin: '2px 0 0' }}>
            {numSeguidores} seguidores · {numSeguindo} seguindo
          </p>
          {segueVoce && (
            <span className="mini-badge" style={{ marginTop: 4, display: 'inline-block', color: 'var(--good)', borderColor: 'var(--good)' }}>
              Segue você
            </span>
          )}
        </div>
      </div>

      {usuario && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className={seguindo ? 'btn btn-outline' : 'btn btn-primary'}
            onClick={alternarSeguir}
            disabled={alternando}
          >
            {seguindo ? 'Deixar de seguir' : segueVoce ? 'Seguir de volta' : 'Seguir'}
          </button>
          <button type="button" className="btn btn-outline" onClick={abrirChat} disabled={abrindoChat}>
            {abrindoChat ? 'Abrindo…' : 'Mensagem'}
          </button>
        </div>
      )}
      {!usuario && (
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
          <Link to="/perfil">Entre</Link> para seguir este trilheiro.
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
      </div>
    </>
  );
}
