import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotificacoes } from '../context/NotificacoesContext';
import { listarSeguidos } from '../api/seguidores';
import { buscarFeed } from '../api/feed';
import { buscarCurtidasEmLote, curtir, descurtir } from '../api/curtidas';
import { contarComentariosEmLote } from '../api/feedComentarios';
import { listarMarcacoesEmLote } from '../api/marcacoes';
import { listarMencoesEmLote } from '../api/mencoes';
import SugestoesTrilheiros from '../components/SugestoesTrilheiros';
import FeedItemCard from '../components/FeedItemCard';
import StoriesBar from '../components/StoriesBar';
import PublicarNoFeed from '../components/PublicarNoFeed';

const TAMANHO_PAGINA = 15;

const FILTROS = [
  { valor: 'todos', rotulo: 'Todos' },
  { valor: 'percurso', rotulo: 'Percursos' },
  { valor: 'avaliacao', rotulo: 'Avaliações' },
  { valor: 'foto', rotulo: 'Fotos' },
  { valor: 'video', rotulo: 'Vídeos' },
];

export default function Feed() {
  const { usuario, carregando: carregandoAuth } = useAuth();
  const { marcarVisto, verificar } = useNotificacoes();
  const [itens, setItens] = useState([]);
  const [curtidas, setCurtidas] = useState({});
  const [comentariosTotais, setComentariosTotais] = useState({});
  const [marcacoes, setMarcacoes] = useState({});
  const [mencoes, setMencoes] = useState({});
  const [carregando, setCarregando] = useState(true);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [seguindoAlguem, setSeguindoAlguem] = useState(true);
  const [seguidoIds, setSeguidoIds] = useState([]);
  const [filtro, setFiltro] = useState('todos');
  const [cursor, setCursor] = useState(null);
  const [esgotado, setEsgotado] = useState(false);
  const seguidoIdsRef = useRef([]);
  const sentinelaRef = useRef(null);

  useEffect(() => {
    if (!usuario) return;
    iniciar();
    marcarVisto();
  }, [usuario]);

  async function anexarMetadados(dados) {
    const itensMidia = dados.filter((d) => d.tipo === 'foto' || d.tipo === 'video').map((d) => ({ tipo: d.tipo, id: d.id }));
    const [curtidasDados, comentariosDados, marcacoesDados, mencoesDados] = await Promise.all([
      buscarCurtidasEmLote(dados.map((d) => ({ tipo: d.tipo, id: d.id }))),
      contarComentariosEmLote(dados.map((d) => ({ tipo: d.tipo, id: d.id }))),
      listarMarcacoesEmLote(itensMidia),
      listarMencoesEmLote(itensMidia),
    ]);
    setCurtidas((atuais) => ({ ...atuais, ...curtidasDados }));
    setComentariosTotais((atuais) => ({ ...atuais, ...comentariosDados }));
    setMarcacoes((atuais) => ({ ...atuais, ...marcacoesDados }));
    setMencoes((atuais) => ({ ...atuais, ...mencoesDados }));
  }

  async function iniciar() {
    setCarregando(true);
    const idsSeguidos = await listarSeguidos(usuario.id);
    seguidoIdsRef.current = idsSeguidos;
    setSeguidoIds(idsSeguidos);
    setSeguindoAlguem(idsSeguidos.length > 0);

    const { itens: dados, proximoCursor, esgotado: acabou } = await buscarFeed([usuario.id, ...idsSeguidos], TAMANHO_PAGINA, null);
    setItens(dados);
    setCursor(proximoCursor);
    setEsgotado(acabou);
    await anexarMetadados(dados);
    setCarregando(false);
  }

  function recarregarTudo() {
    iniciar();
    verificar();
  }

  async function carregarMais() {
    if (carregandoMais || esgotado) return;
    setCarregandoMais(true);
    try {
      const { itens: dados, proximoCursor, esgotado: acabou } = await buscarFeed(
        [usuario.id, ...seguidoIdsRef.current],
        TAMANHO_PAGINA,
        cursor
      );
      setItens((atuais) => [...atuais, ...dados]);
      setCursor(proximoCursor);
      setEsgotado(acabou);
      await anexarMetadados(dados);
    } finally {
      setCarregandoMais(false);
    }
  }

  useEffect(() => {
    if (!sentinelaRef.current || esgotado) return;
    const observador = new IntersectionObserver(
      (entradas) => {
        if (entradas[0].isIntersecting) carregarMais();
      },
      { rootMargin: '200px' }
    );
    observador.observe(sentinelaRef.current);
    return () => observador.disconnect();
  }, [sentinelaRef.current, esgotado, cursor, carregandoMais]);

  async function alternarCurtida(item) {
    const chave = `${item.tipo}:${item.id}`;
    const atual = curtidas[chave] ?? { total: 0, curtido: false };
    const otimista = { total: atual.curtido ? atual.total - 1 : atual.total + 1, curtido: !atual.curtido };
    setCurtidas((c) => ({ ...c, [chave]: otimista }));
    try {
      if (atual.curtido) {
        await descurtir(usuario.id, item.tipo, item.id);
      } else {
        await curtir(usuario.id, item.tipo, item.id);
      }
    } catch {
      setCurtidas((c) => ({ ...c, [chave]: atual }));
    }
  }

  function itemPublicado(item, pessoasMarcadas, mencoesItem) {
    const chave = `${item.tipo}:${item.id}`;
    setItens((atuais) => [item, ...atuais]);
    if (pessoasMarcadas?.length) setMarcacoes((atuais) => ({ ...atuais, [chave]: pessoasMarcadas }));
    if (mencoesItem?.length) setMencoes((atuais) => ({ ...atuais, [chave]: mencoesItem }));
  }

  function itemExcluido(item) {
    setItens((atuais) => atuais.filter((i) => !(i.tipo === item.tipo && i.id === item.id)));
  }

  function itemEditado(item, novosDados) {
    setItens((atuais) =>
      atuais.map((i) => (i.tipo === item.tipo && i.id === item.id ? { ...i, ...novosDados } : i))
    );
  }

  if (carregandoAuth) return <p className="state-message">Carregando…</p>;

  if (!usuario) {
    return (
      <p className="state-message">
        <Link to="/perfil">Entre</Link> para ver o feed de quem você segue.
      </p>
    );
  }

  if (carregando && itens.length === 0) return <p className="state-message">Carregando feed…</p>;

  if (!seguindoAlguem) {
    return (
      <>
        <StoriesBar usuario={usuario} seguidoIds={seguidoIds} />
        <PublicarNoFeed usuario={usuario} onPublicado={itemPublicado} />
        <div style={{ padding: '24px 0 8px', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', color: 'var(--ink)', marginBottom: 6 }}>
            Você ainda não segue ninguém
          </p>
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>Siga um trilheiro para ver a atividade dele aqui.</p>
        </div>
        <SugestoesTrilheiros usuarioId={usuario.id} onMudarSeguidos={recarregarTudo} />
      </>
    );
  }

  const itensFiltrados = filtro === 'todos' ? itens : itens.filter((i) => i.tipo === filtro);

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: '1.2rem' }}>Feed</h1>
        <Link
          to="/pessoas"
          aria-label="Encontrar trilheiros"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
            borderRadius: '50%',
            border: '1px solid var(--line)',
            background: 'var(--surface-raised)',
            color: 'var(--ink)',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="7.5" cy="6.5" r="2.8" />
            <path d="M2 16.5c0-2.8 2.5-4.5 5.5-4.5s5.5 1.7 5.5 4.5" />
            <path d="M13.2 4.3a2.8 2.8 0 0 1 0 5.4" />
            <path d="M15.5 12c2.3.4 3.5 1.9 3.5 4.2" />
          </svg>
        </Link>
      </div>

      <StoriesBar usuario={usuario} seguidoIds={seguidoIds} />

      <PublicarNoFeed usuario={usuario} onPublicado={itemPublicado} />

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {FILTROS.map((f) => (
          <button
            key={f.valor}
            type="button"
            onClick={() => setFiltro(f.valor)}
            style={{
              fontFamily: 'var(--mono)',
              fontSize: '0.72rem',
              padding: '5px 11px',
              borderRadius: 999,
              border: `1px solid ${filtro === f.valor ? 'var(--accent)' : 'var(--line)'}`,
              color: filtro === f.valor ? 'var(--accent)' : 'var(--muted)',
              background: 'var(--surface-raised)',
            }}
          >
            {f.rotulo}
          </button>
        ))}
      </div>

      {itensFiltrados.length === 0 && (
        <p style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>Nada por aqui com esse filtro ainda.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {itensFiltrados.map((item) => {
          const chave = `${item.tipo}:${item.id}`;
          return (
            <FeedItemCard
              key={chave}
              item={item}
              curtida={curtidas[chave] ?? { total: 0, curtido: false }}
              totalComentarios={comentariosTotais[chave] ?? 0}
              usuarioAtual={usuario}
              onAlternarCurtida={alternarCurtida}
              onExcluido={itemExcluido}
              onItemEditado={itemEditado}
              marcacoes={marcacoes[chave]}
              mencoes={mencoes[chave]}
            />
          );
        })}
      </div>

      <div ref={sentinelaRef} style={{ height: 1 }} />

      {!esgotado && (
        <button type="button" className="btn btn-outline" onClick={carregarMais} disabled={carregandoMais}>
          {carregandoMais ? 'Carregando…' : 'Carregar mais'}
        </button>
      )}
    </>
  );
}
