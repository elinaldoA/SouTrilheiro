import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { agruparMensagens, formatarTamanho, rotuloData, tipoDeArquivo } from './chatFormatacao';

const AGORA = new Date('2026-07-16T12:00:00-03:00');

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(AGORA);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('rotuloData', () => {
  it('rotula o dia de hoje como "Hoje"', () => {
    expect(rotuloData('2026-07-16T09:00:00-03:00')).toBe('Hoje');
  });

  it('rotula o dia anterior como "Ontem"', () => {
    expect(rotuloData('2026-07-15T23:00:00-03:00')).toBe('Ontem');
  });

  it('rotula outras datas do mesmo ano sem incluir o ano', () => {
    expect(rotuloData('2026-01-05T10:00:00-03:00')).toBe('05 de janeiro');
  });

  it('rotula datas de outro ano incluindo o ano', () => {
    expect(rotuloData('2025-01-05T10:00:00-03:00')).toBe('05 de janeiro de 2025');
  });
});

describe('agruparMensagens', () => {
  const usuarioA = 'usuario-a';
  const usuarioB = 'usuario-b';

  it('agrupa mensagens consecutivas do mesmo autor, no mesmo dia, em pouco tempo', () => {
    const mensagens = [
      { id: 1, usuario_id: usuarioA, criado_em: '2026-07-16T10:00:00-03:00' },
      { id: 2, usuario_id: usuarioA, criado_em: '2026-07-16T10:01:00-03:00' },
    ];
    const grupos = agruparMensagens(mensagens);
    expect(grupos).toHaveLength(1);
    expect(grupos[0].itens.map((m) => m.id)).toEqual([1, 2]);
  });

  it('inicia novo grupo quando o autor muda', () => {
    const mensagens = [
      { id: 1, usuario_id: usuarioA, criado_em: '2026-07-16T10:00:00-03:00' },
      { id: 2, usuario_id: usuarioB, criado_em: '2026-07-16T10:00:30-03:00' },
    ];
    const grupos = agruparMensagens(mensagens);
    expect(grupos).toHaveLength(2);
  });

  it('inicia novo grupo quando passam mais de 5 minutos entre mensagens', () => {
    const mensagens = [
      { id: 1, usuario_id: usuarioA, criado_em: '2026-07-16T10:00:00-03:00' },
      { id: 2, usuario_id: usuarioA, criado_em: '2026-07-16T10:06:00-03:00' },
    ];
    const grupos = agruparMensagens(mensagens);
    expect(grupos).toHaveLength(2);
  });

  it('inicia novo grupo quando a mensagem seguinte é de outro dia, mesmo com o mesmo autor', () => {
    const mensagens = [
      { id: 1, usuario_id: usuarioA, criado_em: '2026-07-15T23:59:00-03:00' },
      { id: 2, usuario_id: usuarioA, criado_em: '2026-07-16T00:01:00-03:00' },
    ];
    const grupos = agruparMensagens(mensagens);
    expect(grupos).toHaveLength(2);
  });

  it('retorna lista vazia para nenhuma mensagem', () => {
    expect(agruparMensagens([])).toEqual([]);
  });
});

describe('tipoDeArquivo', () => {
  it('identifica imagem pelo content-type', () => {
    expect(tipoDeArquivo({ type: 'image/png' })).toBe('imagem');
  });

  it('identifica vídeo pelo content-type', () => {
    expect(tipoDeArquivo({ type: 'video/mp4' })).toBe('video');
  });

  it('trata qualquer outro content-type como arquivo genérico', () => {
    expect(tipoDeArquivo({ type: 'application/pdf' })).toBe('arquivo');
  });
});

describe('formatarTamanho', () => {
  it('formata bytes', () => {
    expect(formatarTamanho(500)).toBe('500 B');
  });

  it('formata kilobytes', () => {
    expect(formatarTamanho(2048)).toBe('2 KB');
  });

  it('formata megabytes com uma casa decimal', () => {
    expect(formatarTamanho(5 * 1024 * 1024)).toBe('5.0 MB');
  });
});
