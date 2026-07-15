import { describe, expect, it } from 'vitest';
import { distanciaKm, formatarDuracao, formatarRitmo, simplificarTracado } from './geo';

describe('distanciaKm', () => {
  it('calcula a distância entre dois pontos próximos (~1km)', () => {
    const distancia = distanciaKm(-20.3155, -40.3128, -20.3245, -40.3128);
    expect(distancia).toBeCloseTo(1, 1);
  });

  it('retorna 0 para o mesmo ponto', () => {
    expect(distanciaKm(-20.3155, -40.3128, -20.3155, -40.3128)).toBeCloseTo(0, 6);
  });
});

describe('formatarDuracao', () => {
  it('formata sem horas quando menor que 1h', () => {
    expect(formatarDuracao(90)).toBe('1:30');
  });

  it('formata com horas quando maior ou igual a 1h', () => {
    expect(formatarDuracao(3665)).toBe('1:01:05');
  });
});

describe('formatarRitmo', () => {
  it('formata o ritmo em min/km', () => {
    expect(formatarRitmo(600, 2)).toBe('5:00');
  });

  it('retorna travessão quando a distância é insignificante', () => {
    expect(formatarRitmo(600, 0)).toBe('—');
  });
});

describe('simplificarTracado', () => {
  it('retorna o mesmo array quando há menos de 3 pontos', () => {
    const pontos = [[0, 0], [0, 1]];
    expect(simplificarTracado(pontos)).toEqual(pontos);
  });

  it('colapsa pontos colineares mantendo só os extremos', () => {
    const pontos = [
      [0, 0],
      [0, 0.001],
      [0, 0.002],
      [0, 0.003],
    ];
    expect(simplificarTracado(pontos)).toEqual([pontos[0], pontos[3]]);
  });

  it('preserva um ponto claramente fora da reta', () => {
    const pontos = [
      [0, 0],
      [0.05, 0.001],
      [0, 0.002],
    ];
    const resultado = simplificarTracado(pontos, 0.008);
    expect(resultado).toContainEqual(pontos[1]);
  });
});
