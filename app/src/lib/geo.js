export function distanciaKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function paraPlanoKm(ponto, latRefRad) {
  return [ponto[1] * Math.cos(latRefRad) * 111.32, ponto[0] * 111.32];
}

function distanciaPerpendicularKm(ponto, inicio, fim, latRefRad) {
  const [px, py] = paraPlanoKm(ponto, latRefRad);
  const [ix, iy] = paraPlanoKm(inicio, latRefRad);
  const [fx, fy] = paraPlanoKm(fim, latRefRad);

  const dx = fx - ix;
  const dy = fy - iy;
  const comprimento2 = dx * dx + dy * dy;
  if (comprimento2 === 0) return Math.hypot(px - ix, py - iy);

  const t = Math.max(0, Math.min(1, ((px - ix) * dx + (py - iy) * dy) / comprimento2));
  const projX = ix + t * dx;
  const projY = iy + t * dy;
  return Math.hypot(px - projX, py - projY);
}

/**
 * Simplifica um traçado (array de [lat, lng]) usando Douglas-Peucker,
 * reduzindo ruído de GPS mantendo o formato geral do percurso.
 */
export function simplificarTracado(pontos, toleranciaKm = 0.008) {
  if (!pontos || pontos.length < 3) return pontos ?? [];

  const latRefRad = (pontos[0][0] * Math.PI) / 180;

  function reduzir(inicio, fim) {
    let maiorDistancia = 0;
    let indiceMaisDistante = -1;

    for (let i = inicio + 1; i < fim; i++) {
      const distancia = distanciaPerpendicularKm(pontos[i], pontos[inicio], pontos[fim], latRefRad);
      if (distancia > maiorDistancia) {
        maiorDistancia = distancia;
        indiceMaisDistante = i;
      }
    }

    if (maiorDistancia > toleranciaKm && indiceMaisDistante !== -1) {
      const esquerda = reduzir(inicio, indiceMaisDistante);
      const direita = reduzir(indiceMaisDistante, fim);
      return [...esquerda.slice(0, -1), ...direita];
    }

    return [pontos[inicio], pontos[fim]];
  }

  return reduzir(0, pontos.length - 1);
}

export function formatarDuracao(segundosTotais) {
  const h = Math.floor(segundosTotais / 3600);
  const m = Math.floor((segundosTotais % 3600) / 60);
  const s = Math.floor(segundosTotais % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function formatarRitmo(segundosTotais, distanciaKmTotal) {
  if (!distanciaKmTotal || distanciaKmTotal < 0.05) return '—';
  const segPorKm = segundosTotais / distanciaKmTotal;
  const m = Math.floor(segPorKm / 60);
  const s = Math.round(segPorKm % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}
