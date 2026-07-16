import { useEffect, useState } from 'react';
import { listarFeedCompletoAdmin, excluirConteudoAdmin, listarStoriesAdmin } from '../../api/admin';
import { TABELA_POR_TIPO } from '../../api/feed';
import { atualizarFoto } from '../../api/fotos';
import { atualizarVideo } from '../../api/videos';
import { excluirStory } from '../../api/stories';
import { LinhaConteudo } from '../../components/admin/ConteudoMidia';

const TAMANHO_PAGINA = 20;

const SECOES = [
  { chave: 'publicacoes', rotulo: 'Publicações' },
  { chave: 'stories', rotulo: 'Stories' },
];

function formatarDataHora(iso) {
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function CardStory({ story, onExcluir }) {
  const ativo = new Date(story.expira_em) > new Date();
  return (
    <div className="admin-card admin-midia-card">
      <div className="admin-midia-preview">
        {story.tipo === 'foto' ? (
          <img src={story.url} alt="" loading="lazy" />
        ) : (
          <video src={story.url} controls preload="metadata" />
        )}
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        <span className="mini-badge" style={ativo ? { color: 'var(--good)', borderColor: 'var(--good)' } : undefined}>
          {ativo ? 'ativo' : 'expirado'}
        </span>
        {story.trilhas?.nome && <span className="mini-badge">{story.trilhas.nome}</span>}
      </div>
      <p className="admin-card-row-meta">
        por {story.usuarios?.nome ?? '—'} em {formatarDataHora(story.criado_em)}
      </p>
      <button type="button" className="btn btn-perigo btn-sm" onClick={onExcluir}>
        Excluir
      </button>
    </div>
  );
}

export default function AdminFeed() {
  const [secao, setSecao] = useState('publicacoes');
  const [itens, setItens] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [esgotado, setEsgotado] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [editandoId, setEditandoId] = useState(null);

  function carregarPagina(secaoAtual, cursorAtual, substituir) {
    setCarregando(true);
    const promessa =
      secaoAtual === 'stories'
        ? listarStoriesAdmin(cursorAtual, TAMANHO_PAGINA)
        : listarFeedCompletoAdmin(cursorAtual, TAMANHO_PAGINA);
    promessa
      .then((pagina) => {
        setItens((atuais) => (substituir ? pagina : [...atuais, ...pagina]));
        setEsgotado(pagina.length < TAMANHO_PAGINA);
        if (pagina.length > 0) {
          const ultimo = pagina[pagina.length - 1];
          setCursor(ultimo.criadoEm ?? ultimo.criado_em);
        }
        setErro(null);
      })
      .catch((e) => setErro(e.message ?? 'Não foi possível carregar.'))
      .finally(() => setCarregando(false));
  }

  useEffect(() => {
    setItens([]);
    setCursor(null);
    setEsgotado(false);
    setEditandoId(null);
    carregarPagina(secao, null, true);
  }, [secao]);

  async function aoExcluir(item) {
    if (!window.confirm('Excluir este item? Não dá para desfazer.')) return;
    if (secao === 'stories') {
      await excluirStory(item.id);
    } else {
      await excluirConteudoAdmin(TABELA_POR_TIPO[item.tipo], item.id);
    }
    setItens((atuais) => atuais.filter((x) => x.id !== item.id));
  }

  async function aoSalvarEdicao(item, legenda, localizacao) {
    const atualizar = TABELA_POR_TIPO[item.tipo] === 'fotos' ? atualizarFoto : atualizarVideo;
    await atualizar(item.id, legenda, localizacao);
    setItens((atuais) =>
      atuais.map((x) => (x.id === item.id ? { ...x, legenda: legenda || null, localizacao: localizacao || null } : x))
    );
    setEditandoId(null);
  }

  return (
    <div className="admin-page">
      <h1>Feed</h1>
      <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: 0 }}>
        {secao === 'stories'
          ? 'Stories de todo mundo, inclusive já expirados — o que some do app depois de 24h continua visível aqui pra moderação.'
          : 'Percursos, avaliações, fotos e vídeos de todo mundo, mesclados por data — o mesmo feed que qualquer usuário vê, sem o filtro de quem ele segue.'}{' '}
        Para gerenciar por tipo (inclusive comentários), use <strong>Conteúdo</strong>.
      </p>

      <div className="admin-tabs">
        {SECOES.map((s) => (
          <button
            key={s.chave}
            type="button"
            className={`admin-tab${secao === s.chave ? ' active' : ''}`}
            onClick={() => setSecao(s.chave)}
          >
            {s.rotulo}
          </button>
        ))}
      </div>

      {erro && <p className="state-message">{erro}</p>}

      {secao === 'stories' ? (
        <div className="admin-midia-grid">
          {itens.map((story) => (
            <CardStory key={story.id} story={story} onExcluir={() => aoExcluir(story)} />
          ))}
          {!carregando && itens.length === 0 && !erro && <p className="state-message">Nenhum story encontrado.</p>}
        </div>
      ) : (
        <div className="admin-list">
          {itens.map((item) => (
            <LinhaConteudo
              key={item.id}
              item={item}
              editando={editandoId === item.id}
              onEditar={() => setEditandoId(item.id)}
              onCancelarEdicao={() => setEditandoId(null)}
              onSalvarEdicao={(legenda, localizacao) => aoSalvarEdicao(item, legenda, localizacao)}
              onExcluir={() => aoExcluir(item)}
            />
          ))}
          {!carregando && itens.length === 0 && !erro && <p className="state-message">Nenhum item no feed ainda.</p>}
        </div>
      )}

      {carregando && <p className="state-message">Carregando…</p>}

      {!carregando && !esgotado && itens.length > 0 && (
        <button type="button" className="btn btn-outline" onClick={() => carregarPagina(secao, cursor, false)}>
          Carregar mais
        </button>
      )}
    </div>
  );
}
