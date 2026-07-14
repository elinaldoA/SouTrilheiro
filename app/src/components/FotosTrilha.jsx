import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { listarFotos, enviarFoto } from '../api/fotos';
import { marcarPessoas, listarMarcacoesEmLote } from '../api/marcacoes';
import { salvarMencoes, listarMencoesEmLote } from '../api/mencoes';
import { notificar } from '../api/notificacoesPush';
import BotaoDenunciar from './BotaoDenunciar';
import EditorLegenda from './EditorLegenda';
import SeletorPessoas from './SeletorPessoas';
import TextoComMarcacoes from './TextoComMarcacoes';

export default function FotosTrilha({ trilhaId }) {
  const { usuario } = useAuth();
  const [fotos, setFotos] = useState([]);
  const [marcacoes, setMarcacoes] = useState({});
  const [mencoes, setMencoes] = useState({});
  const [carregando, setCarregando] = useState(true);
  const [arquivo, setArquivo] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [legenda, setLegenda] = useState('');
  const [mencoesEdicao, setMencoesEdicao] = useState([]);
  const [localizacao, setLocalizacao] = useState('');
  const [pessoasMarcadas, setPessoasMarcadas] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    let cancelado = false;
    listarFotos(trilhaId)
      .then(async (dados) => {
        if (cancelado) return;
        setFotos(dados);
        const itens = dados.map((f) => ({ tipo: 'foto', id: f.id }));
        const [marcacoesDados, mencoesDados] = await Promise.all([listarMarcacoesEmLote(itens), listarMencoesEmLote(itens)]);
        if (cancelado) return;
        setMarcacoes(marcacoesDados);
        setMencoes(mencoesDados);
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [trilhaId]);

  function aoEscolherArquivo(e) {
    const escolhido = e.target.files?.[0];
    if (!escolhido) return;
    setErro(null);
    setArquivo(escolhido);
    setPreviewUrl(URL.createObjectURL(escolhido));
  }

  function cancelar() {
    setArquivo(null);
    setPreviewUrl(null);
    setLegenda('');
    setMencoesEdicao([]);
    setLocalizacao('');
    setPessoasMarcadas([]);
    setErro(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  async function enviar(e) {
    e.preventDefault();
    if (!arquivo) return;
    setErro(null);
    setEnviando(true);
    try {
      const registro = await enviarFoto(trilhaId, usuario.id, arquivo, legenda.trim(), localizacao.trim());
      const idsMarcados = pessoasMarcadas.map((p) => p.id);
      await marcarPessoas('foto', registro.id, usuario.id, idsMarcados);
      await salvarMencoes('foto', registro.id, usuario.id, mencoesEdicao);

      const notificados = new Set();
      for (const pessoa of pessoasMarcadas) {
        if (pessoa.id === usuario.id || notificados.has(pessoa.id)) continue;
        notificados.add(pessoa.id);
        notificar(pessoa.id, 'Você foi marcado(a)', `${usuario.nome} marcou você em uma foto.`, `/trilha/${trilhaId}`);
      }
      for (const m of mencoesEdicao) {
        if (m.usuarioId === usuario.id || notificados.has(m.usuarioId)) continue;
        notificados.add(m.usuarioId);
        notificar(m.usuarioId, 'Você foi mencionado(a)', `${usuario.nome} mencionou você em uma foto.`, `/trilha/${trilhaId}`);
      }

      setFotos((atuais) => [registro, ...atuais]);
      if (pessoasMarcadas.length) setMarcacoes((atuais) => ({ ...atuais, [`foto:${registro.id}`]: pessoasMarcadas }));
      if (mencoesEdicao.length) setMencoes((atuais) => ({ ...atuais, [`foto:${registro.id}`]: mencoesEdicao }));
      cancelar();
    } catch (e2) {
      setErro(e2.message ?? 'Não foi possível enviar a foto.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <h2 style={{ fontSize: '1rem' }}>Fotos</h2>

      {usuario?.is_admin ? (
        !arquivo ? (
          <div>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              onChange={aoEscolherArquivo}
              style={{ display: 'none' }}
              id="input-foto-trilha"
            />
            <label htmlFor="input-foto-trilha" className="btn btn-outline" style={{ display: 'inline-flex', cursor: 'pointer' }}>
              Adicionar foto
            </label>
          </div>
        ) : (
          <form onSubmit={enviar} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <img src={previewUrl} alt="" style={{ width: '100%', maxHeight: 320, objectFit: 'cover', borderRadius: 8 }} />
            <EditorLegenda
              usuarioAtualId={usuario.id}
              texto={legenda}
              onTextoChange={setLegenda}
              mencoes={mencoesEdicao}
              onMencoesChange={setMencoesEdicao}
            />
            <input
              className="field"
              value={localizacao}
              onChange={(e) => setLocalizacao(e.target.value)}
              placeholder="Localização (opcional)"
              style={{ height: 32, fontSize: '0.82rem' }}
            />
            <SeletorPessoas usuarioAtualId={usuario.id} selecionados={pessoasMarcadas} onChange={setPessoasMarcadas} />
            {erro && <p style={{ color: 'var(--p0)', fontSize: '0.82rem', margin: 0 }}>{erro}</p>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" className="btn btn-primary" disabled={enviando}>
                {enviando ? 'Enviando…' : 'Enviar'}
              </button>
              <button type="button" className="btn-link" onClick={cancelar} disabled={enviando} style={{ textDecoration: 'none' }}>
                Cancelar
              </button>
            </div>
          </form>
        )
      ) : (
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
          {usuario ? (
            'Apenas administradores podem adicionar fotos a esta trilha.'
          ) : (
            <>
              <Link to="/perfil">Entre</Link> para adicionar fotos desta trilha.
            </>
          )}
        </p>
      )}

      {erro && arquivo === null && <p style={{ color: 'var(--p0)', fontSize: '0.82rem', margin: 0 }}>{erro}</p>}

      {carregando && <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Carregando fotos…</p>}
      {!carregando && fotos.length === 0 && (
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Nenhuma foto ainda.</p>
      )}

      {fotos.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
          {fotos.map((f) => {
            const chave = `foto:${f.id}`;
            const marcados = marcacoes[chave];
            return (
              <div key={f.id} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <a href={f.url} target="_blank" rel="noreferrer">
                  <img
                    src={f.url}
                    alt={`Foto enviada por ${f.usuarios?.nome ?? 'trilheiro'}`}
                    loading="lazy"
                    style={{
                      width: '100%',
                      aspectRatio: '1',
                      objectFit: 'cover',
                      borderRadius: 8,
                      border: '1px solid var(--line)',
                    }}
                  />
                </a>
                {f.usuarios && (
                  <Link to={`/usuario/${f.usuarios.id}`} style={{ fontSize: '0.68rem', color: 'var(--muted)' }}>
                    {f.usuarios.nome}
                  </Link>
                )}
                {f.localizacao && <span style={{ fontSize: '0.66rem', color: 'var(--muted)' }}>{f.localizacao}</span>}
                {marcados?.length > 0 && (
                  <span style={{ fontSize: '0.66rem', color: 'var(--muted)' }}>
                    com {marcados.map((p) => p.nome).join(', ')}
                  </span>
                )}
                {f.legenda && (
                  <span style={{ fontSize: '0.7rem' }}>
                    <TextoComMarcacoes texto={f.legenda} mencoes={mencoes[chave]} />
                  </span>
                )}
                <BotaoDenunciar tipoAlvo="foto" alvoId={f.id} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
