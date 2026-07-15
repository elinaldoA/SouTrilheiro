import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotificacoes } from '../context/NotificacoesContext';
import { listarSeguidos } from '../api/seguidores';
import { buscarFeed, buscarUltimaAtividadeEm, buscarResumoSemanal } from '../api/feed';
import { buscarCurtidasEmLote, curtir, descurtir, aplicarReacaoOtimista } from '../api/curtidas';
import { listarSalvosEmLote, salvarItem, removerSalvo } from '../api/salvos';
import { contarComentariosEmLote } from '../api/feedComentarios';
import { listarMarcacoesEmLote } from '../api/marcacoes';
import { listarMencoesEmLote } from '../api/mencoes';
import SugestoesTrilheiros from '../components/SugestoesTrilheiros';
import FeedItemCard from '../components/FeedItemCard';
import StoriesBar from '../components/StoriesBar';
import PublicarNoFeed from '../components/PublicarNoFeed';

const TAMANHO_PAGINA = 15;
const INTERVALO_VERIFICACAO_NOVOS = 45_000;

const FILTROS = [
  { valor: 'todos', rotulo: 'Todos', tabelas: null },
  { valor: 'percurso', rotulo: 'Percursos', tabelas: ['percursos'] },
  { valor: 'avaliacao', rotulo: 'Avaliações', tabelas: ['avaliacoes'] },
  { valor: 'foto', rotulo: 'Fotos', tabelas: ['fotos'] },
  { valor: 'video', rotulo: 'Vídeos', tabelas: ['videos'] },
];

function tabelasDoFiltro(filtro) {
  return FILTROS.find((f) => f.valor === filtro)?.tabelas ?? null;
}

function EsqueletoItem() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        padding: 14,
        borderRadius: 12,
        border: '1px solid var(--line)',
        background: 'var(--surface-raised)',
      }}
      aria-hidden="true"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div className="skeleton-shimmer" style={{ width: 36, height: 36, borderRadius: '50%' }} />
        <div className="skeleton-shimmer" style={{ width: 120, height: 12, borderRadius: 6 }} />
      </div>
      <div className="skeleton-shimmer" style={{ width: '100%', height: 120, borderRadius: 10 }} />
      <div className="skeleton-shimmer" style={{ width: '60%', height: 12, borderRadius: 6 }} />
    </div>
  );
}

export default function Feed() {
  const { usuario, carregando: carregandoAuth } = useAuth();
  const { marcarVisto, verificar } = useNotificacoes();
  const [itens, setItens] = useState([]);
  const [curtidas, setCurtidas] = useState({});
  const [salvos, setSalvos] = useState(new Set());
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
  const [erro, setErro] = useState(null);
  const [novidadesDisponiveis, setNovidadesDisponiveis] = useState(false);
  const [resumoSemanal, setResumoSemanal] = useState(null);
  const seguidoIdsRef = useRef([]);
  const sentinelaRef = useRef(null);
  const curtidasEmAndamentoRef = useRef(new Set());
  const salvosEmAndamentoRef = useRef(new Set());
  const esgotadoRef = useRef(false);
  const carregandoMaisRef = useRef(false);
  const ultimaAtividadeRef = useRef(null);
  const jaCarregouRef = useRef(false);

  useEffect(() => {
    if (!usuario) return;
    marcarVisto();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario]);

  useEffect(() => {
    if (!usuario) return;
    iniciar(filtro);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario, filtro]);

  useEffect(() => {
    if (!usuario) return;
    const intervalo = setInterval(async () => {
      try {
        const idsParaChecar = [usuario.id, ...seguidoIdsRef.current];
        const ultima = await buscarUltimaAtividadeEm(idsParaChecar);
        if (ultima && (!ultimaAtividadeRef.current || new Date(ultima) > new Date(ultimaAtividadeRef.current))) {
          if (ultimaAtividadeRef.current) setNovidadesDisponiveis(true);
          ultimaAtividadeRef.current = ultima;
        }
      } catch {
        // checagem de novidades é best-effort; ignora falhas silenciosamente
      }
    }, INTERVALO_VERIFICACAO_NOVOS);
    return () => clearInterval(intervalo);
  }, [usuario]);

  useEffect(() => {
    if (!usuario) return;
    (async () => {
      try {
        setResumoSemanal(await buscarResumoSemanal([usuario.id, ...seguidoIds]));
      } catch {
        // resumo semanal é best-effort; ignora falhas silenciosamente
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario, seguidoIds.join(',')]);

  async function anexarMetadados(dados) {
    const itensMidia = dados.filter((d) => d.tipo === 'foto' || d.tipo === 'video').map((d) => ({ tipo: d.tipo, id: d.id }));
    const paresItens = dados.map((d) => ({ tipo: d.tipo, id: d.id }));
    const [curtidasDados, comentariosDados, marcacoesDados, mencoesDados, salvosDados] = await Promise.all([
      buscarCurtidasEmLote(paresItens),
      contarComentariosEmLote(paresItens),
      listarMarcacoesEmLote(itensMidia),
      listarMencoesEmLote(itensMidia),
      listarSalvosEmLote(usuario.id, paresItens),
    ]);
    setCurtidas((atuais) => ({ ...atuais, ...curtidasDados }));
    setComentariosTotais((atuais) => ({ ...atuais, ...comentariosDados }));
    setMarcacoes((atuais) => ({ ...atuais, ...marcacoesDados }));
    setMencoes((atuais) => ({ ...atuais, ...mencoesDados }));
    setSalvos((atuais) => new Set([...atuais, ...salvosDados]));
  }

  async function iniciar(filtroAtual = 'todos') {
    setCarregando(true);
    setErro(null);
    if (jaCarregouRef.current) setItens([]);
    try {
      const idsSeguidos = await listarSeguidos(usuario.id);
      seguidoIdsRef.current = idsSeguidos;
      setSeguidoIds(idsSeguidos);
      setSeguindoAlguem(idsSeguidos.length > 0);

      const idsParaBusca = [usuario.id, ...idsSeguidos];
      const { itens: dados, proximoCursor, esgotado: acabou } = await buscarFeed(
        idsParaBusca,
        TAMANHO_PAGINA,
        null,
        tabelasDoFiltro(filtroAtual)
      );
      setItens(dados);
      setCursor(proximoCursor);
      setEsgotado(acabou);
      setNovidadesDisponiveis(false);
      ultimaAtividadeRef.current = await buscarUltimaAtividadeEm(idsParaBusca);
      await anexarMetadados(dados);
    } catch (e) {
      setErro(e.message ?? 'Não foi possível carregar o feed.');
    } finally {
      jaCarregouRef.current = true;
      setCarregando(false);
    }
  }

  function recarregarTudo() {
    iniciar(filtro);
    verificar();
  }

  async function carregarMais() {
    if (carregandoMaisRef.current || esgotadoRef.current) return;
    carregandoMaisRef.current = true;
    setCarregandoMais(true);
    try {
      const { itens: dados, proximoCursor, esgotado: acabou } = await buscarFeed(
        [usuario.id, ...seguidoIdsRef.current],
        TAMANHO_PAGINA,
        cursor,
        tabelasDoFiltro(filtro)
      );
      setItens((atuais) => [...atuais, ...dados]);
      setCursor(proximoCursor);
      setEsgotado(acabou);
      await anexarMetadados(dados);
    } finally {
      carregandoMaisRef.current = false;
      setCarregandoMais(false);
    }
  }

  useEffect(() => {
    esgotadoRef.current = esgotado;
  }, [esgotado]);

  const carregarMaisRef = useRef(carregarMais);
  useEffect(() => {
    carregarMaisRef.current = carregarMais;
  });

  useEffect(() => {
    const alvo = sentinelaRef.current;
    if (!alvo) return;
    const observador = new IntersectionObserver(
      (entradas) => {
        if (entradas[0].isIntersecting) carregarMaisRef.current();
      },
      { rootMargin: '200px' }
    );
    observador.observe(alvo);
    return () => observador.disconnect();
  }, []);

  async function alternarCurtida(item, reacao = 'adorei') {
    const chave = `${item.tipo}:${item.id}`;
    if (curtidasEmAndamentoRef.current.has(chave)) return;
    curtidasEmAndamentoRef.current.add(chave);

    const atual = curtidas[chave];
    const { estado, remover } = aplicarReacaoOtimista(atual, reacao);
    setCurtidas((c) => ({ ...c, [chave]: estado }));
    try {
      if (remover) {
        await descurtir(usuario.id, item.tipo, item.id);
      } else {
        await curtir(usuario.id, item.tipo, item.id, reacao);
      }
    } catch (e) {
      console.error('Não foi possível salvar a reação:', e);
      setCurtidas((c) => ({ ...c, [chave]: atual ?? { total: 0, curtido: false, minhaReacao: null, porReacao: {} } }));
    } finally {
      curtidasEmAndamentoRef.current.delete(chave);
    }
  }

  async function alternarSalvo(item) {
    const chave = `${item.tipo}:${item.id}`;
    if (salvosEmAndamentoRef.current.has(chave)) return;
    salvosEmAndamentoRef.current.add(chave);

    const estavaSalvo = salvos.has(chave);
    setSalvos((atuais) => {
      const proximo = new Set(atuais);
      if (estavaSalvo) proximo.delete(chave);
      else proximo.add(chave);
      return proximo;
    });
    try {
      if (estavaSalvo) {
        await removerSalvo(usuario.id, item.tipo, item.id);
      } else {
        await salvarItem(usuario.id, item.tipo, item.id);
      }
    } catch {
      setSalvos((atuais) => {
        const proximo = new Set(atuais);
        if (estavaSalvo) proximo.add(chave);
        else proximo.delete(chave);
        return proximo;
      });
    } finally {
      salvosEmAndamentoRef.current.delete(chave);
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

  if (erro && !jaCarregouRef.current) {
    return (
      <div className="state-message" style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
        <p>Não foi possível carregar o feed. {erro}</p>
        <button type="button" className="btn btn-outline" onClick={() => iniciar(filtro)}>
          Tentar de novo
        </button>
      </div>
    );
  }

  if (carregando && !jaCarregouRef.current) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <EsqueletoItem />
        <EsqueletoItem />
        <EsqueletoItem />
      </div>
    );
  }

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

      {resumoSemanal && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 12,
            border: '1px solid var(--line)',
            background: 'var(--surface-raised)',
            fontSize: '0.85rem',
            color: 'var(--ink)',
          }}
        >
          🥾 {resumoSemanal.participantes > 1 ? 'Você e quem você segue percorreram' : 'Você percorreu'}{' '}
          <strong>{resumoSemanal.totalKm.toFixed(1)} km</strong> nos últimos 7 dias.
        </div>
      )}

      {novidadesDisponiveis && (
        <button
          type="button"
          className="btn btn-outline"
          onClick={recarregarTudo}
          style={{ alignSelf: 'center' }}
        >
          ↑ Novas publicações
        </button>
      )}

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {FILTROS.map((f) => (
          <button
            key={f.valor}
            type="button"
            aria-pressed={filtro === f.valor}
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

      {carregando && itens.length === 0 && <EsqueletoItem />}

      {!carregando && erro && (
        <p style={{ color: 'var(--p0)', fontSize: '0.88rem' }}>
          {erro}{' '}
          <button type="button" onClick={() => iniciar(filtro)} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: 0 }}>
            Tentar de novo
          </button>
        </p>
      )}

      {!carregando && !erro && itens.length === 0 && (
        <p style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>Nada por aqui com esse filtro ainda.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {itens.map((item) => {
          const chave = `${item.tipo}:${item.id}`;
          return (
            <FeedItemCard
              key={chave}
              item={item}
              curtida={curtidas[chave] ?? { total: 0, curtido: false, minhaReacao: null, porReacao: {} }}
              totalComentarios={comentariosTotais[chave] ?? 0}
              usuarioAtual={usuario}
              onAlternarCurtida={alternarCurtida}
              salvo={salvos.has(chave)}
              onAlternarSalvo={alternarSalvo}
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
