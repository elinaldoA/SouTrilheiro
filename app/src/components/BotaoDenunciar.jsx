import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { criarDenuncia } from '../api/moderacao';

export default function BotaoDenunciar({ tipoAlvo, alvoId }) {
  const { usuario } = useAuth();
  const [aberto, setAberto] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState('');

  if (!usuario) return null;
  if (enviado) {
    return <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>Denúncia enviada</span>;
  }

  async function enviar() {
    if (!motivo.trim()) return;
    setEnviando(true);
    setErro('');
    try {
      await criarDenuncia(usuario.id, tipoAlvo, alvoId, motivo.trim());
      setEnviado(true);
    } catch (e) {
      setErro(e.message ?? 'Não foi possível enviar a denúncia.');
    } finally {
      setEnviando(false);
    }
  }

  if (!aberto) {
    return (
      <button type="button" className="btn-link" onClick={() => setAberto(true)} style={{ textDecoration: 'none', fontSize: '0.72rem' }}>
        Denunciar
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
      <input
        className="field"
        value={motivo}
        onChange={(e) => setMotivo(e.target.value)}
        placeholder="Motivo da denúncia"
        style={{ height: 28, fontSize: '0.75rem', borderRadius: 6, padding: '0 8px', flex: '1 1 120px', minWidth: 0 }}
      />
      <button
        type="button"
        className="btn-link"
        onClick={enviar}
        disabled={enviando}
        style={{ textDecoration: 'none', fontSize: '0.72rem', color: 'var(--p0)', flex: 'none' }}
      >
        Enviar
      </button>
      {erro && <span style={{ fontSize: '0.72rem', color: 'var(--p0)', flexBasis: '100%' }}>{erro}</span>}
    </div>
  );
}
