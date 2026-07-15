const REGEX_PONTO = /<(?:trkpt|rtept|wpt)\b[^>]*\blat="(-?[\d.]+)"[^>]*\blon="(-?[\d.]+)"[^>]*>|<(?:trkpt|rtept|wpt)\b[^>]*\blon="(-?[\d.]+)"[^>]*\blat="(-?[\d.]+)"[^>]*>/gi;

/**
 * Extrai pontos [lat, lng] de um arquivo GPX (trkpt ou, na ausência de trilha,
 * rtept/wpt). Faz um parse leve por regex (sem depender de DOMParser) já que o
 * projeto não tem uma lib de XML e o GPX é um formato simples. Lança erro se o
 * conteúdo não parecer um GPX válido.
 */
export function parseGpx(texto) {
  if (typeof texto !== 'string' || !/<gpx[\s>]/i.test(texto)) {
    throw new Error('O arquivo enviado não é um GPX.');
  }

  const pontos = [];
  for (const match of texto.matchAll(REGEX_PONTO)) {
    const lat = parseFloat(match[1] ?? match[4]);
    const lng = parseFloat(match[2] ?? match[3]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) pontos.push([lat, lng]);
  }

  if (pontos.length < 2) {
    throw new Error('O GPX não contém um percurso com pontos suficientes.');
  }
  return pontos;
}

function escaparXml(texto) {
  return String(texto).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
}

/** Gera o texto de um arquivo GPX a partir de um percurso [lat, lng]. */
export function gerarGpx(pontos, nomeTrilha = 'Trilha') {
  const trkpts = pontos.map(([lat, lng]) => `      <trkpt lat="${lat}" lon="${lng}"></trkpt>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="SouTrilheiro" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>${escaparXml(nomeTrilha)}</name>
    <trkseg>
${trkpts}
    </trkseg>
  </trk>
</gpx>
`;
}

/** Dispara o download de um percurso como arquivo .gpx no navegador. */
export function baixarGpx(pontos, nomeTrilha = 'trilha') {
  const conteudo = gerarGpx(pontos, nomeTrilha);
  const blob = new Blob([conteudo], { type: 'application/gpx+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${nomeTrilha.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'trilha'}.gpx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
