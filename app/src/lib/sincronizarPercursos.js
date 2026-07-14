import { salvarPercurso } from '../api/percursos';
import { listarPercursosPendentes, removerPercursoLocal } from '../api/percursosLocais';

export async function sincronizarPercursosPendentes(usuarioId) {
  if (!usuarioId || !navigator.onLine) return;

  const pendentes = listarPercursosPendentes(usuarioId);
  for (const p of pendentes) {
    try {
      await salvarPercurso(usuarioId, {
        trilhaId: p.trilhaId,
        distanciaKm: p.distanciaKm,
        duracaoSeg: p.duracaoSeg,
        elevacaoM: p.elevacaoM,
        pathGeojson: p.pathGeojson,
        iniciadoEm: p.iniciadoEm,
        finalizadoEm: p.finalizadoEm,
        notaPercurso: p.notaPercurso,
      });
      removerPercursoLocal(p.id);
    } catch {
      // sem conexão de novo ou erro temporário — tenta na próxima vez que ficar online
      break;
    }
  }
}
