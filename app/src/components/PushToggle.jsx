import { useEffect, useState } from 'react';
import { pushSuportado, pushEstaAtivo, ativarPush, desativarPush } from '../lib/push';
import { supabase } from '../lib/supabaseClient';

export default function PushToggle({ usuarioId }) {
  const [suportado, setSuportado] = useState(true);
  const [ativo, setAtivo] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [enviandoTeste, setEnviandoTeste] = useState(false);
  const [testeEnviado, setTesteEnviado] = useState(false);

  useEffect(() => {
    if (!pushSuportado()) {
      setSuportado(false);
      setCarregando(false);
      return;
    }
    pushEstaAtivo()
      .then(setAtivo)
      .finally(() => setCarregando(false));
  }, []);

  async function alternar() {
    setErro(null);
    setCarregando(true);
    try {
      if (ativo) {
        await desativarPush();
        setAtivo(false);
      } else {
        await ativarPush(usuarioId);
        setAtivo(true);
      }
    } catch (e) {
      setErro(e.message ?? 'Não foi possível alterar as notificações.');
    } finally {
      setCarregando(false);
    }
  }

  async function enviarTeste() {
    setErro(null);
    setTesteEnviado(false);
    setEnviandoTeste(true);
    try {
      const { error } = await supabase.functions.invoke('enviar-push', {
        body: { usuario_id: usuarioId, titulo: 'SouTrilheiro', corpo: 'Esta é uma notificação de teste.', url: '/perfil' },
      });
      if (error) throw error;
      setTesteEnviado(true);
    } catch (e) {
      setErro(e.message ?? 'Não foi possível enviar a notificação de teste.');
    } finally {
      setEnviandoTeste(false);
    }
  }

  if (!suportado) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <button type="button" className="btn btn-outline" onClick={alternar} disabled={carregando}>
        {carregando ? 'Aguarde…' : ativo ? 'Desativar notificações' : 'Ativar notificações'}
      </button>
      {ativo && (
        <button type="button" className="btn btn-outline" onClick={enviarTeste} disabled={enviandoTeste}>
          {enviandoTeste ? 'Aguarde…' : 'Enviar notificação teste'}
        </button>
      )}
      {testeEnviado && <p style={{ color: 'var(--accent)', fontSize: '0.8rem', margin: 0 }}>Notificação de teste enviada.</p>}
      {erro && <p style={{ color: 'var(--p0)', fontSize: '0.8rem', margin: 0 }}>{erro}</p>}
    </div>
  );
}
