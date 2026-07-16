const JANELA_AGRUPAMENTO_MS = 5 * 60 * 1000;

export function formatarHora(iso) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function rotuloData(iso) {
  const data = new Date(iso);
  const hoje = new Date();
  const ontem = new Date();
  ontem.setDate(hoje.getDate() - 1);
  if (data.toDateString() === hoje.toDateString()) return 'Hoje';
  if (data.toDateString() === ontem.toDateString()) return 'Ontem';
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: hoje.getFullYear() === data.getFullYear() ? undefined : 'numeric' });
}

/** Agrupa mensagens consecutivas do mesmo autor, no mesmo dia, enviadas a menos de 5 minutos de intervalo. */
export function agruparMensagens(mensagens) {
  const grupos = [];
  let grupoAtual = null;

  for (const m of mensagens) {
    const novaData = grupoAtual && rotuloData(m.criado_em) !== rotuloData(grupoAtual.data);
    const novoAutor = grupoAtual && grupoAtual.usuario_id !== m.usuario_id;
    const tempoLongo =
      grupoAtual && new Date(m.criado_em) - new Date(grupoAtual.itens[grupoAtual.itens.length - 1].criado_em) > JANELA_AGRUPAMENTO_MS;

    if (!grupoAtual || novaData || novoAutor || tempoLongo) {
      grupoAtual = { usuario_id: m.usuario_id, data: m.criado_em, itens: [m] };
      grupos.push(grupoAtual);
    } else {
      grupoAtual.itens.push(m);
    }
  }
  return grupos;
}

export function tipoDeArquivo(arquivo) {
  if (arquivo.type.startsWith('image/')) return 'imagem';
  if (arquivo.type.startsWith('video/')) return 'video';
  return 'arquivo';
}

export function formatarTamanho(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
