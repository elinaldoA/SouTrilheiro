import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { buscarPorHashtag } from '../api/hashtags';
import { buscarCurtidasEmLote, curtir, descurtir, aplicarReacaoOtimista } from '../api/curtidas';
import { contarComentariosEmLote } from '../api/feedComentarios';
import { listarMarcacoesEmLote } from '../api/marcacoes';
import { listarMencoesEmLote } from '../api/mencoes';
import FeedItemCard from '../components/FeedItemCard';

export default function Hashtag() {
  const { tag } = useParams();
  const { usuario, carregando: carregandoAuth } = useAuth();
  const [itens, setItens] = useState([]);
  const [curtidas, setCurtidas] = useState({});
  const [comentariosTotais, setComentariosTotais] = useState({});
  const [marcacoes, setMarcacoes] = useState({});
  const [mencoes, setMencoes] = useState({});
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let cancelado = false;
    setCarregando(true);
    buscarPorHashtag(tag).then(async (dados) => {
      if (cancelado) return;
      setItens(dados);
      const chaves = dados.map((d) => ({ tipo: d.tipo, id: d.id }));
      const [curtidasDados, comentariosDados, marcacoesDados, mencoesDados] = await Promise.all([
        buscarCurtidasEmLote(chaves),
        contarComentariosEmLote(chaves),
        listarMarcacoesEmLote(chaves),
        listarMencoesEmLote(chaves),
      ]);
      if (cancelado) return;
      setCurtidas(curtidasDados);
      setComentariosTotais(comentariosDados);
      setMarcacoes(marcacoesDados);
      setMencoes(mencoesDados);
      setCarregando(false);
    });
    return () => {
      cancelado = true;
    };
  }, [tag]);

  async function alternarCurtida(item, reacao = 'adorei') {
    const chave = `${item.tipo}:${item.id}`;
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
    }
  }

  function itemExcluido(item) {
    setItens((atuais) => atuais.filter((i) => !(i.tipo === item.tipo && i.id === item.id)));
  }

  function itemEditado(item, novosDados) {
    setItens((atuais) => atuais.map((i) => (i.tipo === item.tipo && i.id === item.id ? { ...i, ...novosDados } : i)));
  }

  if (carregandoAuth || carregando) return <p className="state-message">Carregando…</p>;

  return (
    <>
      <h1 style={{ fontSize: '1.2rem' }}>#{tag}</h1>

      {!usuario && (
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
          <Link to="/perfil">Entre</Link> para curtir e comentar.
        </p>
      )}

      {itens.length === 0 && <p style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>Nada com essa hashtag ainda.</p>}

      {usuario && (
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
                onExcluido={itemExcluido}
                onItemEditado={itemEditado}
                marcacoes={marcacoes[chave]}
                mencoes={mencoes[chave]}
              />
            );
          })}
        </div>
      )}
    </>
  );
}
