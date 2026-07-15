import { Link } from 'react-router-dom';
import TrailMap from './TrailMap';

function formatarData(iso) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export default function TracadoPropostoCard({ proposta, onAprovar, onRejeitar }) {
  return (
    <div
      style={{
        border: '1px solid var(--line)',
        borderRadius: 10,
        padding: 12,
        background: 'var(--surface-raised)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div>
        <Link to={`/trilha/${proposta.trilha_id}`} style={{ fontWeight: 600, fontSize: '0.92rem' }}>
          {proposta.trilhas?.nome ?? 'Trilha'}
        </Link>
        <p style={{ margin: '2px 0 0', color: 'var(--muted)', fontSize: '0.8rem' }}>
          proposto por {proposta.usuarios?.nome ?? '—'} em {formatarData(proposta.criado_em)}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 200px', minWidth: 160 }}>
          <p style={{ margin: '0 0 4px', color: 'var(--muted)', fontSize: '0.76rem' }}>Traçado atual</p>
          <TrailMap path={proposta.trilhas?.path_geojson} alturaPx={160} />
        </div>
        <div style={{ flex: '1 1 200px', minWidth: 160 }}>
          <p style={{ margin: '0 0 4px', color: 'var(--muted)', fontSize: '0.76rem' }}>Traçado proposto</p>
          <TrailMap path={proposta.path_geojson} alturaPx={160} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" className="btn btn-outline" onClick={() => onRejeitar(proposta)}>
          Rejeitar
        </button>
        <button type="button" className="btn btn-primary" onClick={() => onAprovar(proposta)}>
          Aprovar
        </button>
      </div>
    </div>
  );
}
