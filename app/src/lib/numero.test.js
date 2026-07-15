import { describe, expect, it } from 'vitest';
import { formatarHorasMinutos, paraMinutos, paraNumero, sanitizarDecimal, sanitizarTempo } from './numero';

describe('paraNumero', () => {
  it('converte vírgula decimal', () => {
    expect(paraNumero('1,5')).toBe(1.5);
  });

  it('converte string com ponto decimal', () => {
    expect(paraNumero('1.5')).toBe(1.5);
  });

  it('retorna NaN para texto não numérico', () => {
    expect(paraNumero('abc')).toBeNaN();
  });
});

describe('sanitizarDecimal', () => {
  it('remove caracteres que não sejam número, ponto ou vírgula', () => {
    expect(sanitizarDecimal('1a2,3b.4')).toBe('12,3.4');
  });
});

describe('sanitizarTempo', () => {
  it('usa sanitizarDecimal quando a unidade não é "h"', () => {
    expect(sanitizarTempo('12min', 'min')).toBe('12');
  });

  it('aceita dígitos, h, H e : quando a unidade é "h"', () => {
    expect(sanitizarTempo('1h30min', 'h')).toBe('1h30');
    expect(sanitizarTempo('1:30', 'h')).toBe('1:30');
  });
});

describe('paraMinutos', () => {
  it('em minutos, aceita só número (com vírgula ou ponto)', () => {
    expect(paraMinutos('90', 'min')).toBe(90);
    expect(paraMinutos('7,5', 'min')).toBe(7.5);
  });

  it('em horas, aceita "1:30"', () => {
    expect(paraMinutos('1:30', 'h')).toBe(90);
  });

  it('em horas, aceita "1h30"', () => {
    expect(paraMinutos('1h30', 'h')).toBe(90);
  });

  it('em horas, aceita "1h" (sem minutos)', () => {
    expect(paraMinutos('1h', 'h')).toBe(60);
  });

  it('em horas, aceita decimal como "1,5"', () => {
    expect(paraMinutos('1,5', 'h')).toBe(90);
  });

  it('retorna NaN quando os minutos excedem 59', () => {
    expect(paraMinutos('1:75', 'h')).toBeNaN();
  });
});

describe('formatarHorasMinutos', () => {
  it('formata minutos totais como H:MM', () => {
    expect(formatarHorasMinutos(90)).toBe('1:30');
    expect(formatarHorasMinutos(65)).toBe('1:05');
    expect(formatarHorasMinutos(45)).toBe('0:45');
  });
});
