import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { listarItensSalvos, removerSalvo } from '../api/salvos';
import { buscarCurtidasEmLote, curtir, descurtir, aplicarReacaoOtimista } from '../api/curtidas';
import { contarComentariosEmLote } from '../api/feedComentarios';
import { listarMarcacoesEmLote } from '../api/marcacoes';
import { listarMencoesEmLote } from '../api/mencoes';
import FeedItemCard from '../components/FeedItemCard';

export default function Salvos() {
  const { usuario, carregando: carregandoAuth } = useAuth();
  const [itens, setItens] = useState([]);
  const [curtidas, setCurtidas] = useState({});
  const [comentariosTotais, setComentariosTotais] = useState({});
  const [marcacoes, setMarcacoes] = useState({});
  const [mencoes, setMencoes] = useState({});
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    if (!usuario) return;
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario]);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      const dados = await listarItensSalvos(usuario.id);
      setItens(dados);

      const itensMidia = dados.filter((d) => d.tipo === 'foto' || d.tipo === 'video').map((d) => ({ tipo: d.tipo, id: d.id }));
      const paresItens = dados.map((d) => ({ tipo: d.tipo, id: d.id }));
      const [curtidasDados, comentariosDados, marcacoesDados, mencoesDados] = await Promise.all([
        buscarCurtidasEmLote(paresItens),
        contarComentariosEmLote(paresItens),
        listarMarcacoesEmLote(itensMidia),
        listarMencoesEmLote(itensMidia),
      ]);
      setCurtidas(curtidasDados);
      setComentariosTotais(comentariosDados);
      setMarcacoes(marcacoesDados);
      setMencoes(mencoesDados);
    } catch (e) {
      setErro(e.message ?? 'Não foi possível carregar os itens salvos.');
    } finally {
      setCarregando(false);
    }
  }

  async function alternarCurtida(item, reacao = 'adorei') {
    const chave = `${item.tipo}:${item.id}`;
    const atual = curtidas[chave];
    const { estado, remover } = aplicarReacaoOtimista(atual, reacao);
    setCurtidas((c) => ({ ...c, [chave]: estado }));
    try {
      if (remover) await descurtir(usuario.id, item.tipo, item.id);
      else await curtir(usuario.id, item.tipo, item.id, reacao);
    } catch (e) {
      console.error('Não foi possível salvar a reação:', e);
      setCurtidas((c) => ({ ...c, [chave]: atual ?? { total: 0, curtido: false, minhaReacao: null, porReacao: {} } }));
    }
  }

  async function removerDaLista(item) {
    setItens((atuais) => atuais.filter((i) => !(i.tipo === item.tipo && i.id === item.id)));
    try {
      await removerSalvo(usuario.id, item.tipo, item.id);
    } catch {
      setItens((atuais) => [...atuais, item]);
    }
  }

  function itemExcluido(item) {
    setItens((atuais) => atuais.filter((i) => !(i.tipo === item.tipo && i.id === item.id)));
  }

  function itemEditado(item, novosDados) {
    setItens((atuais) => atuais.map((i) => (i.tipo === item.tipo && i.id === item.id ? { ...i, ...novosDados } : i)));
  }

  if (carregandoAuth) return <p className="state-message">Carregando…</p>;

  if (!usuario) {
    return (
      <p className="state-message">
        <Link to="/perfil">Entre</Link> para ver seus itens salvos.
      </p>
    );
  }

  return (
    <>
      <h1 style={{ fontSize: '1.2rem' }}>Salvos</h1>

      {carregando && <p className="state-message">Carregando…</p>}

      {!carregando && erro && (
        <p style={{ color: 'var(--p0)', fontSize: '0.88rem' }}>
          {erro}{' '}
          <button type="button" onClick={carregar} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: 0 }}>
            Tentar de novo
          </button>
        </p>
      )}

      {!carregando && !erro && itens.length === 0 && (
        <p style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>Você ainda não salvou nada do feed.</p>
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
              salvo
              onAlternarSalvo={removerDaLista}
              onExcluido={itemExcluido}
              onItemEditado={itemEditado}
              marcacoes={marcacoes[chave]}
              mencoes={mencoes[chave]}
            />
          );
        })}
      </div>
    </>
  );
}
