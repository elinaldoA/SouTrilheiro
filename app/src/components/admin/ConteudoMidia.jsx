import { useState } from 'react';
import { buscarDetalhesItemAdmin } from '../../api/admin';
import { descurtir } from '../../api/curtidas';
import { excluirMarcacao } from '../../api/marcacoes';
import { excluirMencao } from '../../api/mencoes';

export function formatarDataConteudo(iso) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function ehMidia(item) {
  return item.tipo === 'foto' || item.tipo === 'video';
}

export function DescricaoItem({ item }) {
  if (item.tipo === 'percurso') {
    return (
      <span>
        {item.distanciaKm} km em {item.trilha?.nome ?? 'trilha removida'}
      </span>
    );
  }
  if (item.tipo === 'avaliacao') {
    return (
      <span>
        Nota {item.nota} em {item.trilha?.nome ?? 'trilha removida'}
        {item.comentario ? ` — "${item.comentario}"` : ''}
      </span>
    );
  }
  return <span>{item.legenda || item.trilha?.nome || '(sem legenda)'}</span>;
}

export function FormEditarMidia({ item, onSalvar, onCancelar }) {
  const [legenda, setLegenda] = useState(item.legenda ?? '');
  const [localizacao, setLocalizacao] = useState(item.localizacao ?? '');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);

  async function salvar(e) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    try {
      await onSalvar(legenda.trim(), localizacao.trim());
    } catch (e2) {
      setErro(e2.message ?? 'Não foi possível salvar.');
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={salvar} className="admin-midia-form">
      <textarea
        className="field"
        rows={2}
        value={legenda}
        onChange={(e) => setLegenda(e.target.value)}
        placeholder="Legenda"
      />
      <input
        className="field"
        value={localizacao}
        onChange={(e) => setLocalizacao(e.target.value)}
        placeholder="Localização (opcional)"
      />
      {erro && (
        <p className="state-message" style={{ margin: 0 }}>
          {erro}
        </p>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" className="btn btn-primary btn-sm" disabled={salvando}>
          {salvando ? 'Salvando…' : 'Salvar'}
        </button>
        <button type="button" className="btn btn-outline btn-sm" disabled={salvando} onClick={onCancelar}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

export function PreviewMidiaGrande({ item }) {
  if (item.tipo === 'foto') {
    return (
      <a href={item.url} target="_blank" rel="noreferrer" className="admin-midia-preview">
        <img src={item.url} alt={item.legenda || 'Foto enviada por um usuário'} loading="lazy" />
      </a>
    );
  }
  return (
    <div className="admin-midia-preview">
      <video src={item.url} controls preload="metadata" />
    </div>
  );
}

export function MiniaturaMidia({ item }) {
  if (item.tipo === 'foto') {
    return (
      <a href={item.url} target="_blank" rel="noreferrer" className="admin-midia-thumb">
        <img src={item.url} alt="" loading="lazy" />
      </a>
    );
  }
  return (
    <a href={item.url} target="_blank" rel="noreferrer" className="admin-midia-thumb">
      <video src={item.url} preload="metadata" muted />
    </a>
  );
}

function ItemSocial({ nome, extra, onRemover }) {
  return (
    <span className="admin-chip-removivel">
      {nome ?? '—'}
      {extra ? ` · ${extra}` : ''}
      <button type="button" onClick={onRemover} aria-label={`Remover ${nome ?? 'item'}`}>
        ×
      </button>
    </span>
  );
}

function ListaSocial({ titulo, vazio, itens }) {
  return (
    <div className="admin-lista-social">
      <h4>
        {titulo} ({itens.length})
      </h4>
      {itens.length === 0 ? <p className="admin-card-row-meta">{vazio}</p> : <div className="admin-lista-social-itens">{itens}</div>}
    </div>
  );
}

/**
 * Reações, marcações e menções de um item do feed — carregado sob demanda ao abrir,
 * com opção de remover cada uma (útil quando alguém marca/menciona outra pessoa sem
 * consentimento, ou reage de forma abusiva).
 */
export function DetalhesSociais({ item }) {
  const [aberto, setAberto] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState(null);

  function alternar() {
    const proximo = !aberto;
    setAberto(proximo);
    if (proximo && !dados && !carregando) {
      setCarregando(true);
      buscarDetalhesItemAdmin(item.tipo, item.id)
        .then(setDados)
        .catch((e) => setErro(e.message ?? 'Não foi possível carregar os detalhes.'))
        .finally(() => setCarregando(false));
    }
  }

  async function removerReacao(usuarioId) {
    await descurtir(usuarioId, item.tipo, item.id);
    setDados((atuais) => ({ ...atuais, reacoes: atuais.reacoes.filter((r) => r.usuario_id !== usuarioId) }));
  }

  async function removerMarcacao(id) {
    await excluirMarcacao(id);
    setDados((atuais) => ({ ...atuais, marcacoes: atuais.marcacoes.filter((m) => m.id !== id) }));
  }

  async function removerMencao(id) {
    await excluirMencao(id);
    setDados((atuais) => ({ ...atuais, mencoes: atuais.mencoes.filter((m) => m.id !== id) }));
  }

  return (
    <div className="admin-detalhes-sociais">
      <button type="button" className="admin-detalhes-toggle" onClick={alternar}>
        {aberto ? 'Ocultar reações, marcações e menções' : 'Ver reações, marcações e menções'}
      </button>
      {aberto && (
        <div className="admin-detalhes-painel">
          {carregando && <p className="state-message">Carregando…</p>}
          {erro && <p className="state-message">{erro}</p>}
          {dados && (
            <>
              <ListaSocial
                titulo="Reações"
                vazio="Ninguém reagiu ainda."
                itens={dados.reacoes.map((r) => (
                  <ItemSocial key={r.usuario_id} nome={r.usuarios?.nome} extra={r.reacao} onRemover={() => removerReacao(r.usuario_id)} />
                ))}
              />
              <ListaSocial
                titulo="Marcações"
                vazio="Ninguém foi marcado."
                itens={dados.marcacoes.map((m) => (
                  <ItemSocial key={m.id} nome={m.usuarios?.nome} onRemover={() => removerMarcacao(m.id)} />
                ))}
              />
              <ListaSocial
                titulo="Menções"
                vazio="Ninguém foi mencionado."
                itens={dados.mencoes.map((m) => (
                  <ItemSocial key={m.id} nome={m.usuarios?.nome} extra={m.texto_marcador} onRemover={() => removerMencao(m.id)} />
                ))}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Uma linha de conteúdo (feed mesclado, percursos, avaliações ou comentários).
 * `ehComentario` distingue comentários de feed (item.texto) dos demais tipos (DescricaoItem),
 * que também ganham o painel de reações/marcações/menções (comentários não têm essas relações).
 */
export function LinhaConteudo({ item, ehComentario, editando, onEditar, onCancelarEdicao, onSalvarEdicao, onExcluir }) {
  const comEdicao = ehMidia(item);

  if (editando) {
    return (
      <div className="admin-card admin-card-row">
        <MiniaturaMidia item={item} />
        <div className="admin-card-row-info">
          <FormEditarMidia item={item} onCancelar={onCancelarEdicao} onSalvar={onSalvarEdicao} />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="admin-card admin-card-row">
        {comEdicao && <MiniaturaMidia item={item} />}
        <div className="admin-card-row-info">
          <div className="admin-card-row-titulo">{ehComentario ? <span>{item.texto}</span> : <DescricaoItem item={item} />}</div>
          <p className="admin-card-row-meta">
            por {item.usuario?.nome ?? item.usuarios?.nome ?? '—'} em {formatarDataConteudo(item.criadoEm ?? item.criado_em)}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {comEdicao && (
            <button type="button" className="btn btn-outline btn-sm" onClick={onEditar}>
              Editar
            </button>
          )}
          <button type="button" className="btn btn-perigo btn-sm" onClick={onExcluir}>
            Excluir
          </button>
        </div>
      </div>
      {!ehComentario && <DetalhesSociais item={item} />}
    </>
  );
}
