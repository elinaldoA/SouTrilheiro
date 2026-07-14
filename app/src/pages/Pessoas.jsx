import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  listarSeguidos,
  listarSeguidoresComPerfil,
  listarSeguindoComPerfil,
  seguir,
  deixarDeSeguir,
} from '../api/seguidores';
import Avatar from '../components/Avatar';
import SugestoesTrilheiros from '../components/SugestoesTrilheiros';

const ABAS = [
  { valor: 'sugestoes', rotulo: 'Sugestões' },
  { valor: 'seguidores', rotulo: 'Seguidores' },
  { valor: 'seguindo', rotulo: 'Seguindo' },
];

function ListaTrilheiros({ usuarios, seguidoIds, onAlternar, mensagemVazia }) {
  if (usuarios.length === 0) {
    return <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{mensagemVazia}</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {usuarios.map((u) => {
        const segue = seguidoIds.has(u.id);
        return (
          <div
            key={u.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 10,
              padding: 10,
              borderRadius: 10,
              border: '1px solid var(--line)',
              background: 'var(--surface-raised)',
            }}
          >
            <Link
              to={`/usuario/${u.id}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: '0.9rem',
                color: 'var(--ink)',
                minWidth: 0,
                overflow: 'hidden',
              }}
            >
              <Avatar nome={u.nome} url={u.avatar_url} size={36} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.nome}</span>
            </Link>
            <button type="button" className={`btn btn-sm ${segue ? 'btn-outline' : 'btn-primary'}`} onClick={() => onAlternar(u.id, segue)}>
              {segue ? 'Seguindo' : 'Seguir'}
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default function Pessoas() {
  const { usuario, carregando: carregandoAuth } = useAuth();
  const [aba, setAba] = useState('sugestoes');
  const [seguidoIds, setSeguidoIds] = useState(new Set());
  const [seguidores, setSeguidores] = useState([]);
  const [seguindo, setSeguindo] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!usuario) return;
    let cancelado = false;
    setCarregando(true);
    Promise.all([listarSeguidos(usuario.id), listarSeguidoresComPerfil(usuario.id), listarSeguindoComPerfil(usuario.id)]).then(
      ([ids, listaSeguidores, listaSeguindo]) => {
        if (cancelado) return;
        setSeguidoIds(new Set(ids));
        setSeguidores(listaSeguidores);
        setSeguindo(listaSeguindo);
        setCarregando(false);
      }
    );
    return () => {
      cancelado = true;
    };
  }, [usuario]);

  if (carregandoAuth) return <p className="state-message">Carregando…</p>;

  if (!usuario) {
    return (
      <p className="state-message">
        <Link to="/perfil">Entre</Link> para encontrar outros trilheiros.
      </p>
    );
  }

  async function alternar(id, jaSegue) {
    if (jaSegue) {
      await deixarDeSeguir(usuario.id, id);
    } else {
      await seguir(usuario.id, id);
    }
    setSeguidoIds((atuais) => {
      const novo = new Set(atuais);
      jaSegue ? novo.delete(id) : novo.add(id);
      return novo;
    });
  }

  return (
    <>
      <h1 style={{ fontSize: '1.2rem' }}>Trilheiros</h1>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {ABAS.map((a) => (
          <button
            key={a.valor}
            type="button"
            onClick={() => setAba(a.valor)}
            style={{
              fontFamily: 'var(--mono)',
              fontSize: '0.72rem',
              padding: '5px 11px',
              borderRadius: 999,
              border: `1px solid ${aba === a.valor ? 'var(--accent)' : 'var(--line)'}`,
              color: aba === a.valor ? 'var(--accent)' : 'var(--muted)',
              background: 'var(--surface-raised)',
            }}
          >
            {a.rotulo}
            {a.valor === 'seguidores' && seguidores.length > 0 && ` (${seguidores.length})`}
            {a.valor === 'seguindo' && seguindo.length > 0 && ` (${seguindo.length})`}
          </button>
        ))}
      </div>

      {aba === 'sugestoes' && <SugestoesTrilheiros usuarioId={usuario.id} onMudarSeguidos={() => {}} />}

      {aba === 'seguidores' && !carregando && (
        <ListaTrilheiros
          usuarios={seguidores}
          seguidoIds={seguidoIds}
          onAlternar={alternar}
          mensagemVazia="Ninguém segue você ainda."
        />
      )}

      {aba === 'seguindo' && !carregando && (
        <ListaTrilheiros
          usuarios={seguindo}
          seguidoIds={seguidoIds}
          onAlternar={alternar}
          mensagemVazia="Você ainda não segue ninguém."
        />
      )}

      {carregando && aba !== 'sugestoes' && <p className="state-message">Carregando…</p>}
    </>
  );
}
