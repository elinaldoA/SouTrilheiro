import { describe, expect, it } from 'vitest';
import { BADGES } from './badges';

function badge(id) {
  return BADGES.find((b) => b.id === id);
}

describe('badges', () => {
  it('primeiro-percurso é conquistado a partir de 1 percurso', () => {
    const { conquistado } = badge('primeiro-percurso');
    expect(conquistado({ percursosCount: 0 })).toBe(false);
    expect(conquistado({ percursosCount: 1 })).toBe(true);
  });

  it('10km é conquistado ao atingir exatamente 10km de distância total', () => {
    const { conquistado } = badge('10km');
    expect(conquistado({ distanciaTotalKm: 9.99 })).toBe(false);
    expect(conquistado({ distanciaTotalKm: 10 })).toBe(true);
    expect(conquistado({ distanciaTotalKm: 15 })).toBe(true);
  });

  it('explorador exige 3 trilhas concluídas', () => {
    const { conquistado } = badge('explorador');
    expect(conquistado({ trilhasConcluidas: 2 })).toBe(false);
    expect(conquistado({ trilhasConcluidas: 3 })).toBe(true);
  });
});
