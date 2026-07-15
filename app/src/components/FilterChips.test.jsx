// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FilterChips from './FilterChips';

function propsBase(overrides = {}) {
  return {
    dificuldade: null,
    distanciaMax: null,
    categoria: null,
    estado: null,
    tipoPreco: null,
    onChangeDificuldade: vi.fn(),
    onChangeDistancia: vi.fn(),
    onChangeCategoria: vi.fn(),
    onChangeEstado: vi.fn(),
    onChangeTipoPreco: vi.fn(),
    ...overrides,
  };
}

describe('FilterChips', () => {
  it('não mostra chips ativos nem painel quando nenhum filtro está selecionado', () => {
    render(<FilterChips {...propsBase()} />);
    expect(screen.queryByText('Limpar')).not.toBeInTheDocument();
    expect(screen.queryByText('Dificuldade')).not.toBeInTheDocument();
  });

  it('abre o painel de filtros ao clicar em "Filtros"', async () => {
    const user = userEvent.setup();
    render(<FilterChips {...propsBase()} />);
    await user.click(screen.getByRole('button', { name: /Filtros/ }));
    expect(screen.getByText('Dificuldade')).toBeInTheDocument();
  });

  it('mostra um chip ativo com o rótulo do filtro selecionado', () => {
    render(<FilterChips {...propsBase({ dificuldade: 'moderada' })} />);
    expect(screen.getByRole('button', { name: 'Moderada' })).toBeInTheDocument();
  });

  it('chama o callback correto ao remover um filtro ativo', async () => {
    const user = userEvent.setup();
    const onChangeDificuldade = vi.fn();
    render(<FilterChips {...propsBase({ dificuldade: 'facil', onChangeDificuldade })} />);
    await user.click(screen.getByRole('button', { name: 'Fácil' }));
    expect(onChangeDificuldade).toHaveBeenCalledWith(null);
  });

  it('"Limpar" reseta todos os filtros ativos', async () => {
    const user = userEvent.setup();
    const callbacks = {
      onChangeDificuldade: vi.fn(),
      onChangeDistancia: vi.fn(),
      onChangeTipoPreco: vi.fn(),
      onChangeCategoria: vi.fn(),
      onChangeEstado: vi.fn(),
    };
    render(<FilterChips {...propsBase({ dificuldade: 'facil', distanciaMax: 5, ...callbacks })} />);
    await user.click(screen.getByText('Limpar'));
    expect(callbacks.onChangeDificuldade).toHaveBeenCalledWith(null);
    expect(callbacks.onChangeDistancia).toHaveBeenCalledWith(null);
    expect(callbacks.onChangeTipoPreco).toHaveBeenCalledWith(null);
    expect(callbacks.onChangeCategoria).toHaveBeenCalledWith(null);
    expect(callbacks.onChangeEstado).toHaveBeenCalledWith(null);
  });

  it('seleciona uma dificuldade ao clicar no chip correspondente no painel', async () => {
    const user = userEvent.setup();
    const onChangeDificuldade = vi.fn();
    render(<FilterChips {...propsBase({ onChangeDificuldade })} />);
    await user.click(screen.getByRole('button', { name: /Filtros/ }));
    await user.click(screen.getByRole('button', { name: 'Difícil' }));
    expect(onChangeDificuldade).toHaveBeenCalledWith('dificil');
  });
});
