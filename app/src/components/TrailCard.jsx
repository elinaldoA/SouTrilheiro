import { Link } from 'react-router-dom';
import { ROTULO_CATEGORIA } from '../lib/categorias';

const ROTULO_DIFICULDADE = {
  facil: 'Fácil',
  moderada: 'Moderada',
  dificil: 'Difícil',
};

function AvatarTrilha() {
  return (
    <svg width="28" height="28" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 15.5 7 6l3 4.5L12.5 7l5.5 8.5Z" />
      <circle cx="14.5" cy="5" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default function TrailCard({ trilha }) {
  return (
    <Link
      to={`/trilha/${trilha.id}`}
      className="trail-card"
      style={{
        display: 'flex',
        gap: 12,
        padding: 12,
        borderRadius: 12,
        border: '1px solid var(--line)',
        background: 'var(--surface-raised)',
        boxShadow: 'var(--shadow)',
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      {trilha.fotoUrl ? (
        <img
          src={trilha.fotoUrl}
          alt=""
          aria-hidden="true"
          style={{ width: 64, height: 64, borderRadius: 9, flex: 'none', objectFit: 'cover' }}
        />
      ) : (
        <div
          aria-hidden="true"
          style={{
            width: 64,
            height: 64,
            borderRadius: 9,
            flex: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--surface)',
            color: 'var(--line)',
          }}
        >
          <AvatarTrilha />
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, flex: 1 }}>
        <h3 style={{ fontSize: '1rem' }}>{trilha.nome}</h3>
        <span style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>
          {trilha.cidade}, {trilha.estado}
        </span>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
          <span className="mini-badge">{trilha.distancia_km} km</span>
          <span className="mini-badge">{ROTULO_DIFICULDADE[trilha.dificuldade]}</span>
          {trilha.categoria && <span className="mini-badge">{ROTULO_CATEGORIA[trilha.categoria]}</span>}
          <span className="mini-badge" style={trilha.tipo_preco === 'paga' ? { color: 'var(--accent)', borderColor: 'var(--accent)' } : undefined}>
            {trilha.tipo_preco === 'paga' ? `R$ ${Number(trilha.preco).toFixed(2)}` : 'Gratuita'}
          </span>
          {trilha.notaMedia != null && <span className="mini-badge">★ {trilha.notaMedia.toFixed(1)}</span>}
          {trilha.distanciaUsuarioKm != null && (
            <span className="mini-badge">{trilha.distanciaUsuarioKm.toFixed(1)} km de você</span>
          )}
        </div>
      </div>
    </Link>
  );
}
