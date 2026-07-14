import { useRef, useState } from 'react';
import { enviarFoto } from '../api/fotos';
import { enviarVideo } from '../api/videos';
import { marcarPessoas } from '../api/marcacoes';
import { salvarMencoes } from '../api/mencoes';
import { notificar } from '../api/notificacoesPush';
import EditorLegenda from './EditorLegenda';
import SeletorPessoas from './SeletorPessoas';

export default function PublicarNoFeed({ usuario, onPublicado }) {
  const [arquivo, setArquivo] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [legenda, setLegenda] = useState('');
  const [mencoes, setMencoes] = useState([]);
  const [localizacao, setLocalizacao] = useState('');
  const [pessoasMarcadas, setPessoasMarcadas] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);
  const inputRef = useRef(null);

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
    setMencoes([]);
    setLocalizacao('');
    setPessoasMarcadas([]);
    setErro(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  async function publicar(e) {
    e.preventDefault();
    if (!arquivo) return;
    setEnviando(true);
    setErro(null);
    try {
      const ehVideo = arquivo.type.startsWith('video/');
      const registro = ehVideo
        ? await enviarVideo(null, usuario.id, arquivo, legenda.trim(), localizacao.trim())
        : await enviarFoto(null, usuario.id, arquivo, legenda.trim(), localizacao.trim());
      const tipo = ehVideo ? 'video' : 'foto';

      const idsMarcados = pessoasMarcadas.map((p) => p.id);
      await marcarPessoas(tipo, registro.id, usuario.id, idsMarcados);
      await salvarMencoes(tipo, registro.id, usuario.id, mencoes);

      const notificados = new Set();
      for (const pessoa of pessoasMarcadas) {
        if (pessoa.id === usuario.id || notificados.has(pessoa.id)) continue;
        notificados.add(pessoa.id);
        notificar(pessoa.id, 'Você foi marcado(a)', `${usuario.nome} marcou você em uma publicação.`, '/feed');
      }
      for (const m of mencoes) {
        if (m.usuarioId === usuario.id || notificados.has(m.usuarioId)) continue;
        notificados.add(m.usuarioId);
        notificar(m.usuarioId, 'Você foi mencionado(a)', `${usuario.nome} mencionou você em uma publicação.`, '/feed');
      }

      onPublicado(
        {
          id: registro.id,
          tipo,
          criadoEm: registro.criado_em,
          usuario: { id: usuario.id, nome: usuario.nome, avatar_url: usuario.avatar_url },
          trilha: null,
          url: registro.url,
          legenda: registro.legenda,
          localizacao: registro.localizacao,
        },
        pessoasMarcadas,
        mencoes
      );
      cancelar();
    } catch (e2) {
      setErro(e2.message ?? 'Não foi possível publicar.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="feed-card" style={{ padding: 14 }}>
      {!arquivo ? (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/*,video/*"
            onChange={aoEscolherArquivo}
            style={{ display: 'none' }}
            id="input-publicar-feed"
          />
          <label htmlFor="input-publicar-feed" className="btn btn-outline" style={{ width: '100%', cursor: 'pointer' }}>
            Publicar foto ou vídeo
          </label>
        </>
      ) : (
        <form onSubmit={publicar} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {arquivo.type.startsWith('video/') ? (
            <video src={previewUrl} controls preload="metadata" style={{ width: '100%', maxHeight: 260, borderRadius: 8, background: '#000' }} />
          ) : (
            <img src={previewUrl} alt="" style={{ width: '100%', maxHeight: 320, objectFit: 'cover', borderRadius: 8 }} />
          )}

          <EditorLegenda
            usuarioAtualId={usuario.id}
            texto={legenda}
            onTextoChange={setLegenda}
            mencoes={mencoes}
            onMencoesChange={setMencoes}
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
              {enviando ? 'Publicando…' : 'Publicar'}
            </button>
            <button type="button" className="btn-link" onClick={cancelar} disabled={enviando} style={{ textDecoration: 'none' }}>
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
