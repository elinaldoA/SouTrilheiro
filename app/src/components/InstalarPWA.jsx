import { useEffect, useState } from 'react';
import { obterPromptInstalacao, ouvirPromptInstalacao, appJaInstalado } from '../lib/installPrompt';

export default function InstalarPWA() {
  const [prompt, setPrompt] = useState(obterPromptInstalacao);
  const [instalado, setInstalado] = useState(appJaInstalado);
  const [instalando, setInstalando] = useState(false);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    return ouvirPromptInstalacao(() => {
      setPrompt(obterPromptInstalacao());
      setInstalado(appJaInstalado());
    });
  }, []);

  if (instalado || !prompt) return null;

  async function instalar() {
    setErro(null);
    setInstalando(true);
    try {
      await prompt.prompt();
      const escolha = await prompt.userChoice;
      if (escolha.outcome === 'accepted') {
        setInstalado(true);
      }
      setPrompt(null);
    } catch (e) {
      setErro(e.message ?? 'Não foi possível instalar o app.');
    } finally {
      setInstalando(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <button type="button" className="btn btn-outline" onClick={instalar} disabled={instalando}>
        {instalando ? 'Aguarde…' : 'Instalar app'}
      </button>
      {erro && <p style={{ color: 'var(--p0)', fontSize: '0.8rem', margin: 0 }}>{erro}</p>}
    </div>
  );
}
