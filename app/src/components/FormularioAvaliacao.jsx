import { useState } from 'react';
import { enviarAvaliacao } from '../api/avaliacoes';

export default function FormularioAvaliacao({ trilhaId, usuarioId, avaliacaoExistente, onSalvo }) {
  const [nota, setNota] = useState(avaliacaoExistente?.nota ?? 0);
  const [comentario, setComentario] = useState(avaliacaoExistente?.comentario ?? '');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);

  async function enviar(e) {
    e.preventDefault();
    if (nota === 0) {
      setErro('Escolha uma nota de 1 a 5 estrelas.');
      return;
    }
    setErro(null);
    setEnviando(true);
    try {
      const registro = await enviarAvaliacao(trilhaId, usuarioId, nota, comentario);
      onSalvo(registro);
    } catch (e) {
      setErro(e.message ?? 'Não foi possível enviar sua avaliação.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form
      onSubmit={enviar}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        border: '1px solid var(--line)',
        borderRadius: 10,
        padding: 12,
        background: 'var(--surface-raised)',
      }}
    >
      <span style={{ fontFamily: 'var(--mono)', fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--muted)' }}>
        {avaliacaoExistente ? 'Editar sua avaliação' : 'Avaliar esta trilha'}
      </span>

      <div style={{ display: 'flex', gap: 4 }}>
        {[1, 2, 3, 4, 5].map((valor) => (
          <button
            key={valor}
            type="button"
            onClick={() => setNota(valor)}
            aria-label={`${valor} estrela${valor > 1 ? 's' : ''}`}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.3rem',
              lineHeight: 1,
              color: valor <= nota ? 'var(--accent)' : 'var(--line)',
              padding: 0,
            }}
          >
            ★
          </button>
        ))}
      </div>

      <textarea
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
        placeholder="Conte como foi a trilha (opcional)"
        rows={3}
        className="field"
        style={{ fontSize: '0.88rem' }}
      />

      {erro && <p style={{ color: 'var(--p0)', fontSize: '0.82rem', margin: 0 }}>{erro}</p>}

      <button type="submit" className="btn btn-primary" disabled={enviando} style={{ flex: 'none' }}>
        {enviando ? 'Enviando…' : avaliacaoExistente ? 'Atualizar avaliação' : 'Enviar avaliação'}
      </button>
    </form>
  );
}
