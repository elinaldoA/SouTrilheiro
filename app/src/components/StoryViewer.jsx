import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Avatar from './Avatar';
import { marcarVisto, excluirStory, listarVisualizadores } from '../api/stories';

const DURACAO_FOTO_MS = 5000;

function formatarHora(iso) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function IconOlho() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1.5 10S4.5 4 10 4s8.5 6 8.5 6-3 6-8.5 6-8.5-6-8.5-6Z" />
      <circle cx="10" cy="10" r="2.3" />
    </svg>
  );
}

export default function StoryViewer({ grupos, grupoInicial, usuarioAtual, onFechar, onExcluido }) {
  const [grupoIdx, setGrupoIdx] = useState(grupoInicial);
  const [itemIdx, setItemIdx] = useState(0);
  const [progresso, setProgresso] = useState(0);
  const [visualizadores, setVisualizadores] = useState([]);
  const [carregandoVisualizadores, setCarregandoVisualizadores] = useState(false);
  const [mostrarVisualizadores, setMostrarVisualizadores] = useState(false);
  const timerRef = useRef(null);
  const inicioRef = useRef(0);
  const pausadoRef = useRef(false);
  const pausadoDesdeRef = useRef(0);
  const videoRef = useRef(null);

  const grupo = grupos[grupoIdx];
  const item = grupo?.itens[itemIdx];
  const ehDono = item && usuarioAtual && item.usuario_id === usuarioAtual.id;

  function irPara(novoGrupoIdx, novoItemIdx) {
    if (novoGrupoIdx < 0) return;
    if (novoGrupoIdx >= grupos.length) {
      onFechar();
      return;
    }
    const g = grupos[novoGrupoIdx];
    if (novoItemIdx < 0) {
      irPara(novoGrupoIdx - 1, (grupos[novoGrupoIdx - 1]?.itens.length ?? 1) - 1);
      return;
    }
    if (novoItemIdx >= g.itens.length) {
      irPara(novoGrupoIdx + 1, 0);
      return;
    }
    setGrupoIdx(novoGrupoIdx);
    setItemIdx(novoItemIdx);
  }

  function proximo() {
    irPara(grupoIdx, itemIdx + 1);
  }

  function anterior() {
    irPara(grupoIdx, itemIdx - 1);
  }

  useEffect(() => {
    if (!item) return;
    setProgresso(0);
    setMostrarVisualizadores(false);
    pausadoRef.current = false;
    if (usuarioAtual && !ehDono) marcarVisto(item.id, usuarioAtual.id).catch(() => {});

    clearInterval(timerRef.current);
    inicioRef.current = Date.now();

    if (item.tipo === 'foto') {
      timerRef.current = setInterval(() => {
        if (pausadoRef.current) return;
        const decorrido = Date.now() - inicioRef.current;
        const pct = Math.min(100, (decorrido / DURACAO_FOTO_MS) * 100);
        setProgresso(pct);
        if (pct >= 100) proximo();
      }, 60);
    }

    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grupoIdx, itemIdx]);

  useEffect(() => {
    if (!item || !ehDono) {
      setVisualizadores([]);
      return;
    }
    let cancelado = false;
    setCarregandoVisualizadores(true);
    listarVisualizadores(item.id)
      .then((dados) => {
        if (!cancelado) setVisualizadores(dados);
      })
      .finally(() => {
        if (!cancelado) setCarregandoVisualizadores(false);
      });
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id, ehDono]);

  function alternarVisualizadores(mostrar) {
    setMostrarVisualizadores(mostrar);
    if (mostrar) {
      pausadoRef.current = true;
      pausadoDesdeRef.current = Date.now();
      videoRef.current?.pause();
    } else {
      if (pausadoRef.current) {
        inicioRef.current += Date.now() - pausadoDesdeRef.current;
      }
      pausadoRef.current = false;
      videoRef.current?.play();
    }
  }

  useEffect(() => {
    function aoTeclar(e) {
      if (e.key === 'ArrowRight') proximo();
      if (e.key === 'ArrowLeft') anterior();
      if (e.key === 'Escape') onFechar();
    }
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grupoIdx, itemIdx]);

  if (!item) return null;

  async function aoExcluir() {
    if (!window.confirm('Excluir este story?')) return;
    await excluirStory(item.id);
    onExcluido(item.id);
    proximo();
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ display: 'flex', gap: 4, padding: '10px 10px 0' }}>
        {grupo.itens.map((it, i) => (
          <div key={it.id} style={{ flex: 1, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.3)', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                background: '#fff',
                width: i < itemIdx ? '100%' : i === itemIdx ? `${progresso}%` : '0%',
                transition: i === itemIdx ? 'none' : 'width 0.2s',
              }}
            />
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', color: '#fff' }}>
        <Avatar nome={grupo.usuario?.nome} url={grupo.usuario?.avatar_url} size={30} />
        <Link to={`/usuario/${grupo.usuario?.id}`} style={{ color: '#fff', fontWeight: 600, fontSize: '0.85rem' }}>
          {grupo.usuario?.nome}
        </Link>
        <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)' }}>{formatarHora(item.criado_em)}</span>
        {item.trilhas && (
          <Link to={`/trilha/${item.trilhas.id}`} style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', marginLeft: 4 }}>
            {item.trilhas.nome}
          </Link>
        )}
        {ehDono && (
          <button
            type="button"
            onClick={aoExcluir}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'rgba(255,255,255,0.85)', fontSize: '0.76rem' }}
          >
            Excluir
          </button>
        )}
        <button
          type="button"
          onClick={onFechar}
          style={{ marginLeft: ehDono ? 8 : 'auto', background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', lineHeight: 1 }}
        >
          ×
        </button>
      </div>

      <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {item.tipo === 'foto' ? (
          <img src={item.url} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
        ) : (
          <video
            ref={videoRef}
            src={item.url}
            autoPlay
            playsInline
            style={{ maxWidth: '100%', maxHeight: '100%' }}
            onTimeUpdate={(e) => {
              const v = e.currentTarget;
              if (v.duration) setProgresso((v.currentTime / v.duration) * 100);
            }}
            onEnded={proximo}
          />
        )}

        <button
          type="button"
          onClick={anterior}
          aria-label="Anterior"
          style={{ position: 'absolute', inset: '0 50% 0 0', background: 'none', border: 'none', cursor: 'pointer' }}
        />
        <button
          type="button"
          onClick={proximo}
          aria-label="Próximo"
          style={{ position: 'absolute', inset: '0 0 0 50%', background: 'none', border: 'none', cursor: 'pointer' }}
        />
      </div>

      {ehDono && (
        <button
          type="button"
          onClick={() => alternarVisualizadores(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            alignSelf: 'flex-start',
            margin: '0 12px 14px',
            padding: '6px 12px',
            borderRadius: 999,
            background: 'rgba(255,255,255,0.12)',
            border: 'none',
            color: '#fff',
            fontSize: '0.78rem',
          }}
        >
          <IconOlho />
          {visualizadores.length}
        </button>
      )}

      {mostrarVisualizadores && (
        <div
          role="presentation"
          onClick={() => alternarVisualizadores(false)}
          style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 5 }}
        >
          <div
            role="presentation"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              maxHeight: '55%',
              background: 'var(--surface-raised)',
              borderRadius: '16px 16px 0 0',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <strong style={{ fontSize: '0.9rem' }}>
                {visualizadores.length} {visualizadores.length === 1 ? 'visualização' : 'visualizações'}
              </strong>
              <button
                type="button"
                onClick={() => alternarVisualizadores(false)}
                style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '1.1rem', lineHeight: 1 }}
              >
                ×
              </button>
            </div>

            {carregandoVisualizadores && <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Carregando…</p>}
            {!carregandoVisualizadores && visualizadores.length === 0 && (
              <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Ainda ninguém viu este story.</p>
            )}
            {visualizadores.map((v) => (
              <Link
                key={v.id}
                to={`/usuario/${v.id}`}
                style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--ink)' }}
              >
                <Avatar nome={v.nome} url={v.avatar_url} size={36} />
                <span style={{ flex: 1, fontSize: '0.88rem' }}>{v.nome}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>{formatarHora(v.vistoEm)}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
