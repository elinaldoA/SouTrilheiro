// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ThemeToggle from './ThemeToggle';
import { ThemeProvider } from '../context/ThemeContext';

beforeEach(() => {
  localStorage.clear();
  window.matchMedia = window.matchMedia || (() => ({ matches: false }));
});

afterEach(() => {
  document.documentElement.removeAttribute('data-theme');
});

describe('ThemeToggle', () => {
  it('começa no modo claro (sem tema salvo) e o botão oferece ir para o modo escuro', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );
    expect(screen.getByRole('button', { name: 'Mudar para modo escuro' })).toBeInTheDocument();
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('alterna para o modo escuro ao clicar, e persiste em localStorage', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );
    await user.click(screen.getByRole('button'));
    expect(screen.getByRole('button', { name: 'Mudar para modo claro' })).toBeInTheDocument();
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('soutrilheiro_tema')).toBe('dark');
  });

  it('respeita o tema salvo em localStorage ao montar', () => {
    localStorage.setItem('soutrilheiro_tema', 'dark');
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );
    expect(screen.getByRole('button', { name: 'Mudar para modo claro' })).toBeInTheDocument();
  });
});
