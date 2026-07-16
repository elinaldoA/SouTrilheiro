import { useEffect, useState } from 'react';
import { buscarMetricasDashboard } from '../../api/admin';

const CARDS = [
  { chave: 'total_usuarios', rotulo: 'Usuários' },
  { chave: 'total_admins', rotulo: 'Admins' },
  { chave: 'total_usuarios_banidos', rotulo: 'Banidos' },
  { chave: 'total_trilhas_publicadas', rotulo: 'Trilhas publicadas' },
  { chave: 'total_trilhas_pendentes', rotulo: 'Trilhas pendentes' },
  { chave: 'total_denuncias_pendentes', rotulo: 'Denúncias pendentes' },
  { chave: 'total_percursos', rotulo: 'Percursos' },
  { chave: 'total_avaliacoes', rotulo: 'Avaliações' },
  { chave: 'total_fotos', rotulo: 'Fotos' },
  { chave: 'total_videos', rotulo: 'Vídeos' },
  { chave: 'total_feed_comentarios', rotulo: 'Comentários no feed' },
];

function formatarDiaCurto(iso) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function GraficoNovosUsuarios({ serie }) {
  if (serie.length === 0) {
    return <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Nenhum usuário novo nos últimos 30 dias.</p>;
  }

  const maxTotal = Math.max(1, ...serie.map((d) => d.total));

  return (
    <>
      <div className="admin-chart" role="img" aria-label="Novos usuários por dia nos últimos 30 dias">
        {serie.map((d) => (
          <div
            key={d.dia}
            className="admin-chart-bar"
            style={{ height: `${Math.max(6, (d.total / maxTotal) * 100)}%` }}
            title={`${formatarDiaCurto(d.dia)}: ${d.total} novo(s) usuário(s)`}
          />
        ))}
      </div>
      <div className="admin-chart-eixo">
        <span>{formatarDiaCurto(serie[0].dia)}</span>
        <span>{formatarDiaCurto(serie[serie.length - 1].dia)}</span>
      </div>
      <details className="admin-chart-tabela">
        <summary>Ver como tabela</summary>
        <table>
          <thead>
            <tr>
              <th>Dia</th>
              <th>Novos usuários</th>
            </tr>
          </thead>
          <tbody>
            {serie.map((d) => (
              <tr key={d.dia}>
                <td>{formatarDiaCurto(d.dia)}</td>
                <td>{d.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </>
  );
}

export default function AdminDashboard() {
  const [metricas, setMetricas] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    let cancelado = false;
    buscarMetricasDashboard()
      .then((m) => {
        if (!cancelado) setMetricas(m);
      })
      .catch((e) => {
        if (!cancelado) setErro(e.message ?? 'Não foi possível carregar as métricas.');
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  if (carregando) return <p className="state-message">Carregando métricas…</p>;
  if (erro) return <p className="state-message">{erro}</p>;

  const serie = metricas.novos_usuarios_por_dia ?? [];

  return (
    <div className="admin-page">
      <h1>Dashboard</h1>

      <div className="admin-stat-grid">
        {CARDS.map((c) => (
          <div key={c.chave} className="stat-tile">
            <div className="stat-tile-num">{metricas[c.chave] ?? 0}</div>
            <div className="stat-tile-cap">{c.rotulo}</div>
          </div>
        ))}
      </div>

      <div className="admin-card">
        <h2>Novos usuários (30 dias)</h2>
        <GraficoNovosUsuarios serie={serie} />
      </div>
    </div>
  );
}
