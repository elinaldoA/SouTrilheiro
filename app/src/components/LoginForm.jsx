import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginForm() {
  const { entrar, cadastrar, recuperarSenha, reenviarConfirmacao } = useAuth();
  const navigate = useNavigate();
  const [modo, setModo] = useState('entrar'); // entrar | cadastrar
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [queroSerGuia, setQueroSerGuia] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState(null);
  const [erro, setErro] = useState(null);
  const [emailNaoConfirmado, setEmailNaoConfirmado] = useState(false);
  const [reenviando, setReenviando] = useState(false);

  async function aoEnviar(e) {
    e.preventDefault();
    setErro(null);
    setMensagem(null);
    setEmailNaoConfirmado(false);
    setEnviando(true);
    try {
      if (modo === 'entrar') {
        await entrar(email, senha);
        navigate('/', { replace: true });
      } else {
        await cadastrar(email, senha, nome, queroSerGuia);
        setMensagem(
          queroSerGuia
            ? 'Conta criada! Verifique seu e-mail para confirmar o cadastro. Seu pedido para ser guia fica pendente de aprovação.'
            : 'Conta criada! Verifique seu e-mail para confirmar o cadastro antes de entrar.'
        );
      }
    } catch (e) {
      if (modo === 'entrar' && /email.*not.*confirmed/i.test(e.message ?? '')) {
        setEmailNaoConfirmado(true);
        setErro('Você ainda não confirmou seu e-mail.');
      } else {
        setErro(e.message ?? 'Não foi possível concluir. Tente novamente.');
      }
    } finally {
      setEnviando(false);
    }
  }

  async function aoReenviarConfirmacao() {
    if (!email) {
      setErro('Digite seu e-mail acima para reenviar a confirmação.');
      return;
    }
    setErro(null);
    setMensagem(null);
    setReenviando(true);
    try {
      await reenviarConfirmacao(email);
      setMensagem('Reenviamos o e-mail de confirmação.');
      setEmailNaoConfirmado(false);
    } catch (e) {
      setErro(e.message ?? 'Não foi possível reenviar a confirmação.');
    } finally {
      setReenviando(false);
    }
  }

  async function aoRecuperarSenha() {
    if (!email) {
      setErro('Digite seu e-mail acima para receber o link de recuperação.');
      return;
    }
    setErro(null);
    setMensagem(null);
    try {
      await recuperarSenha(email);
      setMensagem('Enviamos um link de recuperação para o seu e-mail.');
    } catch (e) {
      setErro(e.message ?? 'Não foi possível enviar o link de recuperação.');
    }
  }

  return (
    <form onSubmit={aoEnviar} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {modo === 'cadastrar' && (
        <>
          <input
            type="text"
            placeholder="Seu nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            className="field"
          />
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              onClick={() => setQueroSerGuia(false)}
              className={!queroSerGuia ? 'btn btn-primary' : 'btn btn-outline'}
              style={{ flex: 1 }}
            >
              Trilheiro
            </button>
            <button
              type="button"
              onClick={() => setQueroSerGuia(true)}
              className={queroSerGuia ? 'btn btn-primary' : 'btn btn-outline'}
              style={{ flex: 1 }}
            >
              Quero ser guia
            </button>
          </div>
          {queroSerGuia && (
            <p style={{ color: 'var(--muted)', fontSize: '0.78rem', margin: 0 }}>
              Seu cadastro de guia fica pendente até um admin aprovar.
            </p>
          )}
        </>
      )}
      <input
        type="email"
        placeholder="E-mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="field"
      />
      <input
        type="password"
        placeholder="Senha"
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
        required
        minLength={6}
        className="field"
      />

      {erro && <p style={{ color: 'var(--p0)', fontSize: '0.85rem', margin: 0 }}>{erro}</p>}
      {mensagem && <p style={{ color: 'var(--good)', fontSize: '0.85rem', margin: 0 }}>{mensagem}</p>}
      {emailNaoConfirmado && (
        <button
          type="button"
          onClick={aoReenviarConfirmacao}
          disabled={reenviando}
          className="btn-link"
          style={{ textAlign: 'center' }}
        >
          {reenviando ? 'Reenviando…' : 'Reenviar e-mail de confirmação'}
        </button>
      )}

      <button type="submit" className="btn btn-primary" disabled={enviando}>
        {enviando ? 'Enviando…' : modo === 'entrar' ? 'Entrar' : 'Criar conta'}
      </button>

      {modo === 'entrar' && (
        <button
          type="button"
          onClick={aoRecuperarSenha}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--muted)',
            fontSize: '0.82rem',
            textAlign: 'center',
          }}
        >
          Esqueci minha senha
        </button>
      )}

      <button
        type="button"
        onClick={() => setModo(modo === 'entrar' ? 'cadastrar' : 'entrar')}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--primary-soft)',
          fontSize: '0.85rem',
          textAlign: 'center',
          fontWeight: 600,
        }}
      >
        {modo === 'entrar' ? 'Não tem conta? Criar conta' : 'Já tem conta? Entrar'}
      </button>
    </form>
  );
}
