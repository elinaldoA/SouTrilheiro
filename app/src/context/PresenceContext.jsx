import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabaseClient';

const PresenceContext = createContext({ online: new Set() });

export function PresenceProvider({ children }) {
  const { usuario } = useAuth();
  const [online, setOnline] = useState(new Set());

  useEffect(() => {
    if (!usuario) {
      setOnline(new Set());
      return;
    }

    const canal = supabase.channel('presenca-global', {
      config: { presence: { key: usuario.id } },
    });

    canal.on('presence', { event: 'sync' }, () => {
      setOnline(new Set(Object.keys(canal.presenceState())));
    });

    canal.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await canal.track({ online_em: new Date().toISOString() });
      }
    });

    return () => {
      supabase.removeChannel(canal);
    };
  }, [usuario?.id]);

  return <PresenceContext.Provider value={{ online }}>{children}</PresenceContext.Provider>;
}

export function usePresenca() {
  return useContext(PresenceContext);
}
