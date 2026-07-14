import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function RedefinirSenhaForm() {
  const { definirNovaSenha } = useAuth();
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);
  const [concluido, setConcluido] = useState(false);

  async function aoEnviar(e) {
    e.preventDefault();
    setErro(null);
    if (senha !== confirmarSenha) {
      setErro('As senhas não coincidem.');
      return;
    }
    setEnviando(true);
    try {
      await definirNovaSenha(senha);
      setConcluido(true);
    } catch (e) {
      setErro(e.message ?? 'Não foi possível atualizar a senha.');
    } finally {
      setEnviando(false);
    }
  }

  if (concluido) {
    return <p style={{ color: 'var(--good)', fontSize: '0.9rem' }}>Senha atualizada! Você já pode continuar usando o app.</p>;
  }

  return (
    <form onSubmit={aoEnviar} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: 0 }}>
        Defina uma nova senha para sua conta.
      </p>
      <input
        type="password"
        placeholder="Nova senha"
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
        required
        minLength={6}
        className="field"
      />
      <input
        type="password"
        placeholder="Confirmar nova senha"
        value={confirmarSenha}
        onChange={(e) => setConfirmarSenha(e.target.value)}
        required
        minLength={6}
        className="field"
      />
      {erro && <p style={{ color: 'var(--p0)', fontSize: '0.85rem', margin: 0 }}>{erro}</p>}
      <button type="submit" className="btn btn-primary" disabled={enviando}>
        {enviando ? 'Salvando…' : 'Salvar nova senha'}
      </button>
    </form>
  );
}
