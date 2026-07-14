export default function PapelBadge({ ehAdmin, ehGuia }) {
  if (ehAdmin) {
    return (
      <span className="mini-badge" style={{ color: 'var(--p0)', borderColor: 'var(--p0)' }}>
        Admin
      </span>
    );
  }
  if (ehGuia) {
    return (
      <span className="mini-badge" style={{ color: 'var(--accent)', borderColor: 'var(--accent)' }}>
        Guia
      </span>
    );
  }
  return null;
}
