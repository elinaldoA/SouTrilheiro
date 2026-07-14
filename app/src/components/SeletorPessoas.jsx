import { useState } from 'react';
import { buscarUsuariosPorNome } from '../api/usuarios';
import Avatar from './Avatar';

/**
 * Campo de busca + chips para marcar pessoas em uma foto/vídeo.
 * `selecionados` / `onChange` guardam a lista de usuários marcados ({ id, nome, avatar_url }).
 */
export default function SeletorPessoas({ usuarioAtualId, selecionados, onChange }) {
  const [termo, setTermo] = useState('');
  const [sugestoes, setSugestoes] = useState([]);
  const [buscando, setBuscando] = useState(false);

  async function aoDigitar(e) {
    const valor = e.target.value;
    setTermo(valor);
    if (valor.trim().length < 2) {
      setSugestoes([]);
      return;
    }
    setBuscando(true);
    try {
      const resultado = await buscarUsuariosPorNome(valor, usuarioAtualId);
      setSugestoes(resultado.filter((u) => !selecionados.some((s) => s.id === u.id)));
    } finally {
      setBuscando(false);
    }
  }

  function adicionar(usuario) {
    onChange([...selecionados, usuario]);
    setTermo('');
    setSugestoes([]);
  }

  function remover(id) {
    onChange(selecionados.filter((u) => u.id !== id));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {selecionados.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {selecionados.map((u) => (
            <span
              key={u.id}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontSize: '0.76rem',
                padding: '3px 8px',
                borderRadius: 999,
                border: '1px solid var(--line)',
                background: 'var(--surface-raised)',
              }}
            >
              <Avatar nome={u.nome} url={u.avatar_url} size={18} />
              {u.nome}
              <button
                type="button"
                onClick={() => remover(u.id)}
                aria-label={`Remover marcação de ${u.nome}`}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 0, lineHeight: 1 }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <div style={{ position: 'relative' }}>
        <input
          className="field"
          value={termo}
          onChange={aoDigitar}
          placeholder="Marcar pessoas…"
          style={{ height: 32, fontSize: '0.8rem' }}
        />
        {(sugestoes.length > 0 || buscando) && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 5,
              background: 'var(--surface-raised)',
              border: '1px solid var(--line)',
              borderRadius: 8,
              marginTop: 2,
              overflow: 'hidden',
            }}
          >
            {buscando && <p style={{ margin: 0, padding: 8, fontSize: '0.78rem', color: 'var(--muted)' }}>Buscando…</p>}
            {sugestoes.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => adicionar(u)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '6px 10px',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  color: 'var(--ink)',
                }}
              >
                <Avatar nome={u.nome} url={u.avatar_url} size={22} />
                {u.nome}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
