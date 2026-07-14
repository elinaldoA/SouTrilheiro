import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { listarSaidasDaTrilha, criarSaida, inscreverNaSaida, cancelarInscricao } from '../api/saidas';

function formatarDataHora(iso) {
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function NovaSaidaForm({ guiaId, trilhaId, onCriada }) {
  const [dataHora, setDataHora] = useState('');
  const [vagasTotal, setVagasTotal] = useState('10');
  const [preco, setPreco] = useState('');
  const [pontoEncontro, setPontoEncontro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);
  const [aberto, setAberto] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      const nova = await criarSaida(guiaId, trilhaId, {
        dataHora: new Date(dataHora).toISOString(),
        vagasTotal: Number(vagasTotal),
        preco: preco ? Number(preco) : null,
        pontoEncontro,
      });
      onCriada({ ...nova, vagasOcupadas: 0, guias: null });
      setAberto(false);
      setDataHora('');
      setPontoEncontro('');
    } catch (e) {
      setErro(e.message ?? 'Não foi possível criar a saída.');
    } finally {
      setEnviando(false);
    }
  }

  if (!aberto) {
    return (
      <button type="button" className="btn btn-outline" onClick={() => setAberto(true)}>
        + Agendar saída em grupo
      </button>
    );
  }

  return (
    <form onSubmit={enviar} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <input
        type="datetime-local"
        value={dataHora}
        onChange={(e) => setDataHora(e.target.value)}
        required
        className="field"
      />
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="number"
          min="1"
          placeholder="Vagas"
          value={vagasTotal}
          onChange={(e) => setVagasTotal(e.target.value)}
          required
          className="field"
          style={{ flex: 1, minWidth: 0 }}
        />
        <input
          type="number"
          step="0.01"
          min="0"
          placeholder="Preço por pessoa (opcional)"
          value={preco}
          onChange={(e) => setPreco(e.target.value)}
          className="field"
          style={{ flex: 1, minWidth: 0 }}
        />
      </div>
      <input
        type="text"
        placeholder="Ponto de encontro (opcional)"
        value={pontoEncontro}
        onChange={(e) => setPontoEncontro(e.target.value)}
        className="field"
      />
      {erro && <p style={{ color: 'var(--p0)', fontSize: '0.85rem', margin: 0 }}>{erro}</p>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" className="btn btn-outline" onClick={() => setAberto(false)} disabled={enviando}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-primary" disabled={enviando}>
          {enviando ? 'Agendando…' : 'Agendar'}
        </button>
      </div>
    </form>
  );
}

function SaidaItem({ saida, usuario, onAtualizar }) {
  const [inscrevendo, setInscrevendo] = useState(false);
  const vagasRestantes = saida.vagas_total - saida.vagasOcupadas;
  const lotada = vagasRestantes <= 0;
  const guiaNome = saida.guias?.usuarios?.nome ?? '—';

  async function aoInscrever() {
    if (!usuario) return;
    setInscrevendo(true);
    try {
      await inscreverNaSaida(saida.id, usuario.id);
      onAtualizar({ ...saida, vagasOcupadas: saida.vagasOcupadas + 1, inscrito: true });
    } finally {
      setInscrevendo(false);
    }
  }

  async function aoCancelar() {
    if (!usuario) return;
    setInscrevendo(true);
    try {
      await cancelarInscricao(saida.id, usuario.id);
      onAtualizar({ ...saida, vagasOcupadas: Math.max(0, saida.vagasOcupadas - 1), inscrito: false });
    } finally {
      setInscrevendo(false);
    }
  }

  return (
    <div
      style={{
        border: '1px solid var(--line)',
        borderRadius: 10,
        padding: 10,
        background: 'var(--surface-raised)',
        fontSize: '0.86rem',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <strong>{formatarDataHora(saida.data_hora)}</strong>
      <span style={{ color: 'var(--muted)' }}>guia: {guiaNome}</span>
      {saida.ponto_encontro && <span style={{ color: 'var(--muted)' }}>encontro: {saida.ponto_encontro}</span>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <span className="mini-badge">{lotada ? 'Lotada' : `${vagasRestantes} vaga(s)`}</span>
        {saida.preco != null && <span className="mini-badge">R$ {Number(saida.preco).toFixed(2)}</span>}
      </div>
      {usuario ? (
        saida.inscrito ? (
          <button type="button" className="btn btn-outline" onClick={aoCancelar} disabled={inscrevendo}>
            {inscrevendo ? 'Cancelando…' : 'Cancelar inscrição'}
          </button>
        ) : (
          <button type="button" className="btn btn-primary" onClick={aoInscrever} disabled={inscrevendo || lotada}>
            {inscrevendo ? 'Inscrevendo…' : 'Participar'}
          </button>
        )
      ) : (
        <span style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>
          <Link to="/perfil">Entre</Link> para participar.
        </span>
      )}
    </div>
  );
}

export default function SaidasGuiadas({ trilhaId }) {
  const { usuario, guia, ehGuiaAprovado } = useAuth();
  const [saidas, setSaidas] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let cancelado = false;
    listarSaidasDaTrilha(trilhaId, usuario?.id)
      .then((dados) => {
        if (!cancelado) setSaidas(dados);
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [trilhaId, usuario]);

  function aoAtualizarSaida(atualizada) {
    setSaidas((atuais) => atuais.map((s) => (s.id === atualizada.id ? atualizada : s)));
  }

  if (carregando) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <h2 style={{ fontSize: '1rem' }}>Saídas em grupo com guia</h2>

      {saidas.length === 0 && (
        <p style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>Nenhuma saída agendada para esta trilha.</p>
      )}

      {saidas.map((s) => (
        <SaidaItem key={s.id} saida={s} usuario={usuario} onAtualizar={aoAtualizarSaida} />
      ))}

      {ehGuiaAprovado && (
        <NovaSaidaForm guiaId={guia.id} trilhaId={trilhaId} onCriada={(s) => setSaidas((atuais) => [...atuais, s])} />
      )}
    </div>
  );
}
