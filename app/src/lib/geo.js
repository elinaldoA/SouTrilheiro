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
