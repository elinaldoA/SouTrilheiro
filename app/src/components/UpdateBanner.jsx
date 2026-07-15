import { useRegisterSW } from 'virtual:pwa-register/react';
import { version as versaoApp } from '../../package.json';

export default function UpdateBanner() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(erro) {
      console.error('Falha ao registrar service worker:', erro);
    },
  });

  if (!needRefresh) return null;

  return (
    <div className="update-banner" role="alert">
      <span>Nova versão do SouTrilheiro disponível (v{versaoApp}).</span>
      <div className="update-banner-actions">
        <button type="button" className="btn btn-primary btn-sm" onClick={() => updateServiceWorker(true)}>
          Atualizar agora
        </button>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => setNeedRefresh(false)}>
          Depois
        </button>
      </div>
    </div>
  );
}
