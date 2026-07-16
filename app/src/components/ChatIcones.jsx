export function IconEnviar() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
      <path d="M2.5 10 17 3.3 12.8 17l-3.3-5.5L2.5 10Z" />
    </svg>
  );
}

export function IconSom({ mudo }) {
  if (mudo) {
    return (
      <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 8v4h3l4 4V4L6 8H3Z" fill="currentColor" stroke="none" />
        <path d="m13 7 4 6M17 7l-4 6" />
      </svg>
    );
  }
  return (
    <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8v4h3l4 4V4L6 8H3Z" fill="currentColor" stroke="none" />
      <path d="M13.5 7.2a4 4 0 0 1 0 5.6M16 4.7a7.5 7.5 0 0 1 0 10.6" />
    </svg>
  );
}

export function IconChecagem({ dupla }) {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m2.5 10.5 3.2 3.2L11 8.4" />
      {dupla && <path d="m8 10.5 3.2 3.2L16.7 8.4" />}
    </svg>
  );
}

export function IconClipe() {
  return (
    <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 6.5 8 13a2.5 2.5 0 1 0 3.5 3.5L18 10a4.5 4.5 0 1 0-6.4-6.4L4.9 10.3a6 6 0 0 0 8.5 8.5" />
    </svg>
  );
}

export function IconArquivo() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 2.5h6l4 4v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-14a1 1 0 0 1 1-1Z" />
      <path d="M11 2.5V7h4" />
    </svg>
  );
}

export function IconX() {
  return (
    <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <path d="m4 4 12 12M16 4 4 16" />
    </svg>
  );
}

export function IconLapis() {
  return (
    <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13.5 3.5 16.5 6.5 6.7 16.3 3 17l0.7-3.7L13.5 3.5Z" />
    </svg>
  );
}

export function IconOpcoes() {
  return (
    <svg width="17" height="17" viewBox="0 0 20 20" fill="currentColor">
      <circle cx="10" cy="4" r="1.6" />
      <circle cx="10" cy="10" r="1.6" />
      <circle cx="10" cy="16" r="1.6" />
    </svg>
  );
}

export function IconMais() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <path d="M10 4v12M4 10h12" />
    </svg>
  );
}
