import { describe, expect, it } from 'vitest';
import { gerarGpx, parseGpx } from './gpx';

const GPX_VALIDO = `<?xml version="1.0"?>
<gpx version="1.1" creator="teste">
  <trk>
    <name>Trilha Teste</name>
    <trkseg>
      <trkpt lat="-20.3155" lon="-40.3128"></trkpt>
      <trkpt lat="-20.3245" lon="-40.3128"></trkpt>
      <trkpt lat="-20.3300" lon="-40.3200"></trkpt>
    </trkseg>
  </trk>
</gpx>`;

describe('parseGpx', () => {
  it('extrai os pontos [lat, lng] de um GPX válido', () => {
    expect(parseGpx(GPX_VALIDO)).toEqual([
      [-20.3155, -40.3128],
      [-20.3245, -40.3128],
      [-20.33, -40.32],
    ]);
  });

  it('rejeita um arquivo que não é GPX', () => {
    expect(() => parseGpx('<html><body>oi</body></html>')).toThrow();
  });

  it('rejeita um GPX sem pontos suficientes', () => {
    expect(() => parseGpx('<gpx><trk><trkseg><trkpt lat="1" lon="2"></trkpt></trkseg></trk></gpx>')).toThrow();
  });
});

describe('gerarGpx', () => {
  it('gera um GPX que pode ser lido de volta pelo parseGpx', () => {
    const pontos = [
      [-20.3155, -40.3128],
      [-20.3245, -40.3128],
    ];
    const xml = gerarGpx(pontos, 'Minha Trilha');
    expect(xml).toContain('<name>Minha Trilha</name>');
    expect(parseGpx(xml)).toEqual(pontos);
  });

  it('escapa caracteres especiais no nome da trilha', () => {
    const xml = gerarGpx([[0, 0], [0, 1]], 'Trilha & <Cia>');
    expect(xml).toContain('Trilha &amp; &lt;Cia&gt;');
  });
});
