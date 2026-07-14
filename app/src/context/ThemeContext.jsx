import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);
const CHAVE = 'soutrilheiro_tema';

function temaInicial() {
  const salvo = localStorage.getItem(CHAVE);
  if (salvo === 'light' || salvo === 'dark') return salvo;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }) {
  const [tema, setTema] = useState(temaInicial);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tema);
    localStorage.setItem(CHAVE, tema);
  }, [tema]);

  function alternar() {
    setTema((atual) => (atual === 'dark' ? 'light' : 'dark'));
  }

  return <ThemeContext.Provider value={{ tema, alternar }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
