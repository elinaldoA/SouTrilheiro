import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { meuPerfilGuia, solicitarSerGuia } from '../api/guias';

const AuthContext = createContext(null);

// A autorização real é imposta pelo trigger de banco (protege_campos_sensiveis_usuarios,
// veja database/migration_correcoes_seguranca.sql); esta lista é só defesa em profundidade
// no client para evitar enviar campos além do que a tela de perfil deveria editar.
const CAMPOS_PERFIL_EDITAVEIS = ['nome', 'avatar_url'];

async function garantirUsuario(authUser) {
  const { data: existente } = await supabase
    .from('usuarios')
    .select('*')
    .eq('auth_user_id', authUser.id)
    .maybeSingle();

  if (existente) return existente;

  const nomeInicial = authUser.user_metadata?.nome || authUser.email.split('@')[0];
  const { data: criado, error } = await supabase
    .from('usuarios')
    .insert({ auth_user_id: authUser.id, nome: nomeInicial })
    .select()
    .single();

  if (error) throw error;

  if (authUser.user_metadata?.quer_ser_guia) {
    await solicitarSerGuia(criado.id, null).catch((e) => {
      console.warn('Não foi possível registrar o pedido de guia feito no cadastro:', e.message);
    });
  }

  return criado;
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [guia, setGuia] = useState(null);
  const [recuperandoSenha, setRecuperandoSenha] = useState(false);

  useEffect(() => {
    let cancelado = false;

    supabase.auth.getSession().then(({ data }) => {
      if (cancelado) return;
      setSession(data.session);
      if (!data.session) setCarregando(false);
    });

    const { data: assinatura } = supabase.auth.onAuthStateChange((evento, novaSessao) => {
      if (evento === 'PASSWORD_RECOVERY') setRecuperandoSenha(true);
      setSession(novaSessao);
      if (!novaSessao) setCarregando(false);
    });

    return () => {
      cancelado = true;
      assinatura.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session?.user) {
      setUsuario(null);
      return;
    }
    let cancelado = false;
    setCarregando(true);
    garantirUsuario(session.user)
      .then((u) => {
        if (!cancelado) setUsuario(u);
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [session?.user?.id]);

  useEffect(() => {
    if (!usuario) {
      setGuia(null);
      return;
    }
    let cancelado = false;
    meuPerfilGuia(usuario.id)
      .then((g) => {
        if (!cancelado) setGuia(g);
      })
      .catch(() => {
        if (!cancelado) setGuia(null);
      });
    return () => {
      cancelado = true;
    };
  }, [usuario?.id]);

  useEffect(() => {
    if (!usuario) return;
    const canal = supabase
      .channel(`guia-status:${usuario.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'guias', filter: `usuario_id=eq.${usuario.id}` },
        () => {
          meuPerfilGuia(usuario.id).then(setGuia);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [usuario?.id]);

  const recarregarGuia = useCallback(async () => {
    if (!usuario) return;
    const g = await meuPerfilGuia(usuario.id);
    setGuia(g);
  }, [usuario]);

  const cadastrar = useCallback(async (email, senha, nome, queroSerGuia) => {
    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: { nome, quer_ser_guia: !!queroSerGuia },
        emailRedirectTo: `${window.location.origin}/perfil`,
      },
    });
    if (error) throw error;
  }, []);

  const entrar = useCallback(async (email, senha) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) throw error;
  }, []);

  const reenviarConfirmacao = useCallback(async (email) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${window.location.origin}/perfil` },
    });
    if (error) throw error;
  }, []);

  const sair = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const recuperarSenha = useCallback(async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/perfil`,
    });
    if (error) throw error;
  }, []);

  const definirNovaSenha = useCallback(async (novaSenha) => {
    const { error } = await supabase.auth.updateUser({ password: novaSenha });
    if (error) throw error;
    setRecuperandoSenha(false);
  }, []);

  const atualizarPerfil = useCallback(
    async (campos) => {
      if (!usuario) return;
      const camposPermitidos = Object.fromEntries(
        Object.entries(campos).filter(([chave]) => CAMPOS_PERFIL_EDITAVEIS.includes(chave))
      );
      const { data, error } = await supabase
        .from('usuarios')
        .update(camposPermitidos)
        .eq('id', usuario.id)
        .select()
        .single();
      if (error) throw error;
      setUsuario(data);
    },
    [usuario]
  );

  return (
    <AuthContext.Provider
      value={{
        session,
        usuario,
        carregando,
        autenticado: !!session?.user,
        cadastrar,
        entrar,
        sair,
        reenviarConfirmacao,
        recuperarSenha,
        definirNovaSenha,
        recuperandoSenha,
        atualizarPerfil,
        guia,
        recarregarGuia,
        ehAdmin: !!usuario?.is_admin,
        ehGuiaAprovado: !!guia?.aprovado,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
