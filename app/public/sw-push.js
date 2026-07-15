self.addEventListener('push', (event) => {
  if (!event.data) return;
  let dados;
  try {
    dados = event.data.json();
  } catch {
    dados = { titulo: 'SouTrilheiro', corpo: event.data.text() };
  }

  const base = self.registration.scope;
  const destino = new URL((dados.url || '/').replace(/^\//, ''), base).href;

  event.waitUntil(
    self.registration.showNotification(dados.titulo || 'SouTrilheiro', {
      body: dados.corpo,
      icon: `${base}icons/logo.jpeg`,
      badge: `${base}icons/logo.jpeg`,
      data: { url: destino },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || self.registration.scope;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((janelas) => {
      for (const janela of janelas) {
        if (janela.url.includes(self.location.origin) && 'focus' in janela) {
          janela.navigate(url);
          return janela.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
