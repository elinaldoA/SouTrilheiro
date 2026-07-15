// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import PapelBadge from './PapelBadge';

describe('PapelBadge', () => {
  it('mostra "Admin" quando ehAdmin é true, mesmo que ehGuia também seja true', () => {
    render(<PapelBadge ehAdmin ehGuia />);
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.queryByText('Guia')).not.toBeInTheDocument();
  });

  it('mostra "Guia" quando só ehGuia é true', () => {
    render(<PapelBadge ehGuia />);
    expect(screen.getByText('Guia')).toBeInTheDocument();
  });

  it('não renderiza nada quando nenhum papel é verdadeiro', () => {
    const { container } = render(<PapelBadge />);
    expect(container).toBeEmptyDOMElement();
  });
});
