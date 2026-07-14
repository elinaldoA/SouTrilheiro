import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { listarComentarios, enviarComentario } from '../api/comentarios';
import { notificar } from '../api/notificacoesPush';
import BotaoDenunciar from './BotaoDenunciar';

const ROTULO_TIPO = { dica: 'Dica', condicao: 'Condição', alerta: 'Alerta' };
const COR_TIPO = { dica: 'var(--primary-soft)', condicao: 'var(--p1)', alerta: 'var(--p0)' };

function formatarData(iso) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export default function ComentariosTrilha({ trilhaId, trilhaNome, trilhaCriadoPor }) {
  const { usuario } = useAuth();
  const [comentarios, setComentarios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [tipo, setTipo] = useState('dica');
  const [kmReferencia, setKmReferencia] = useState('');
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    let cancelado = false;
    listarComentarios(trilhaId)
      .then((dados) => {
        if (!cancelado) setComentarios(dados);
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [trilhaId]);

  async function enviar(e) {
    e.preventDefault();
    if (!texto.trim()) {
      setErro('Escreva o comentário antes de enviar.');
      return;
    }
    setErro(null);
    setEnviando(true);
    try {
      const registro = await enviarComentario(trilhaId, usuario.id, {
        tipo,
        kmReferencia: kmReferencia ? Number(kmReferencia) : null,
        texto: texto.trim(),
      });
      setComentarios((atuais) => [registro, ...atuais]);
      setTexto('');
      setKmReferencia('');
      setTipo('dica');

      if (trilhaCriadoPor && trilhaCriadoPor !== usuario.id) {
        notificar(trilhaCriadoPor, 'Novo comentário', `${usuario.nome} comentou em "${trilhaNome}".`, `/trilha/${trilhaId}`);
      }
    } catch (e) {
      setErro(e.message ?? 'Não foi possível enviar o comentário.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <h2 style={{ fontSize: '1rem' }}>Comentários e alertas</h2>

      {usuario ? (
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
          <div style={{ display: 'flex', gap: 6 }}>
            {Object.entries(ROTULO_TIPO).map(([valor, rotulo]) => (
              <button
                key={valor}
                type="button"
                onClick={() => setTipo(valor)}
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: '0.72rem',
                  padding: '5px 11px',
                  borderRadius: 999,
                  border: `1px solid ${tipo === valor ? COR_TIPO[valor] : 'var(--line)'}`,
                  color: tipo === valor ? COR_TIPO[valor] : 'var(--muted)',
                  background: 'var(--bg)',
                }}
              >
                {rotulo}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="number"
              step="0.1"
              min="0"
              placeholder="km (opcional)"
              value={kmReferencia}
              onChange={(e) => setKmReferencia(e.target.value)}
              className="field"
              style={{ height: 38, fontSize: '0.85rem', flex: '0 1 140px', minWidth: 0 }}
            />
          </div>

          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={
              tipo === 'alerta'
                ? 'Ex: ponte quebrada, trilha alagada…'
                : tipo === 'condicao'
                  ? 'Ex: trilha em bom estado, sinalização apagada…'
                  : 'Ex: leve água extra, ponto de água no km 2…'
            }
            rows={2}
            className="field"
            style={{ fontSize: '0.88rem' }}
          />

          {erro && <p style={{ color: 'var(--p0)', fontSize: '0.82rem', margin: 0 }}>{erro}</p>}

          <button type="submit" className="btn btn-primary" disabled={enviando} style={{ flex: 'none' }}>
            {enviando ? 'Enviando…' : 'Publicar'}
          </button>
        </form>
      ) : (
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
          <Link to="/perfil">Entre</Link> para deixar um comentário ou alerta.
        </p>
      )}

      {carregando && <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Carregando comentários…</p>}
      {!carregando && comentarios.length === 0 && (
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
          Nenhum comentário ainda. Seja o primeiro a avisar como está a trilha.
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {comentarios.map((c) => (
          <div
            key={c.id}
            style={{
              border: '1px solid var(--line)',
              borderRadius: 10,
              padding: 10,
              background: 'var(--surface-raised)',
              fontSize: '0.86rem',
            }}
          >
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: '0.68rem',
                  textTransform: 'uppercase',
                  color: COR_TIPO[c.tipo],
                  border: `1px solid ${COR_TIPO[c.tipo]}`,
                  borderRadius: 999,
                  padding: '2px 8px',
                }}
              >
                {ROTULO_TIPO[c.tipo]}
              </span>
              {c.km_referencia != null && <span className="mini-badge">km {c.km_referencia}</span>}
              <span style={{ color: 'var(--muted)', fontSize: '0.76rem', marginLeft: 'auto' }}>
                {c.usuarios ? <Link to={`/usuario/${c.usuarios.id}`}>{c.usuarios.nome}</Link> : 'Trilheiro'} · {formatarData(c.criado_em)}
              </span>
            </div>
            <p style={{ margin: '6px 0 0' }}>{c.texto}</p>
            <div style={{ marginTop: 4 }}>
              <BotaoDenunciar tipoAlvo="comentario" alvoId={c.id} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
