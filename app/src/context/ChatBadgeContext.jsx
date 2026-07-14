import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { contarNaoLidas, assinarTodasMensagens } from '../api/chat';
import { tocarSomMensagem } from '../lib/sound';

const ChatBadgeContext = createContext(null);

export function ChatBadgeProvider({ children }) {
  const { usuario } = useAuth();
  const [totalNaoLidas, setTotalNaoLidas] = useState(0);
  const conversaAbertaRef = useRef(null);

  const atualizar = useCallback(async () => {
    if (!usuario) {
      setTotalNaoLidas(0);
      return;
    }
    const linhas = await contarNaoLidas(usuario.id);
    setTotalNaoLidas(linhas.reduce((soma, r) => soma + Number(r.total), 0));
  }, [usuario]);

  useEffect(() => {
    atualizar();
  }, [atualizar]);

  useEffect(() => {
    if (!usuario) return;
    const desinscrever = assinarTodasMensagens(usuario.id, (mensagem) => {
      if (mensagem.usuario_id === usuario.id) return;
      if (mensagem.conversa_id === conversaAbertaRef.current) return;
      tocarSomMensagem();
      atualizar();
    });
    return desinscrever;
  }, [usuario, atualizar]);

  function definirConversaAberta(conversaId) {
    conversaAbertaRef.current = conversaId;
  }

  return (
    <ChatBadgeContext.Provider value={{ totalNaoLidas, atualizar, definirConversaAberta }}>
      {children}
    </ChatBadgeContext.Provider>
  );
}

export function useChatBadge() {
  return useContext(ChatBadgeContext);
}
