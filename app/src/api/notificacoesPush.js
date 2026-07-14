import { supabase } from '../lib/supabaseClient';

/**
 * Pede para a Edge Function "enviar-push" notificar um usuário.
 * Falha silenciosamente (só loga) — nunca deve travar a ação principal do usuário
 * (aprovar trilha, comentar) por causa de um push que não foi.
 */
export async function notificar(usuarioId, titulo, corpo, url) {
  try {
    await supabase.functions.invoke('enviar-push', {
      body: { usuario_id: usuarioId, titulo, corpo, url },
    });
  } catch (e) {
    console.warn('Não foi possível enviar a notificação push:', e.message);
  }
}
