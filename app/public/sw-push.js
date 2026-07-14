self.addEventListener('push', (event) => {
  if (!event.data) return;
  let dados;
  try {
    dados = event.data.json();
  } catch {
    dados = { titulo: 'SouTrilheiro', corpo: event.data.text() };
  }

  event.waitUntil(
    self.registration.showNotification(dados.titulo || 'SouTrilheiro', {
      body: dados.corpo,
      icon: '/icons/logo.jpeg',
      badge: '/icons/logo.jpeg',
      data: { url: dados.url || '/' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';

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
