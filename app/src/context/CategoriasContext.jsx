import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { listarCategorias } from '../api/categorias';

const PADRAO = { categorias: [], rotulo: {}, todas: [], recarregar: () => {} };

const CategoriasContext = createContext(PADRAO);

export function CategoriasProvider({ children }) {
  const [todas, setTodas] = useState([]);

  const recarregar = useCallback(() => {
    listarCategorias()
      .then(setTodas)
      .catch((e) => console.warn('Não foi possível carregar categorias:', e.message));
  }, []);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  const valor = useMemo(() => {
    const categorias = todas.filter((c) => c.ativo).map((c) => ({ valor: c.id, rotulo: c.rotulo }));
    const rotulo = Object.fromEntries(todas.map((c) => [c.id, c.rotulo]));
    return { categorias, rotulo, todas, recarregar };
  }, [todas, recarregar]);

  return <CategoriasContext.Provider value={valor}>{children}</CategoriasContext.Provider>;
}

export function useCategorias() {
  return useContext(CategoriasContext);
}
