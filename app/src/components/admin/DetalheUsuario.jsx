import { useEffect, useState } from 'react';
import { listarSeguidoresComPerfil, listarSeguindoComPerfil, deixarDeSeguir } from '../../api/seguidores';
import { listarItensSalvos } from '../../api/salvos';
import Avatar from '../Avatar';
import { DescricaoItem, MiniaturaMidia, ehMidia, formatarDataConteudo } from './ConteudoMidia';

const ABAS = [
  { chave: 'seguidores', rotulo: 'Seguidores' },
  { chave: 'seguindo', rotulo: 'Seguindo' },
  { chave: 'salvos', rotulo: 'Salvos' },
];

/**
 * Painel de detalhe "social" de um usuário: quem o segue, quem ele segue, e o que
 * ele salvou. Abre sob demanda dentro da linha da tabela de usuários.
 */
export default function DetalheUsuario({ usuario }) {
  const [aba, setAba] = useState('seguidores');
  const [dadosPorAba, setDadosPorAba] = useState({});
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    if (dadosPorAba[aba]) return;
    setCarregando(true);
    setErro(null);
    const promessa =
      aba === 'seguidores'
        ? listarSeguidoresComPerfil(usuario.id)
        : aba === 'seguindo'
          ? listarSeguindoComPerfil(usuario.id)
          : listarItensSalvos(usuario.id);
    promessa
      .then((dados) => setDadosPorAba((atuais) => ({ ...atuais, [aba]: dados })))
      .catch((e) => setErro(e.message ?? 'Não foi possível carregar.'))
      .finally(() => setCarregando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aba]);

  async function removerRelacao(pessoa) {
    if (aba === 'seguidores') {
      await deixarDeSeguir(pessoa.id, usuario.id);
    } else {
      await deixarDeSeguir(usuario.id, pessoa.id);
    }
    setDadosPorAba((atuais) => ({ ...atuais, [aba]: atuais[aba].filter((p) => p.id !== pessoa.id) }));
  }

  const itens = dadosPorAba[aba] ?? [];

  return (
    <div className="admin-detalhes-painel">
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

      {carregando && <p className="state-message">Carregando…</p>}
      {erro && <p className="state-message">{erro}</p>}

      {!carregando && !erro && itens.length === 0 && (
        <p className="admin-card-row-meta">
          {aba === 'seguidores' && 'Ninguém segue este usuário.'}
          {aba === 'seguindo' && 'Este usuário não segue ninguém.'}
          {aba === 'salvos' && 'Nada salvo ainda.'}
        </p>
      )}

      {!carregando && !erro && itens.length > 0 && aba !== 'salvos' && (
        <div className="admin-lista-social-itens">
          {itens.map((pessoa) => (
            <span key={pessoa.id} className="admin-chip-removivel">
              <Avatar nome={pessoa.nome} url={pessoa.avatar_url} size={18} />
              {pessoa.nome}
              <button type="button" onClick={() => removerRelacao(pessoa)} aria-label={`Remover ${pessoa.nome}`}>
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {!carregando && !erro && itens.length > 0 && aba === 'salvos' && (
        <div className="admin-list">
          {itens.map((item) => (
            <div key={`${item.tipo}:${item.id}`} className="admin-card admin-card-row">
              {ehMidia(item) && <MiniaturaMidia item={item} />}
              <div className="admin-card-row-info">
                <div className="admin-card-row-titulo">
                  <DescricaoItem item={item} />
                </div>
                <p className="admin-card-row-meta">salvo em {formatarDataConteudo(item.criadoEm)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
