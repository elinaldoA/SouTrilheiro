// Edge Function: enviar-push
// Recebe { usuario_id, titulo, corpo, url } e manda um Web Push para cada dispositivo
// inscrito desse usuário (tabela push_inscricoes). Remove inscrições expiradas (410/404).
//
// Como publicar: veja README.md na raiz do projeto, seção "Notificações push".

import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!;
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:contato@soutrilheiro.app';

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const jwt = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
    if (!jwt) {
      return new Response(JSON.stringify({ error: 'Autenticação obrigatória' }), {
        status: 401,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const { data: authData, error: authError } = await supabase.auth.getUser(jwt);
    if (authError || !authData.user) {
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 401,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // Só exige que o chamador seja um usuário autenticado e conhecido — não que
    // usuario_id seja ele mesmo. A função é usada para notificar OUTRAS pessoas
    // (marcação, menção, comentário em trilha/foto/vídeo de terceiros), então
    // restringir a "só para si mesmo ou admin" quebraria esses fluxos legítimos.
    // O que essa checagem impede é a chamada anônima (sem JWT válido).
    const { data: chamador, error: erroChamador } = await supabase
      .from('usuarios')
      .select('id')
      .eq('auth_user_id', authData.user.id)
      .single();
    if (erroChamador || !chamador) {
      return new Response(JSON.stringify({ error: 'Usuário não encontrado' }), {
        status: 403,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const { usuario_id, titulo, corpo, url } = await req.json();
    if (!usuario_id || !titulo) {
      return new Response(JSON.stringify({ error: 'usuario_id e titulo são obrigatórios' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const { data: inscricoes, error } = await supabase
      .from('push_inscricoes')
      .select('id, endpoint, p256dh, auth')
      .eq('usuario_id', usuario_id);

    if (error) throw error;

    const payload = JSON.stringify({ titulo, corpo, url });

    await Promise.all(
      (inscricoes ?? []).map(async (inscricao) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: inscricao.endpoint,
              keys: { p256dh: inscricao.p256dh, auth: inscricao.auth },
            },
            payload
          );
        } catch (e) {
          if (e.statusCode === 404 || e.statusCode === 410) {
            await supabase.from('push_inscricoes').delete().eq('id', inscricao.id);
          }
        }
      })
    );

    return new Response(JSON.stringify({ enviados: inscricoes?.length ?? 0 }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
});
