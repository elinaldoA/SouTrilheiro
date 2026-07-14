export default function Avatar({ nome, url, size = 56, online }) {
  const style = { width: size, height: size };

  const imagem = url ? (
    <img src={url} alt={nome ?? 'avatar'} className="avatar" style={style} />
  ) : (
    <div className="avatar" style={style}>
      {(nome ?? '?').charAt(0).toUpperCase()}
    </div>
  );

  if (online === undefined) return imagem;

  return (
    <span style={{ position: 'relative', display: 'inline-flex', flex: 'none' }}>
      {imagem}
      {online && (
        <span
          aria-label="Online"
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: Math.max(10, size * 0.24),
            height: Math.max(10, size * 0.24),
            borderRadius: '50%',
            background: 'var(--good)',
            border: '2px solid var(--surface-raised)',
          }}
        />
      )}
    </span>
  );
}
