// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import Avatar from './Avatar';

describe('Avatar', () => {
  it('renderiza a imagem quando há url', () => {
    render(<Avatar nome="Ana" url="https://exemplo.com/ana.jpg" />);
    const img = screen.getByRole('img', { name: 'Ana' });
    expect(img).toHaveAttribute('src', 'https://exemplo.com/ana.jpg');
  });

  it('renderiza a inicial do nome em maiúscula quando não há url', () => {
    render(<Avatar nome="bruno" />);
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  it('usa "?" quando não há nome nem url', () => {
    render(<Avatar />);
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('não mostra indicador online quando a prop não é informada', () => {
    render(<Avatar nome="Ana" />);
    expect(screen.queryByLabelText('Online')).not.toBeInTheDocument();
  });

  it('mostra o indicador online quando online=true', () => {
    render(<Avatar nome="Ana" online />);
    expect(screen.getByLabelText('Online')).toBeInTheDocument();
  });

  it('não mostra o indicador quando online=false', () => {
    render(<Avatar nome="Ana" online={false} />);
    expect(screen.queryByLabelText('Online')).not.toBeInTheDocument();
  });
});
