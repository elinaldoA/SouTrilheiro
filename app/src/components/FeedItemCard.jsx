import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Avatar from './Avatar';
import {
  listarComentariosItem,
  criarComentarioItem,
  excluirComentarioItem,
} from '../api/feedComentarios';
import { excluirPercurso } from '../api/percursos';
import { excluirAvaliacao, enviarAvaliacao } from '../api/avaliacoes';
import { excluirFoto, atualizarFoto } from '../api/fotos';
import { excluirVideo, atualizarVideo } from '../api/videos';
import TextoComMarcacoes from './TextoComMarcacoes';

function formatarData(iso) {
  const data = new Date(iso);
  const agora = new Date();
  const diffMin = Math.round((agora - data) / 60000);
  if (diffMin < 1) return 'agora';
  if (diffMin < 60) return `${diffMin}min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `${diffH}h`;
  const diffD = Math.round(diffH / 24);
  if (diffD < 7) return `${diffD}d`;
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function IconCoracao({ preenchido }) {
  return (
    <svg width="19" height="19" viewBox="0 0 20 20" fill={preenchido ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 17.2 3.5 10.8a4.2 4.2 0 0 1 5.9-5.9L10 5.5l.6-.6a4.2 4.2 0 0 1 5.9 5.9Z" />
    </svg>
  );
}

function IconComentario() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 4.5h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H8l-3.6 3v-3H3a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Z" />
    </svg>
  );
}

async function excluirItem(item) {
  if (item.tipo === 'percurso') return excluirPercurso(item.id);
  if (item.tipo === 'avaliacao') return excluirAvaliacao(item.id);
  if (item.tipo === 'video') return excluirVideo(item.id);
  return excluirFoto(item.id);
}

function acaoResumo(item) {
  if (item.tipo === 'percurso') return <>percorreu <Link to={`/trilha/${item.trilha.id}`}>{item.trilha.nome}</Link></>;
  if (item.tipo === 'avaliacao') return <>avaliou <Link to={`/trilha/${item.trilha.id}`}>{item.trilha.nome}</Link></>;
  if (item.tipo === 'foto') {
    if (!item.trilha) return <>publicou uma foto</>;
    return <>enviou uma foto de <Link to={`/trilha/${item.trilha.id}`}>{item.trilha.nome}</Link></>;
  }
  if (!item.trilha) return <>publicou um vídeo</>;
  return <>enviou um vídeo de <Link to={`/trilha/${item.trilha.id}`}>{item.trilha.nome}</Link></>;
}

export default function FeedItemCard({ item, curtida, totalComentarios, usuarioAtual, onAlternarCurtida, onExcluido, onItemEditado, marcacoes, mencoes }) {
  const [comentariosAbertos, setComentariosAbertos] = useState(false);
  const [comentarios, setComentarios] = useState(null);
  const [carregandoComentarios, setCarregandoComentarios] = useState(false);
  const [novoComentario, setNovoComentario] = useState('');
  const [enviandoComentario, setEnviandoComentario] = useState(false);
  const [contador, setContador] = useState(totalComentarios ?? 0);

  useEffect(() => {
    setContador(totalComentarios ?? 0);
  }, [totalComentarios]);
  const [editando, setEditando] = useState(false);
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const [notaEdicao, setNotaEdicao] = useState(item.nota ?? 5);
  const [comentarioEdicao, setComentarioEdicao] = useState(item.comentario ?? '');
  const [legendaEdicao, setLegendaEdicao] = useState(item.legenda ?? '');
  const [localizacaoEdicao, setLocalizacaoEdicao] = useState(item.localizacao ?? '');
  const [excluindo, setExcluindo] = useState(false);
  const podeEditar = item.tipo === 'avaliacao' || item.tipo === 'foto' || item.tipo === 'video';

  const ehDono = item.usuario.id === usuarioAtual.id;

  async function alternarComentarios() {
    const abrir = !comentariosAbertos;
    setComentariosAbertos(abrir);
    if (abrir && comentarios === null) {
      setCarregandoComentarios(true);
      try {
        const dados = await listarComentariosItem(item.tipo, item.id);
        setComentarios(dados);
      } finally {
        setCarregandoComentarios(false);
      }
    }
  }

  async function enviarComentario(e) {
    e.preventDefault();
    if (!novoComentario.trim()) return;
    setEnviandoComentario(true);
    try {
      const registro = await criarComentarioItem(usuarioAtual.id, item.tipo, item.id, novoComentario.trim());
      setComentarios((atuais) => [...(atuais ?? []), registro]);
      setContador((n) => n + 1);
      setNovoComentario('');
    } finally {
      setEnviandoComentario(false);
    }
  }

  async function excluirComentario(id) {
    await excluirComentarioItem(id);
    setComentarios((atuais) => atuais.filter((c) => c.id !== id));
    setContador((n) => n - 1);
  }

  async function excluir() {
    if (!window.confirm('Excluir esta publicação?')) return;
    setExcluindo(true);
    try {
      await excluirItem(item);
      onExcluido(item);
    } finally {
      setExcluindo(false);
    }
  }

  async function salvarEdicao(e) {
    e.preventDefault();
    setSalvandoEdicao(true);
    try {
      if (item.tipo === 'avaliacao') {
        const atualizado = await enviarAvaliacao(item.trilhaId, usuarioAtual.id, Number(notaEdicao), comentarioEdicao.trim());
        onItemEditado(item, { nota: atualizado.nota, comentario: atualizado.comentario });
      } else if (item.tipo === 'foto') {
        const atualizado = await atualizarFoto(item.id, legendaEdicao.trim(), localizacaoEdicao.trim());
        onItemEditado(item, { legenda: atualizado.legenda, localizacao: atualizado.localizacao });
      } else if (item.tipo === 'video') {
        const atualizado = await atualizarVideo(item.id, legendaEdicao.trim(), localizacaoEdicao.trim());
        onItemEditado(item, { legenda: atualizado.legenda, localizacao: atualizado.localizacao });
      }
      setEditando(false);
    } finally {
      setSalvandoEdicao(false);
    }
  }

  return (
    <div className="feed-card">
      <div className="feed-card-header">
        <Link to={`/usuario/${item.usuario.id}`} style={{ flex: 'none' }}>
          <Avatar nome={item.usuario.nome} url={item.usuario.avatar_url} size={40} />
        </Link>
        <div className="feed-card-header-text">
          <Link to={`/usuario/${item.usuario.id}`} className="feed-card-name">
            {item.usuario.nome}
          </Link>
          <span className="feed-card-action">
            {acaoResumo(item)}
            {marcacoes && marcacoes.length > 0 && (
              <>
                {' '}com{' '}
                {marcacoes.map((p, i) => (
                  <span key={p.id}>
                    <Link to={`/usuario/${p.id}`}>{p.nome}</Link>
                    {i < marcacoes.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </>
            )}
          </span>
          {item.localizacao && (
            <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>{item.localizacao}</span>
          )}
        </div>
        <span className="feed-card-time">{formatarData(item.criadoEm)}</span>
      </div>

      {item.tipo === 'foto' && <img src={item.url} alt="" className="feed-card-media" loading="lazy" />}

      {item.tipo === 'video' && (
        <video src={item.url} controls preload="metadata" className="feed-card-media" style={{ background: '#000' }} />
      )}

      {(item.tipo === 'foto' || item.tipo === 'video') && !editando && item.legenda && (
        <p className="feed-card-body" style={{ margin: '2px 0 8px' }}>
          <TextoComMarcacoes texto={item.legenda} mencoes={mencoes} />
        </p>
      )}

      {(item.tipo === 'foto' || item.tipo === 'video') && editando && (
        <form onSubmit={salvarEdicao} style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '0 14px 10px' }}>
          <textarea
            className="field"
            rows={2}
            value={legendaEdicao}
            onChange={(e) => setLegendaEdicao(e.target.value)}
            placeholder="Escreva uma legenda…"
            style={{ fontSize: '0.85rem' }}
          />
          <input
            className="field"
            value={localizacaoEdicao}
            onChange={(e) => setLocalizacaoEdicao(e.target.value)}
            placeholder="Localização (opcional)"
            style={{ height: 32, fontSize: '0.82rem' }}
          />
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" className="btn-link" disabled={salvandoEdicao} style={{ textDecoration: 'none', fontSize: '0.76rem' }}>
              {salvandoEdicao ? 'Salvando…' : 'Salvar'}
            </button>
            <button type="button" className="btn-link" onClick={() => setEditando(false)} style={{ textDecoration: 'none', fontSize: '0.76rem' }}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {item.tipo === 'percurso' && (
        <p className="feed-card-body" style={{ margin: '2px 0 8px' }}>
          Distância percorrida: <strong>{item.distanciaKm} km</strong>
        </p>
      )}

      {item.tipo === 'avaliacao' && !editando && (
        <div className="feed-card-body" style={{ margin: '2px 0 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ color: 'var(--p1)', letterSpacing: 1 }}>{'★'.repeat(item.nota)}{'☆'.repeat(5 - item.nota)}</span>
          {item.comentario && <span>{item.comentario}</span>}
        </div>
      )}

      {item.tipo === 'avaliacao' && editando && (
        <form onSubmit={salvarEdicao} style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '0 14px 10px' }}>
          <select
            className="field"
            value={notaEdicao}
            onChange={(e) => setNotaEdicao(e.target.value)}
            style={{ height: 32, fontSize: '0.82rem', flex: 'none', width: 90 }}
          >
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                ★ {n}
              </option>
            ))}
          </select>
          <textarea
            className="field"
            rows={2}
            value={comentarioEdicao}
            onChange={(e) => setComentarioEdicao(e.target.value)}
            style={{ fontSize: '0.85rem' }}
          />
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" className="btn-link" disabled={salvandoEdicao} style={{ textDecoration: 'none', fontSize: '0.76rem' }}>
              {salvandoEdicao ? 'Salvando…' : 'Salvar'}
            </button>
            <button type="button" className="btn-link" onClick={() => setEditando(false)} style={{ textDecoration: 'none', fontSize: '0.76rem' }}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="feed-card-actions">
        <button type="button" className={`icon-btn ${curtida.curtido ? 'liked' : ''}`} onClick={() => onAlternarCurtida(item)}>
          <IconCoracao preenchido={curtida.curtido} />
        </button>

        <button type="button" className={`icon-btn ${comentariosAbertos ? 'active' : ''}`} onClick={alternarComentarios}>
          <IconComentario />
          {contador > 0 && <span>{contador}</span>}
        </button>

        {ehDono && !editando && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
            {podeEditar && (
              <button type="button" className="btn-link" onClick={() => setEditando(true)} style={{ textDecoration: 'none', fontSize: '0.72rem' }}>
                Editar
              </button>
            )}
            <button
              type="button"
              className="btn-link"
              onClick={excluir}
              disabled={excluindo}
              style={{ textDecoration: 'none', fontSize: '0.72rem', color: 'var(--p0)' }}
            >
              {excluindo ? 'Excluindo…' : 'Excluir'}
            </button>
          </div>
        )}
      </div>

      {curtida.total > 0 && (
        <p className="feed-card-likes">
          {curtida.total} {curtida.total === 1 ? 'curtida' : 'curtidas'}
        </p>
      )}

      {contador > 0 && !comentariosAbertos && (
        <button
          type="button"
          className="btn-link"
          onClick={alternarComentarios}
          style={{ textDecoration: 'none', margin: '6px 14px 12px', fontSize: '0.78rem', textAlign: 'left' }}
        >
          Ver {contador === 1 ? 'o comentário' : `os ${contador} comentários`}
        </button>
      )}

      {comentariosAbertos && (
        <div className="feed-card-footer" style={{ borderTop: '1px solid var(--line)', paddingTop: 8 }}>
          {carregandoComentarios && <p style={{ color: 'var(--muted)', fontSize: '0.78rem', margin: 0 }}>Carregando…</p>}
          {comentarios?.map((c) => (
            <div key={c.id} style={{ fontSize: '0.8rem', display: 'flex', gap: 6, alignItems: 'baseline' }}>
              <span style={{ fontWeight: 600 }}>{c.usuarios?.nome ?? 'Trilheiro'}</span>
              <span>{c.texto}</span>
              {c.usuario_id === usuarioAtual.id && (
                <button
                  type="button"
                  className="btn-link"
                  onClick={() => excluirComentario(c.id)}
                  style={{ textDecoration: 'none', fontSize: '0.7rem', color: 'var(--muted)', marginLeft: 'auto' }}
                >
                  excluir
                </button>
              )}
            </div>
          ))}
          {comentarios !== null && comentarios.length === 0 && !carregandoComentarios && (
            <p style={{ color: 'var(--muted)', fontSize: '0.78rem', margin: 0 }}>Nenhum comentário ainda.</p>
          )}
          <form onSubmit={enviarComentario} style={{ display: 'flex', gap: 6 }}>
            <input
              className="field"
              value={novoComentario}
              onChange={(e) => setNovoComentario(e.target.value)}
              placeholder="Escreva um comentário…"
              style={{ height: 34, fontSize: '0.8rem', flex: 1, minWidth: 0, borderRadius: 999 }}
            />
            <button type="submit" className="btn-link" disabled={enviandoComentario} style={{ textDecoration: 'none', fontSize: '0.76rem', flex: 'none' }}>
              Enviar
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
