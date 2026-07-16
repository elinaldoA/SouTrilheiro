import { Fragment, useEffect, useState } from 'react';
import { listarUsuariosAdmin, definirAdmin, banirUsuario, desbanirUsuario } from '../../api/admin';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../../components/Avatar';
import DetalheUsuario from '../../components/admin/DetalheUsuario';

const TAMANHO_PAGINA = 20;

function formatarData(iso) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function AdminUsuarios() {
  const { usuario: eu } = useAuth();
  const [termo, setTermo] = useState('');
  const [pagina, setPagina] = useState(0);
  const [usuarios, setUsuarios] = useState([]);
  const [total, setTotal] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [detalheId, setDetalheId] = useState(null);

  function carregar(termoAtual, paginaAtual) {
    setCarregando(true);
    listarUsuariosAdmin({ termo: termoAtual.trim() || null, limite: TAMANHO_PAGINA, offset: paginaAtual * TAMANHO_PAGINA })
      .then(({ usuarios: lista, total: t }) => {
        setUsuarios(lista);
        setTotal(t);
        setErro(null);
      })
      .catch((e) => setErro(e.message ?? 'Não foi possível carregar os usuários.'))
      .finally(() => setCarregando(false));
  }

  useEffect(() => {
    carregar(termo, pagina);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagina]);

  function aoBuscar(e) {
    e.preventDefault();
    setPagina(0);
    carregar(termo, 0);
  }

  async function aoAlternarAdmin(u) {
    const acao = u.is_admin ? 'remover admin de' : 'tornar admin';
    if (!window.confirm(`Quer ${acao} "${u.nome}"?`)) return;
    await definirAdmin(u.id, !u.is_admin);
    setUsuarios((atuais) => atuais.map((x) => (x.id === u.id ? { ...x, is_admin: !u.is_admin } : x)));
  }

  async function aoAlternarBanimento(u) {
    if (u.banido) {
      if (!window.confirm(`Desbanir "${u.nome}"?`)) return;
      await desbanirUsuario(u.id);
      setUsuarios((atuais) => atuais.map((x) => (x.id === u.id ? { ...x, banido: false, banido_motivo: null } : x)));
      return;
    }
    const motivo = window.prompt(`Motivo do banimento de "${u.nome}" (opcional):`);
    if (motivo === null) return;
    await banirUsuario(u.id, motivo);
    setUsuarios((atuais) => atuais.map((x) => (x.id === u.id ? { ...x, banido: true, banido_motivo: motivo || null } : x)));
  }

  const totalPaginas = Math.max(1, Math.ceil(total / TAMANHO_PAGINA));

  return (
    <div className="admin-page">
      <h1>Usuários</h1>

      <form className="admin-search" onSubmit={aoBuscar}>
        <input
          type="search"
          className="field"
          placeholder="Buscar por nome ou e-mail"
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
        />
        <button type="submit" className="btn btn-outline btn-sm">
          Buscar
        </button>
      </form>

      {carregando && <p className="state-message">Carregando…</p>}
      {erro && <p className="state-message">{erro}</p>}

      {!carregando && !erro && (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Usuário</th>
                  <th>E-mail</th>
                  <th>Cadastro</th>
                  <th>Status</th>
                  <th aria-label="Ações" />
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => (
                  <Fragment key={u.id}>
                    <tr>
                      <td>
                        <div className="admin-table-user">
                          <Avatar nome={u.nome} url={u.avatar_url} size={28} />
                          <span>{u.nome}</span>
                        </div>
                      </td>
                      <td>{u.email}</td>
                      <td>{formatarData(u.criado_em)}</td>
                      <td>
                        <div className="admin-table-badges">
                          {u.is_admin && (
                            <span className="mini-badge" style={{ color: 'var(--primary)', borderColor: 'var(--primary)' }}>
                              Admin
                            </span>
                          )}
                          {u.banido && (
                            <span className="mini-badge" style={{ color: 'var(--p0)', borderColor: 'var(--p0)' }} title={u.banido_motivo || undefined}>
                              Banido
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="admin-table-acoes">
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => setDetalheId((atual) => (atual === u.id ? null : u.id))}
                          >
                            {detalheId === u.id ? 'Ocultar' : 'Detalhes'}
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            disabled={u.id === eu?.id}
                            onClick={() => aoAlternarAdmin(u)}
                          >
                            {u.is_admin ? 'Remover admin' : 'Tornar admin'}
                          </button>
                          <button
                            type="button"
                            className="btn btn-perigo btn-sm"
                            disabled={u.id === eu?.id}
                            onClick={() => aoAlternarBanimento(u)}
                          >
                            {u.banido ? 'Desbanir' : 'Banir'}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {detalheId === u.id && (
                      <tr>
                        <td colSpan={5} style={{ padding: '0 14px 14px' }}>
                          <DetalheUsuario usuario={u} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
                {usuarios.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ color: 'var(--muted)', textAlign: 'center', padding: 20 }}>
                      Nenhum usuário encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="admin-pagination">
            <button type="button" className="btn btn-outline btn-sm" disabled={pagina === 0} onClick={() => setPagina((p) => p - 1)}>
              Anterior
            </button>
            <span>
              Página {pagina + 1} de {totalPaginas}
            </span>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              disabled={pagina + 1 >= totalPaginas}
              onClick={() => setPagina((p) => p + 1)}
            >
              Próxima
            </button>
          </div>
        </>
      )}
    </div>
  );
}
