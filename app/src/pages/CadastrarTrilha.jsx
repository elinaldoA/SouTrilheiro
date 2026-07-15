import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { cadastrarTrilha } from '../api/trilhas';
import { enviarFoto } from '../api/fotos';
import { enviarVideo } from '../api/videos';
import { paraNumero, sanitizarDecimal, sanitizarTempo, paraMinutos, formatarHorasMinutos } from '../lib/numero';
import { CATEGORIAS_TRILHA } from '../lib/categorias';
import TracadoEditor from '../components/TracadoEditor';

export default function CadastrarTrilha() {
  const { usuario, ehAdmin, ehGuiaAprovado } = useAuth();
  const navigate = useNavigate();

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [distanciaKm, setDistanciaKm] = useState('');
  const [elevacaoM, setElevacaoM] = useState('');
  const [tempoEstimado, setTempoEstimado] = useState('');
  const [unidadeTempo, setUnidadeTempo] = useState('min');
  const [dificuldade, setDificuldade] = useState('facil');
  const [categoria, setCategoria] = useState('mata');
  const [tipoPreco, setTipoPreco] = useState('gratuita');
  const [preco, setPreco] = useState('');
  const [foto, setFoto] = useState(null);
  const [video, setVideo] = useState(null);
  const [localizacao, setLocalizacao] = useState(null);
  const [pathGravado, setPathGravado] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);

  if (!usuario) {
    return (
      <p className="state-message">
        <Link to="/perfil">Entre</Link> para cadastrar uma trilha nova.
      </p>
    );
  }

  if (!ehAdmin && !ehGuiaAprovado) {
    return <p className="state-message">Somente administradores e guias aprovados podem cadastrar trilhas.</p>;
  }

  function alternarUnidadeTempo(novaUnidade) {
    if (novaUnidade === unidadeTempo) return;
    const totalMinutos = paraMinutos(tempoEstimado, unidadeTempo);
    if (!Number.isNaN(totalMinutos)) {
      setTempoEstimado(novaUnidade === 'h' ? formatarHorasMinutos(totalMinutos) : String(Math.round(totalMinutos)));
    }
    setUnidadeTempo(novaUnidade);
  }

  async function enviar(e) {
    e.preventDefault();
    if (!localizacao) {
      setErro('Marque a localização do início da trilha antes de enviar.');
      return;
    }
    if (tipoPreco === 'paga' && !(Number(preco) > 0)) {
      setErro('Informe o preço da trilha paga.');
      return;
    }
    const distanciaKmNum = paraNumero(distanciaKm);
    const tempoEstimadoMinFinal = Math.round(paraMinutos(tempoEstimado, unidadeTempo));
    if (Number.isNaN(distanciaKmNum)) {
      setErro('Informe uma distância válida.');
      return;
    }
    if (Number.isNaN(tempoEstimadoMinFinal)) {
      setErro('Informe um tempo estimado válido.');
      return;
    }
    setErro(null);
    setEnviando(true);
    try {
      const pathGeojson =
        pathGravado.length > 1
          ? pathGravado
          : [
              [localizacao.lat, localizacao.lng],
              [localizacao.lat + 0.0008, localizacao.lng + 0.0008],
            ];
      const nova = await cadastrarTrilha(usuario.id, {
        nome,
        descricao,
        cidade,
        estado,
        distanciaKm: distanciaKmNum,
        elevacaoM: Number(elevacaoM),
        tempoEstimadoMin: tempoEstimadoMinFinal,
        dificuldade,
        categoria,
        tipoPreco,
        preco: tipoPreco === 'paga' ? Number(preco) : null,
        lat: localizacao.lat,
        lng: localizacao.lng,
        pathGeojson,
        publicarDireto: ehGuiaAprovado,
      });
      if (foto) {
        await enviarFoto(nova.id, usuario.id, foto);
      }
      if (video) {
        await enviarVideo(nova.id, usuario.id, video);
      }
      navigate(`/trilha/${nova.id}`);
    } catch (e) {
      setErro(e.message ?? 'Não foi possível cadastrar a trilha.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <h1 style={{ fontSize: '1.2rem' }}>Cadastrar trilha</h1>
      <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginTop: -10 }}>
        {ehGuiaAprovado
          ? 'Como guia aprovado, sua trilha é publicada direto — sem esperar revisão.'
          : 'Sua trilha entra como pendente de revisão e aparece na busca assim que for aprovada.'}
      </p>

      <form onSubmit={enviar} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input type="text" placeholder="Nome da trilha" value={nome} onChange={(e) => setNome(e.target.value)} required className="field" />

        <textarea
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Descrição (opcional)"
          rows={3}
          className="field"
        />

        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            placeholder="Cidade"
            value={cidade}
            onChange={(e) => setCidade(e.target.value)}
            required
            className="field"
            style={{ flex: 1, minWidth: 0 }}
          />
          <input
            type="text"
            placeholder="UF"
            value={estado}
            onChange={(e) => setEstado(e.target.value.slice(0, 2))}
            required
            className="field"
            style={{ width: 70, flex: 'none', textTransform: 'uppercase' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            inputMode="decimal"
            placeholder="Distância (km)"
            value={distanciaKm}
            onChange={(e) => setDistanciaKm(sanitizarDecimal(e.target.value))}
            required
            className="field"
            style={{ flex: 1, minWidth: 0 }}
          />
          <input
            type="number"
            min="0"
            placeholder="Elevação (m)"
            value={elevacaoM}
            onChange={(e) => setElevacaoM(e.target.value)}
            required
            className="field"
            style={{ flex: 1, minWidth: 0 }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            inputMode={unidadeTempo === 'h' ? 'text' : 'decimal'}
            placeholder={unidadeTempo === 'h' ? 'Tempo estimado (ex: 1:30)' : 'Tempo estimado (min)'}
            value={tempoEstimado}
            onChange={(e) => setTempoEstimado(sanitizarTempo(e.target.value, unidadeTempo))}
            required
            className="field"
            style={{ flex: 1, minWidth: 0 }}
          />
          <select
            value={unidadeTempo}
            onChange={(e) => alternarUnidadeTempo(e.target.value)}
            className="field"
            style={{ flex: 'none', width: 90 }}
          >
            <option value="min">min</option>
            <option value="h">horas</option>
          </select>
        </div>

        <select value={dificuldade} onChange={(e) => setDificuldade(e.target.value)} className="field">
          <option value="facil">Fácil</option>
          <option value="moderada">Moderada</option>
          <option value="dificil">Difícil</option>
        </select>

        <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="field">
          {CATEGORIAS_TRILHA.map((c) => (
            <option key={c.valor} value={c.valor}>
              {c.rotulo}
            </option>
          ))}
        </select>

        <div style={{ display: 'flex', gap: 8 }}>
          <select
            value={tipoPreco}
            onChange={(e) => setTipoPreco(e.target.value)}
            className="field"
            style={{ flex: 1, minWidth: 0 }}
          >
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

        <div>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFoto(e.target.files?.[0] ?? null)}
            style={{ display: 'none' }}
            id="input-foto-cadastro"
          />
          <label htmlFor="input-foto-cadastro" className="btn btn-outline" style={{ display: 'inline-flex', cursor: 'pointer' }}>
            {foto ? `Foto selecionada: ${foto.name}` : 'Escolher foto da trilha (opcional)'}
          </label>
        </div>

        <div>
          <input
            type="file"
            accept="video/*"
            onChange={(e) => setVideo(e.target.files?.[0] ?? null)}
            style={{ display: 'none' }}
            id="input-video-cadastro"
          />
          <label htmlFor="input-video-cadastro" className="btn btn-outline" style={{ display: 'inline-flex', cursor: 'pointer' }}>
            {video ? `Vídeo selecionado: ${video.name}` : 'Escolher vídeo da trilha (opcional)'}
          </label>
        </div>

        <TracadoEditor
          nomeTrilha={nome}
          onChange={({ localizacao: loc, path }) => { setLocalizacao(loc); setPathGravado(path); }}
        />

        {erro && <p style={{ color: 'var(--p0)', fontSize: '0.85rem', margin: 0 }}>{erro}</p>}

        <button type="submit" className="btn btn-primary" disabled={enviando}>
          {enviando ? 'Enviando…' : 'Enviar para revisão'}
        </button>
      </form>
    </>
  );
}
