import { useState } from 'react';
import { CATEGORIAS_TRILHA } from '../lib/categorias';

export default function EditarTrilhaForm({ trilha, onCancelar, onSalvar }) {
  const [nome, setNome] = useState(trilha.nome);
  const [cidade, setCidade] = useState(trilha.cidade);
  const [estado, setEstado] = useState(trilha.estado);
  const [distanciaKm, setDistanciaKm] = useState(trilha.distancia_km);
  const [elevacaoM, setElevacaoM] = useState(trilha.elevacao_m);
  const [tempoEstimadoMin, setTempoEstimadoMin] = useState(trilha.tempo_estimado_min);
  const [dificuldade, setDificuldade] = useState(trilha.dificuldade);
  const [categoria, setCategoria] = useState(trilha.categoria ?? 'mata');
  const [tipoPreco, setTipoPreco] = useState(trilha.tipo_preco ?? 'gratuita');
  const [preco, setPreco] = useState(trilha.preco ?? '');
  const [foto, setFoto] = useState(null);
  const [video, setVideo] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);

  async function aoSalvar(e) {
    e.preventDefault();
    setErro(null);
    setSalvando(true);
    try {
      await onSalvar(
        {
          nome,
          cidade,
          estado,
          distanciaKm: Number(distanciaKm),
          elevacaoM: Number(elevacaoM),
          tempoEstimadoMin: Number(tempoEstimadoMin),
          dificuldade,
          categoria,
          tipoPreco,
          preco: tipoPreco === 'paga' ? Number(preco) : null,
        },
        foto,
        video
      );
    } catch (e) {
      setErro(e.message ?? 'Não foi possível salvar as alterações.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={aoSalvar} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} required className="field" placeholder="Nome" />
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={cidade}
          onChange={(e) => setCidade(e.target.value)}
          required
          className="field"
          placeholder="Cidade"
          style={{ flex: 1, minWidth: 0 }}
        />
        <input
          type="text"
          value={estado}
          onChange={(e) => setEstado(e.target.value.slice(0, 2))}
          required
          className="field"
          placeholder="UF"
          style={{ width: 70, flex: 'none', textTransform: 'uppercase' }}
        />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="number"
          step="0.1"
          min="0"
          value={distanciaKm}
          onChange={(e) => setDistanciaKm(e.target.value)}
          required
          className="field"
          placeholder="Distância (km)"
          style={{ flex: 1, minWidth: 0 }}
        />
        <input
          type="number"
          min="0"
          value={elevacaoM}
          onChange={(e) => setElevacaoM(e.target.value)}
          required
          className="field"
          placeholder="Elevação (m)"
          style={{ flex: 1, minWidth: 0 }}
        />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="number"
          min="0"
          value={tempoEstimadoMin}
          onChange={(e) => setTempoEstimadoMin(e.target.value)}
          required
          className="field"
          placeholder="Tempo estimado (min)"
          style={{ flex: 1, minWidth: 0 }}
        />
        <select value={dificuldade} onChange={(e) => setDificuldade(e.target.value)} className="field" style={{ flex: 1, minWidth: 0 }}>
          <option value="facil">Fácil</option>
          <option value="moderada">Moderada</option>
          <option value="dificil">Difícil</option>
        </select>
      </div>

      <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="field">
        {CATEGORIAS_TRILHA.map((c) => (
          <option key={c.valor} value={c.valor}>
            {c.rotulo}
          </option>
        ))}
      </select>

      <div style={{ display: 'flex', gap: 8 }}>
        <select value={tipoPreco} onChange={(e) => setTipoPreco(e.target.value)} className="field" style={{ flex: 1, minWidth: 0 }}>
          <option value="gratuita">Gratuita</option>
          <option value="paga">Paga</option>
        </select>
        {tipoPreco === 'paga' && (
          <input
            type="number"
            step="0.01"
            min="0.01"
            placeholder="Preço (R$)"
            value={preco}
            onChange={(e) => setPreco(e.target.value)}
            required
            className="field"
            style={{ flex: 1, minWidth: 0 }}
          />
        )}
      </div>

      {trilha.fotoUrl && !foto && (
        <img
          src={trilha.fotoUrl}
          alt={`Foto atual de ${trilha.nome}`}
          style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--line)' }}
        />
      )}
      <div>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFoto(e.target.files?.[0] ?? null)}
          style={{ display: 'none' }}
          id={`input-foto-editar-${trilha.id}`}
        />
        <label htmlFor={`input-foto-editar-${trilha.id}`} className="btn btn-outline" style={{ display: 'inline-flex', cursor: 'pointer' }}>
          {foto ? `Nova foto: ${foto.name}` : trilha.fotoUrl ? 'Trocar foto' : 'Escolher foto'}
        </label>
      </div>

      <div>
        <input
          type="file"
          accept="video/*"
          onChange={(e) => setVideo(e.target.files?.[0] ?? null)}
          style={{ display: 'none' }}
          id={`input-video-editar-${trilha.id}`}
        />
        <label htmlFor={`input-video-editar-${trilha.id}`} className="btn btn-outline" style={{ display: 'inline-flex', cursor: 'pointer' }}>
          {video ? `Novo vídeo: ${video.name}` : 'Adicionar vídeo'}
        </label>
      </div>

      {erro && <p style={{ color: 'var(--p0)', fontSize: '0.85rem', margin: 0 }}>{erro}</p>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" className="btn btn-outline" onClick={onCancelar} disabled={salvando}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-primary" disabled={salvando}>
          {salvando ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
    </form>
  );
}
