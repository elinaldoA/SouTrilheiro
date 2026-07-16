import { IconArquivo } from './ChatIcones';

export default function AnexoChat({ url, tipo, nome }) {
  if (tipo === 'imagem') {
    return (
      <a href={url} target="_blank" rel="noreferrer">
        <img src={url} alt={nome ?? 'imagem'} className="chat-anexo-imagem" />
      </a>
    );
  }
  if (tipo === 'video') {
    return <video src={url} controls preload="metadata" className="chat-anexo-video" />;
  }
  return (
    <a href={url} target="_blank" rel="noreferrer" className="chat-anexo-arquivo">
      <IconArquivo />
      <span className="chat-anexo-arquivo-nome">{nome ?? 'Arquivo'}</span>
    </a>
  );
}
