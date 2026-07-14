import { Link } from 'react-router-dom';

const REGEX_HASHTAG = /#[\p{L}0-9_]+/gu;

/**
 * Renderiza a legenda transformando "@Nome" (resolvido via `mencoes`) em link de perfil
 * e "#hashtag" em link de busca por hashtag.
 */
export default function TextoComMarcacoes({ texto, mencoes }) {
  if (!texto) return null;

  const ocorrencias = [];

  for (const m of mencoes ?? []) {
    const indice = texto.indexOf(m.textoMarcador);
    if (indice === -1) continue;
    ocorrencias.push({ inicio: indice, fim: indice + m.textoMarcador.length, tipo: 'mencao', payload: m });
  }

  for (const match of texto.matchAll(REGEX_HASHTAG)) {
    ocorrencias.push({ inicio: match.index, fim: match.index + match[0].length, tipo: 'hashtag', payload: match[0] });
  }

  ocorrencias.sort((a, b) => a.inicio - b.inicio);

  const semSobreposicao = [];
  let limite = 0;
  for (const oc of ocorrencias) {
    if (oc.inicio < limite) continue;
    semSobreposicao.push(oc);
    limite = oc.fim;
  }

  if (semSobreposicao.length === 0) return <>{texto}</>;

  const partes = [];
  let cursor = 0;
  semSobreposicao.forEach((oc, i) => {
    if (oc.inicio > cursor) partes.push(texto.slice(cursor, oc.inicio));
    if (oc.tipo === 'mencao') {
      partes.push(
        <Link key={`m${i}`} to={`/usuario/${oc.payload.usuarioId}`} style={{ fontWeight: 600 }}>
          {oc.payload.textoMarcador}
        </Link>
      );
    } else {
      const tag = oc.payload.slice(1);
      partes.push(
        <Link key={`h${i}`} to={`/hashtag/${encodeURIComponent(tag)}`}>
          {oc.payload}
        </Link>
      );
    }
    cursor = oc.fim;
  });
  if (cursor < texto.length) partes.push(texto.slice(cursor));

  return <>{partes}</>;
}
