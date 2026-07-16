import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCategorias } from '../../context/CategoriasContext';
import { criarCategoria, atualizarCategoria } from '../../api/categorias';
import { buscarConfiguracao, definirConfiguracao } from '../../api/admin';

function slugify(texto) {
  return texto
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function LinhaCategoria({ categoria, onSalvar }) {
  const [rotulo, setRotulo] = useState(categoria.rotulo);
  const [ordem, setOrdem] = useState(categoria.ordem);
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    setSalvando(true);
    try {
      await onSalvar(categoria.id, { rotulo, ordem: Number(ordem) || 0 });
    } finally {
      setSalvando(false);
    }
  }

  async function alternarAtivo() {
    setSalvando(true);
    try {
      await onSalvar(categoria.id, { ativo: !categoria.ativo });
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="admin-card admin-card-row">
      <div className="admin-config-categoria">
        <input className="field" value={rotulo} onChange={(e) => setRotulo(e.target.value)} />
        <input
          className="field admin-config-ordem"
          type="number"
          value={ordem}
          onChange={(e) => setOrdem(e.target.value)}
        />
        <span className="mini-badge">{categoria.id}</span>
        {!categoria.ativo && (
          <span className="mini-badge" style={{ color: 'var(--muted)' }}>
            inativa
          </span>
        )}
      </div>
      <div className="admin-table-acoes">
        <button type="button" className="btn btn-outline btn-sm" disabled={salvando} onClick={salvar}>
          Salvar
        </button>
        <button
          type="button"
          className={categoria.ativo ? 'btn btn-perigo btn-sm' : 'btn btn-primary btn-sm'}
          disabled={salvando}
          onClick={alternarAtivo}
        >
          {categoria.ativo ? 'Desativar' : 'Reativar'}
        </button>
      </div>
    </div>
  );
}

export default function AdminConfiguracoes() {
  const { usuario } = useAuth();
  const { todas, recarregar } = useCategorias();
  const [novoRotulo, setNovoRotulo] = useState('');
  const [criando, setCriando] = useState(false);
  const [erroCategoria, setErroCategoria] = useState(null);

  const [comissao, setComissao] = useState('');
  const [carregandoComissao, setCarregandoComissao] = useState(true);
  const [salvandoComissao, setSalvandoComissao] = useState(false);
  const [erroComissao, setErroComissao] = useState(null);

  useEffect(() => {
    buscarConfiguracao('comissao_plataforma')
      .then((config) => setComissao(String(config?.valor?.percentual ?? '')))
      .catch((e) => setErroComissao(e.message ?? 'Não foi possível carregar a comissão.'))
      .finally(() => setCarregandoComissao(false));
  }, []);

  async function aoCriarCategoria(e) {
    e.preventDefault();
    const rotulo = novoRotulo.trim();
    if (!rotulo) return;
    const id = slugify(rotulo);
    if (!id) return;
    setCriando(true);
    setErroCategoria(null);
    try {
      await criarCategoria({ id, rotulo, ordem: todas.length + 1 });
      setNovoRotulo('');
      recarregar();
    } catch (e) {
      setErroCategoria(e.message ?? 'Não foi possível criar a categoria.');
    } finally {
      setCriando(false);
    }
  }

  async function aoSalvarCategoria(id, campos) {
    await atualizarCategoria(id, campos);
    recarregar();
  }

  async function aoSalvarComissao(e) {
    e.preventDefault();
    const percentual = Number(comissao);
    if (Number.isNaN(percentual)) return;
    setSalvandoComissao(true);
    setErroComissao(null);
    try {
      await definirConfiguracao('comissao_plataforma', { percentual }, usuario.id);
    } catch (e) {
      setErroComissao(e.message ?? 'Não foi possível salvar a comissão.');
    } finally {
      setSalvandoComissao(false);
    }
  }

  const categoriasOrdenadas = [...todas].sort((a, b) => a.ordem - b.ordem);

  return (
    <div className="admin-page">
      <h1>Configurações</h1>

      <div className="admin-card">
        <h2>Categorias de trilha</h2>
        <form className="admin-search" onSubmit={aoCriarCategoria}>
          <input
            className="field"
            placeholder="Nome da nova categoria"
            value={novoRotulo}
            onChange={(e) => setNovoRotulo(e.target.value)}
          />
          <button type="submit" className="btn btn-primary btn-sm" disabled={criando || !novoRotulo.trim()}>
            Adicionar
          </button>
        </form>
        {erroCategoria && <p className="state-message">{erroCategoria}</p>}

        <div className="admin-list">
          {categoriasOrdenadas.map((c) => (
            <LinhaCategoria key={c.id} categoria={c} onSalvar={aoSalvarCategoria} />
          ))}
          {categoriasOrdenadas.length === 0 && <p className="state-message">Nenhuma categoria cadastrada.</p>}
        </div>
      </div>

      <div className="admin-card">
        <h2>Comissão da plataforma</h2>
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
          Percentual retido sobre saídas guiadas pagas. Hoje é só um valor de referência — o app ainda não processa
          pagamentos.
        </p>
        {carregandoComissao ? (
          <p className="state-message">Carregando…</p>
        ) : (
          <form className="admin-search" onSubmit={aoSalvarComissao}>
            <input
              className="field"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={comissao}
              onChange={(e) => setComissao(e.target.value)}
              style={{ maxWidth: 120 }}
            />
            <span style={{ alignSelf: 'center' }}>%</span>
            <button type="submit" className="btn btn-primary btn-sm" disabled={salvandoComissao}>
              Salvar
            </button>
          </form>
        )}
        {erroComissao && <p className="state-message">{erroComissao}</p>}
      </div>
    </div>
  );
}
