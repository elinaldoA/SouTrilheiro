import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { listarSeguidos } from '../api/seguidores';
import { buscarUltimaAtividadeEm } from '../api/feed';

const NotificacoesContext = createContext(null);

function chaveVisto(usuarioId) {
  return `soutrilheiro_feed_visto_${usuarioId}`;
}

export function NotificacoesProvider({ children }) {
  const { usuario } = useAuth();
  const [temAtividadeNova, setTemAtividadeNova] = useState(false);

  const verificar = useCallback(async () => {
    if (!usuario) {
      setTemAtividadeNova(false);
      return;
    }
    const seguidoIds = await listarSeguidos(usuario.id);
    const ultimaAtividade = await buscarUltimaAtividadeEm(seguidoIds);
    if (!ultimaAtividade) {
      setTemAtividadeNova(false);
      return;
    }
    const visto = localStorage.getItem(chaveVisto(usuario.id));
    setTemAtividadeNova(!visto || new Date(ultimaAtividade) > new Date(visto));
  }, [usuario]);

  useEffect(() => {
    verificar();
  }, [verificar]);

  function marcarVisto() {
    if (!usuario) return;
    localStorage.setItem(chaveVisto(usuario.id), new Date().toISOString());
    setTemAtividadeNova(false);
  }

  return (
    <NotificacoesContext.Provider value={{ temAtividadeNova, marcarVisto, verificar }}>
      {children}
    </NotificacoesContext.Provider>
  );
}

export function useNotificacoes() {
  return useContext(NotificacoesContext);
}
