import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listarUsuarios } from '../api/usuarios';
import { listarSeguidos, seguir, deixarDeSeguir } from '../api/seguidores';
import Avatar from './Avatar';

export default function SugestoesTrilheiros({ usuarioId, onMudarSeguidos }) {
  const [usuarios, setUsuarios] = useState([]);
  const [seguidoIds, setSeguidoIds] = useState(new Set());
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let cancelado = false;
    Promise.all([listarUsuarios(usuarioId), listarSeguidos(usuarioId)]).then(([lista, seguidos]) => {
      if (cancelado) return;
      setUsuarios(lista);
      setSeguidoIds(new Set(seguidos));
      setCarregando(false);
    });
    return () => {
      cancelado = true;
    };
  }, [usuarioId]);

  async function alternar(id) {
    const jaSegue = seguidoIds.has(id);
    if (jaSegue) {
      await deixarDeSeguir(usuarioId, id);
    } else {
      await seguir(usuarioId, id);
    }
    setSeguidoIds((atuais) => {
      const novo = new Set(atuais);
      jaSegue ? novo.delete(id) : novo.add(id);
      return novo;
    });
    onMudarSeguidos?.();
  }

  if (carregando) return <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Carregando trilheiros…</p>;
  if (usuarios.length === 0) {
    return <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Ainda não há outros trilheiros cadastrados.</p>;
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
              <Avatar nome={u.nome} url={u.avatar_url} size={32} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.nome}</span>
            </Link>
            <button type="button" className={`btn btn-sm ${segue ? 'btn-outline' : 'btn-primary'}`} onClick={() => alternar(u.id)}>
              {segue ? 'Seguindo' : 'Seguir'}
            </button>
          </div>
        );
      })}
    </div>
  );
}
