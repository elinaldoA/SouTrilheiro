export function paraNumero(valorTexto) {
  if (typeof valorTexto !== 'string') return Number(valorTexto);
  return Number(valorTexto.replace(',', '.'));
}

export function sanitizarDecimal(valorTexto) {
  return valorTexto.replace(/[^0-9.,]/g, '');
}

export function sanitizarTempo(valorTexto, unidade) {
  if (unidade !== 'h') return sanitizarDecimal(valorTexto);
  return valorTexto.replace(/[^0-9.,:hH]/g, '');
}

/**
 * Converte o texto do campo "tempo estimado" para minutos totais.
 * Em minutos, aceita só número (com vírgula ou ponto). Em horas, aceita
 * "1:30", "1h30", "1h" ou um decimal como "1,5" (todos equivalentes a 90min).
 */
export function paraMinutos(valorTexto, unidade) {
  const texto = (valorTexto ?? '').trim();
  if (unidade !== 'h') return paraNumero(texto);

  const partes = texto.match(/^(\d+)\s*[:hH]\s*(\d{1,2})?$/);
  if (partes) {
    const horas = Number(partes[1]);
    const minutos = partes[2] ? Number(partes[2]) : 0;
    if (minutos > 59) return NaN;
    return horas * 60 + minutos;
  }

  const horasDecimal = paraNumero(texto);
  return Number.isNaN(horasDecimal) ? NaN : horasDecimal * 60;
}

export function formatarHorasMinutos(minutosTotais) {
  const totalArredondado = Math.round(minutosTotais);
  const horas = Math.floor(totalArredondado / 60);
  const minutos = totalArredondado % 60;
  return `${horas}:${String(minutos).padStart(2, '0')}`;
}
