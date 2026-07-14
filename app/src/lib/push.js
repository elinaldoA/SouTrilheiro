import { supabase } from './supabaseClient';

function base64ParaUint8Array(base64) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const base64Seguro = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const bruto = atob(base64Seguro);
  return Uint8Array.from([...bruto].map((c) => c.charCodeAt(0)));
}

export function pushSuportado() {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

export async function statusPermissao() {
  if (!pushSuportado()) return 'indisponivel';
  return Notification.permission; // 'default' | 'granted' | 'denied'
}

export async function ativarPush(usuarioId) {
  const permissao = await Notification.requestPermission();
  if (permissao !== 'granted') throw new Error('Permissão de notificação negada.');

  const registro = await navigator.serviceWorker.ready;
  const inscricao = await registro.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: base64ParaUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY),
  });

  const json = inscricao.toJSON();
  const { error } = await supabase.from('push_inscricoes').upsert(
    {
      usuario_id: usuarioId,
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
    },
    { onConflict: 'endpoint' }
  );
  if (error) throw error;
}

export async function desativarPush() {
  if (!pushSuportado()) return;
  const registro = await navigator.serviceWorker.ready;
  const inscricao = await registro.pushManager.getSubscription();
  if (!inscricao) return;

  await supabase.from('push_inscricoes').delete().eq('endpoint', inscricao.endpoint);
  await inscricao.unsubscribe();
}

export async function pushEstaAtivo() {
  if (!pushSuportado()) return false;
  const registro = await navigator.serviceWorker.ready;
  const inscricao = await registro.pushManager.getSubscription();
  return Boolean(inscricao);
}
