// Pré-busca de tiles do MapTiler para uma trilha, para que o mapa renderize offline depois
// (o service worker guarda cada tile buscado aqui em cache — ver runtimeCaching
// "soutrilheiro-map-tiles" no vite.config.js). Limitado a poucos zooms e a um teto de tiles
// para não estourar a franquia gratuita da conta.

const TETO_TILES = 90;

function long2tile(lon, zoom) {
  return Math.floor(((lon + 180) / 360) * 2 ** zoom);
}

function lat2tile(lat, zoom) {
  const rad = (lat * Math.PI) / 180;
  return Math.floor(((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * 2 ** zoom);
}

function bbox(path) {
  const lats = path.map((p) => p[0]);
  const lngs = path.map((p) => p[1]);
  return {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLng: Math.min(...lngs),
    maxLng: Math.max(...lngs),
  };
}

export async function prebuscarTilesDaTrilha(path, zooms = [13, 14, 15]) {
  if (!path || path.length === 0) return;
  const chave = import.meta.env.VITE_MAPTILER_KEY;
  const { minLat, maxLat, minLng, maxLng } = bbox(path);

  const urls = [];
  for (const z of zooms) {
    const x1 = long2tile(minLng, z) - 1;
    const x2 = long2tile(maxLng, z) + 1;
    const y1 = lat2tile(maxLat, z) - 1;
    const y2 = lat2tile(minLat, z) + 1;
    for (let x = x1; x <= x2; x++) {
      for (let y = y1; y <= y2; y++) {
        urls.push(`https://api.maptiler.com/maps/outdoor-v2/${z}/${x}/${y}.png?key=${chave}`);
        if (urls.length >= TETO_TILES) break;
      }
      if (urls.length >= TETO_TILES) break;
    }
    if (urls.length >= TETO_TILES) break;
  }

  const CONCORRENCIA = 6;
  for (let i = 0; i < urls.length; i += CONCORRENCIA) {
    const lote = urls.slice(i, i + CONCORRENCIA);
    await Promise.all(lote.map((url) => fetch(url).catch(() => null)));
  }
}
