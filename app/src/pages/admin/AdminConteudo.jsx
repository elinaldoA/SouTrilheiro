import { useEffect, useState } from 'react';
import { listarConteudoAdmin, excluirConteudoAdmin, listarComentariosFeedAdmin, excluirComentarioFeedAdmin } from '../../api/admin';
import { atualizarFoto } from '../../api/fotos';
import { atualizarVideo } from '../../api/videos';
import { LinhaConteudo, PreviewMidiaGrande, FormEditarMidia, formatarDataConteudo } from '../../components/admin/ConteudoMidia';

const ABAS = [
  { chave: 'percursos', rotulo: 'Percursos' },
  { chave: 'avaliacoes', rotulo: 'Avaliações' },
  { chave: 'fotos', rotulo: 'Fotos' },
  { chave: 'videos', rotulo: 'Vídeos' },
  { chave: 'comentarios', rotulo: 'Comentários' },
];

const ABAS_COM_GRID_MIDIA = ['fotos', 'videos'];

const TAMANHO_PAGINA = 20;

export default function AdminConteudo() {
  const [aba, setAba] = useState('percursos');
  const [itens, setItens] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [esgotado, setEsgotado] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [editandoId, setEditandoId] = useState(null);

  function carregarPagina(abaAtual, cursorAtual, substituir) {
    setCarregando(true);
    const promessa =
      abaAtual === 'comentarios'
        ? listarComentariosFeedAdmin(cursorAtual, TAMANHO_PAGINA)
        : listarConteudoAdmin(abaAtual, cursorAtual, TAMANHO_PAGINA);
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
      .catch((e) => setErro(e.message ?? 'Não foi possível carregar o conteúdo.'))
      .finally(() => setCarregando(false));
  }

  useEffect(() => {
    setItens([]);
    setCursor(null);
    setEsgotado(false);
    setEditandoId(null);
    carregarPagina(aba, null, true);
  }, [aba]);

  async function aoExcluir(item) {
    if (!window.confirm('Excluir este item? Não dá para desfazer.')) return;
    if (aba === 'comentarios') {
      await excluirComentarioFeedAdmin(item.id);
    } else {
      await excluirConteudoAdmin(aba, item.id);
    }
    setItens((atuais) => atuais.filter((x) => x.id !== item.id));
  }

  async function aoSalvarEdicao(item, legenda, localizacao) {
    const atualizar = aba === 'fotos' ? atualizarFoto : atualizarVideo;
    await atualizar(item.id, legenda, localizacao);
    setItens((atuais) =>
      atuais.map((x) => (x.id === item.id ? { ...x, legenda: legenda || null, localizacao: localizacao || null } : x))
    );
    setEditandoId(null);
  }

  const comGridMidia = ABAS_COM_GRID_MIDIA.includes(aba);

  return (
    <div className="admin-page">
      <h1>Conteúdo</h1>
      <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: 0 }}>
        Gerencie cada tipo de conteúdo separadamente. Para ver tudo mesclado por data como no feed real, use{' '}
        <strong>Feed</strong>.
      </p>

      <div className="admin-tabs">
        {ABAS.map((a) => (
          <button
            key={a.chave}
            type="button"
            className={`admin-tab${aba === a.chave ? ' active' : ''}`}
            onClick={() => setAba(a.chave)}
          >
            {a.rotulo}
          </button>
        ))}
      </div>

      {erro && <p className="state-message">{erro}</p>}

      {comGridMidia ? (
        <div className="admin-midia-grid">
          {itens.map((item) => (
            <div key={item.id} className="admin-card admin-midia-card">
              <PreviewMidiaGrande item={item} />
              <p className="admin-card-row-meta">
                por {item.usuario?.nome ?? '—'} em {formatarDataConteudo(item.criadoEm)}
              </p>
              {editandoId === item.id ? (
                <FormEditarMidia
                  item={item}
                  onCancelar={() => setEditandoId(null)}
                  onSalvar={(legenda, localizacao) => aoSalvarEdicao(item, legenda, localizacao)}
                />
              ) : (
                <>
                  <div className="admin-card-row-titulo">{item.legenda || <em>(sem legenda)</em>}</div>
                  {item.localizacao && <p className="admin-card-row-meta">{item.localizacao}</p>}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditandoId(item.id)}>
                      Editar
                    </button>
                    <button type="button" className="btn btn-perigo btn-sm" onClick={() => aoExcluir(item)}>
                      Excluir
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
          {!carregando && itens.length === 0 && !erro && <p className="state-message">Nenhum item encontrado.</p>}
        </div>
      ) : (
        <div className="admin-list">
          {itens.map((item) => (
            <LinhaConteudo
              key={item.id}
              item={item}
              ehComentario={aba === 'comentarios'}
              editando={editandoId === item.id}
              onEditar={() => setEditandoId(item.id)}
              onCancelarEdicao={() => setEditandoId(null)}
              onSalvarEdicao={(legenda, localizacao) => aoSalvarEdicao(item, legenda, localizacao)}
              onExcluir={() => aoExcluir(item)}
            />
          ))}
          {!carregando && itens.length === 0 && !erro && <p className="state-message">Nenhum item encontrado.</p>}
        </div>
      )}

      {carregando && <p className="state-message">Carregando…</p>}

      {!carregando && !esgotado && itens.length > 0 && (
        <button type="button" className="btn btn-outline" onClick={() => carregarPagina(aba, cursor, false)}>
          Carregar mais
        </button>
      )}
    </div>
  );
}
