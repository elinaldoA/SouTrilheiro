import { useRef, useState } from 'react';
import { buscarUsuariosPorNome } from '../api/usuarios';
import Avatar from './Avatar';

/**
 * Textarea de legenda com autocomplete de @menções.
 * `mencoes` / `onMencoesChange` guardam a lista de { usuarioId, textoMarcador } já resolvida.
 */
export default function EditorLegenda({ usuarioAtualId, texto, onTextoChange, mencoes, onMencoesChange, placeholder }) {
  const [sugestoes, setSugestoes] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const inputRef = useRef(null);
  const arrobaInicioRef = useRef(null);

  async function aoDigitar(e) {
    const valor = e.target.value;
    const posicaoCursor = e.target.selectionStart;
    onTextoChange(valor);

    const trechoAntesCursor = valor.slice(0, posicaoCursor);
    const match = trechoAntesCursor.match(/@([^\s@]*)$/);
    if (match) {
      arrobaInicioRef.current = posicaoCursor - match[0].length;
      const termo = match[1];
      if (termo.length >= 2) {
        setBuscando(true);
        try {
          const resultado = await buscarUsuariosPorNome(termo, usuarioAtualId);
          setSugestoes(resultado);
        } finally {
          setBuscando(false);
        }
      } else {
        setSugestoes([]);
      }
    } else {
      arrobaInicioRef.current = null;
      setSugestoes([]);
    }

    // remove da lista de menções quem não aparece mais no texto
    if (mencoes.length > 0) {
      onMencoesChange(mencoes.filter((m) => valor.includes(m.textoMarcador)));
    }
  }

  function escolherSugestao(usuario) {
    const inicio = arrobaInicioRef.current;
    if (inicio === null) return;
    const textoMarcador = `@${usuario.nome}`;
    const posicaoCursor = inputRef.current.selectionStart;
    const novoTexto = `${texto.slice(0, inicio)}${textoMarcador} ${texto.slice(posicaoCursor)}`;
    onTextoChange(novoTexto);
    onMencoesChange([...mencoes.filter((m) => m.usuarioId !== usuario.id), { usuarioId: usuario.id, textoMarcador }]);
    setSugestoes([]);
    arrobaInicioRef.current = null;
    inputRef.current?.focus();
  }

  return (
    <div style={{ position: 'relative' }}>
      <textarea
        ref={inputRef}
        className="field"
        rows={2}
        value={texto}
        onChange={aoDigitar}
        placeholder={placeholder ?? 'Escreva uma legenda… use @ para mencionar e # para hashtags'}
        style={{ fontSize: '0.85rem', width: '100%' }}
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
              onClick={() => escolherSugestao(u)}
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
  );
}
