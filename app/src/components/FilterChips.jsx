import { useMemo, useState } from 'react';
import { ESTADOS_BR } from '../lib/categorias';
import { useCategorias } from '../context/CategoriasContext';

const DIFICULDADES = [
  { valor: null, rotulo: 'Todas' },
  { valor: 'facil', rotulo: 'Fácil' },
  { valor: 'moderada', rotulo: 'Moderada' },
  { valor: 'dificil', rotulo: 'Difícil' },
];

const DISTANCIAS = [
  { valor: null, rotulo: 'Qualquer distância' },
  { valor: 5, rotulo: 'até 5 km' },
  { valor: 10, rotulo: 'até 10 km' },
  { valor: 20, rotulo: 'até 20 km' },
];

const TIPOS_PRECO = [
  { valor: null, rotulo: 'Todas' },
  { valor: 'gratuita', rotulo: 'Gratuitas' },
  { valor: 'paga', rotulo: 'Pagas' },
];

function rotuloDe(lista, valor) {
  return lista.find((item) => item.valor === valor)?.rotulo;
}

function IconFiltro() {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 5h14M6 10h8M8.5 15h3" />
    </svg>
  );
}

function Chip({ ativo, onClick, children }) {
  return (
    <button type="button" onClick={onClick} className={`chip${ativo ? ' active' : ''}`}>
      {children}
    </button>
  );
}

export default function FilterChips({
  dificuldade,
  distanciaMax,
  categoria,
  estado,
  tipoPreco,
  onChangeDificuldade,
  onChangeDistancia,
  onChangeCategoria,
  onChangeEstado,
  onChangeTipoPreco,
}) {
  const [aberto, setAberto] = useState(false);
  const { categorias } = useCategorias();
  const categoriasComTodas = useMemo(() => [{ valor: null, rotulo: 'Todas' }, ...categorias], [categorias]);

  const ativos = useMemo(() => {
    const lista = [];
    if (dificuldade) lista.push({ chave: 'dificuldade', rotulo: rotuloDe(DIFICULDADES, dificuldade), limpar: () => onChangeDificuldade(null) });
    if (distanciaMax) lista.push({ chave: 'distancia', rotulo: rotuloDe(DISTANCIAS, distanciaMax), limpar: () => onChangeDistancia(null) });
    if (tipoPreco) lista.push({ chave: 'preco', rotulo: rotuloDe(TIPOS_PRECO, tipoPreco), limpar: () => onChangeTipoPreco(null) });
    if (categoria) lista.push({ chave: 'categoria', rotulo: rotuloDe(categoriasComTodas, categoria), limpar: () => onChangeCategoria(null) });
    if (estado) lista.push({ chave: 'estado', rotulo: estado, limpar: () => onChangeEstado(null) });
    return lista;
  }, [
    dificuldade,
    distanciaMax,
    tipoPreco,
    categoria,
    estado,
    categoriasComTodas,
    onChangeDificuldade,
    onChangeDistancia,
    onChangeTipoPreco,
    onChangeCategoria,
    onChangeEstado,
  ]);

  function limparTudo() {
    onChangeDificuldade(null);
    onChangeDistancia(null);
    onChangeTipoPreco(null);
    onChangeCategoria(null);
    onChangeEstado(null);
  }

  return (
    <div className="filter-bar">
      <div className="filter-bar-row">
        <button
          type="button"
          className={`filter-trigger${ativos.length ? ' active' : ''}`}
          onClick={() => setAberto((v) => !v)}
          aria-expanded={aberto}
        >
          <IconFiltro />
          Filtros
          {ativos.length > 0 && <span className="filter-trigger-badge">{ativos.length}</span>}
        </button>

        {ativos.length > 0 && (
          <>
            <div className="filter-active-row">
              {ativos.map((f) => (
                <button key={f.chave} type="button" className="chip active chip-removable" onClick={f.limpar}>
                  {f.rotulo} <span aria-hidden="true">×</span>
                </button>
              ))}
            </div>
            <button type="button" className="btn-link filter-clear" onClick={limparTudo}>
              Limpar
            </button>
          </>
        )}
      </div>

      {aberto && (
        <div className="filter-panel">
          <div className="filter-group">
            <span className="filter-group-label">Dificuldade</span>
            <div className="filter-group-chips">
              {DIFICULDADES.map((d) => (
                <Chip key={d.rotulo} ativo={dificuldade === d.valor} onClick={() => onChangeDificuldade(d.valor)}>
                  {d.rotulo}
                </Chip>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <span className="filter-group-label">Distância</span>
            <div className="filter-group-chips">
              {DISTANCIAS.map((d) => (
                <Chip key={d.rotulo} ativo={distanciaMax === d.valor} onClick={() => onChangeDistancia(d.valor)}>
                  {d.rotulo}
                </Chip>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <span className="filter-group-label">Preço</span>
            <div className="filter-group-chips">
              {TIPOS_PRECO.map((t) => (
                <Chip key={t.rotulo} ativo={tipoPreco === t.valor} onClick={() => onChangeTipoPreco(t.valor)}>
                  {t.rotulo}
                </Chip>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <span className="filter-group-label">Categoria</span>
            <div className="filter-group-chips">
              {categoriasComTodas.map((c) => (
                <Chip key={c.rotulo} ativo={categoria === c.valor} onClick={() => onChangeCategoria(c.valor)}>
                  {c.rotulo}
                </Chip>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <span className="filter-group-label">Estado</span>
            <select
              value={estado ?? ''}
              onChange={(e) => onChangeEstado(e.target.value || null)}
              className="field filter-select"
            >
              <option value="">Todos os estados</option>
              {ESTADOS_BR.map((uf) => (
                <option key={uf} value={uf}>
                  {uf}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
