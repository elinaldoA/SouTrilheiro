import { useEffect, useRef, useState } from 'react';
import Avatar from './Avatar';
import StoryViewer from './StoryViewer';
import { listarStoriesAtivos, listarVistos, criarStory } from '../api/stories';

export default function StoriesBar({ usuario, seguidoIds }) {
  const [grupos, setGrupos] = useState([]);
  const [vistos, setVistos] = useState(new Set());
  const [grupoAberto, setGrupoAberto] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);
  const inputRef = useRef(null);

  async function carregar() {
    const dados = await listarStoriesAtivos([usuario.id, ...seguidoIds]);
    setGrupos(dados);
    const todosIds = dados.flatMap((g) => g.itens.map((i) => i.id));
    const vistosIds = await listarVistos(usuario.id, todosIds);
    setVistos(new Set(vistosIds));
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario.id, seguidoIds.join(',')]);

  const meuGrupoIdx = grupos.findIndex((g) => g.usuario.id === usuario.id);
  const meuGrupo = meuGrupoIdx >= 0 ? grupos[meuGrupoIdx] : null;
  const outrosGrupos = grupos.filter((g) => g.usuario.id !== usuario.id);

  function grupoTemNaoVisto(g) {
    return g.itens.some((i) => !vistos.has(i.id));
  }

  async function aoEscolherArquivo(e) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    setErro(null);
    setEnviando(true);
    try {
      const tipo = arquivo.type.startsWith('video/') ? 'video' : 'foto';
      await criarStory(usuario.id, { tipo, arquivo });
      await carregar();
    } catch (e) {
      setErro(e.message ?? 'Não foi possível enviar o story.');
    } finally {
      setEnviando(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function abrirGrupo(usuarioId) {
    const idx = grupos.findIndex((g) => g.usuario.id === usuarioId);
    if (idx >= 0) setGrupoAberto(idx);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div className="stories-row">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 'none', width: 62 }}>
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => (meuGrupo ? abrirGrupo(usuario.id) : inputRef.current?.click())}
              className={`story-bubble-ring ${meuGrupo ? (grupoTemNaoVisto(meuGrupo) ? '' : 'seen') : 'empty'}`}
              style={{ cursor: 'pointer' }}
            >
              <span className="story-bubble-inner">
                <Avatar nome={usuario.nome} url={usuario.avatar_url} size={56} />
              </span>
            </button>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={enviando}
              aria-label="Adicionar story"
              style={{
                position: 'absolute',
                bottom: -2,
                right: -2,
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: 'var(--accent)',
                color: '#fff',
                border: '2px solid var(--surface-raised)',
                fontSize: '0.85rem',
                lineHeight: 1,
                cursor: 'pointer',
                boxShadow: 'var(--shadow)',
              }}
            >
              {enviando ? '…' : '+'}
            </button>
          </div>
          <span style={{ fontSize: '0.68rem', color: 'var(--muted)', textAlign: 'center' }}>Seu story</span>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          onChange={aoEscolherArquivo}
          style={{ display: 'none' }}
        />

        {outrosGrupos.map((g) => (
          <button
            key={g.usuario.id}
            type="button"
            onClick={() => abrirGrupo(g.usuario.id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              flex: 'none',
              width: 62,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <span className={`story-bubble-ring ${grupoTemNaoVisto(g) ? '' : 'seen'}`}>
              <span className="story-bubble-inner">
                <Avatar nome={g.usuario.nome} url={g.usuario.avatar_url} size={56} />
              </span>
            </span>
            <span
              style={{
                fontSize: '0.68rem',
                color: 'var(--muted)',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '100%',
              }}
            >
              {g.usuario.nome}
            </span>
          </button>
        ))}
      </div>

      {erro && <p style={{ color: 'var(--p0)', fontSize: '0.8rem', margin: 0 }}>{erro}</p>}

      {grupoAberto !== null && (
        <StoryViewer
          grupos={grupos}
          grupoInicial={grupoAberto}
          usuarioAtual={usuario}
          onFechar={() => {
            setGrupoAberto(null);
            carregar();
          }}
          onExcluido={(id) => {
            setGrupos((atuais) =>
              atuais
                .map((g) => ({ ...g, itens: g.itens.filter((i) => i.id !== id) }))
                .filter((g) => g.itens.length > 0)
            );
          }}
        />
      )}
    </div>
  );
}
