// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TextoComMarcacoes from './TextoComMarcacoes';

function renderizar(props) {
  return render(
    <MemoryRouter>
      <TextoComMarcacoes {...props} />
    </MemoryRouter>
  );
}

describe('TextoComMarcacoes', () => {
  it('retorna null quando não há texto', () => {
    const { container } = renderizar({ texto: '' });
    expect(container).toBeEmptyDOMElement();
  });

  it('renderiza texto simples sem marcações como texto puro', () => {
    renderizar({ texto: 'Um passeio tranquilo ontem.' });
    expect(screen.getByText('Um passeio tranquilo ontem.')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('transforma uma hashtag em link para /hashtag/:tag', () => {
    renderizar({ texto: 'Que trilha linda #natureza hoje' });
    const link = screen.getByRole('link', { name: '#natureza' });
    expect(link).toHaveAttribute('href', '/hashtag/natureza');
  });

  it('transforma uma menção em link para /usuario/:id usando o mapa de menções', () => {
    renderizar({
      texto: 'Fui com @Bruno na trilha',
      mencoes: [{ textoMarcador: '@Bruno', usuarioId: 'u42' }],
    });
    const link = screen.getByRole('link', { name: '@Bruno' });
    expect(link).toHaveAttribute('href', '/usuario/u42');
  });

  it('não sobrepõe uma menção e uma hashtag que colidem, mantendo a que veio primeiro', () => {
    renderizar({
      texto: '#trilha é vida',
      mencoes: [{ textoMarcador: '#trilha', usuarioId: 'u1' }],
    });
    // a ocorrência de menção é processada primeiro (mesma posição), então vence
    const link = screen.getByRole('link', { name: '#trilha' });
    expect(link).toHaveAttribute('href', '/usuario/u1');
  });
});
