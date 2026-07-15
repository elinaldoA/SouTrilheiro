// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TracadoEditor from './TracadoEditor';

vi.mock('./TrailMap', () => ({ default: () => <div data-testid="trail-map" /> }));
vi.mock('./TrailMapDrawer', () => ({ default: () => <div data-testid="trail-map-drawer" /> }));
vi.mock('./TrailMapAoVivo', () => ({ default: () => <div data-testid="trail-map-ao-vivo" /> }));

const GPX_VALIDO = `<gpx><trk><trkseg>
  <trkpt lat="-20.3155" lon="-40.3128"></trkpt>
  <trkpt lat="-20.3200" lon="-40.3150"></trkpt>
  <trkpt lat="-20.3245" lon="-40.3180"></trkpt>
</trkseg></trk></gpx>`;

function arquivoGpx(conteudo = GPX_VALIDO, nome = 'trilha.gpx') {
  return new File([conteudo], nome, { type: 'application/gpx+xml' });
}

beforeEach(() => {
  vi.stubGlobal('navigator', { ...navigator, geolocation: { getCurrentPosition: vi.fn(), watchPosition: vi.fn(), clearWatch: vi.fn() } });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('TracadoEditor', () => {
  it('importa um GPX válido e reporta o novo path via onChange', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TracadoEditor onChange={onChange} />);

    const input = document.querySelector('input[type="file"]');
    await user.upload(input, arquivoGpx());

    await waitFor(() => expect(screen.getByTestId('trail-map')).toBeInTheDocument());
    expect(onChange).toHaveBeenLastCalledWith({
      localizacao: { lat: -20.3155, lng: -40.3128 },
      path: [
        [-20.3155, -40.3128],
        [-20.32, -40.315],
        [-20.3245, -40.318],
      ],
    });
  });

  it('mostra mensagem de erro ao importar um arquivo que não é GPX', async () => {
    const user = userEvent.setup();
    render(<TracadoEditor onChange={vi.fn()} />);

    const input = document.querySelector('input[type="file"]');
    await user.upload(input, arquivoGpx('não é xml', 'arquivo.txt'));

    expect(await screen.findByText('O arquivo enviado não é um GPX.')).toBeInTheDocument();
    expect(screen.queryByTestId('trail-map')).not.toBeInTheDocument();
  });

  it('só mostra "Exportar GPX" depois de haver um traçado com mais de 1 ponto', async () => {
    const user = userEvent.setup();
    render(<TracadoEditor onChange={vi.fn()} />);

    expect(screen.queryByText('Exportar GPX')).not.toBeInTheDocument();

    const input = document.querySelector('input[type="file"]');
    await user.upload(input, arquivoGpx());

    expect(await screen.findByText('Exportar GPX')).toBeInTheDocument();
  });

  it('descartar traçado limpa o path e some com o mapa', async () => {
    const user = userEvent.setup();
    render(<TracadoEditor onChange={vi.fn()} />);

    const input = document.querySelector('input[type="file"]');
    await user.upload(input, arquivoGpx());
    await screen.findByTestId('trail-map');

    await user.click(screen.getByText('Descartar traçado'));
    expect(screen.queryByTestId('trail-map')).not.toBeInTheDocument();
  });
});
