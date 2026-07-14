import { useTheme } from '../context/ThemeContext';

const propsBase = {
  width: 19,
  height: 19,
  viewBox: '0 0 20 20',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

function IconSol() {
  return (
    <svg {...propsBase}>
      <circle cx="10" cy="10" r="3.6" />
      <path d="M10 2.5v2M10 15.5v2M17.5 10h-2M4.5 10h-2M15.3 4.7l-1.4 1.4M6.1 13.9l-1.4 1.4M15.3 15.3l-1.4-1.4M6.1 6.1 4.7 4.7" />
    </svg>
  );
}

function IconLua() {
  return (
    <svg {...propsBase}>
      <path d="M16.5 12.3A7 7 0 1 1 7.7 3.5a5.6 5.6 0 0 0 8.8 8.8Z" />
    </svg>
  );
}

export default function ThemeToggle() {
  const { tema, alternar } = useTheme();

  return (
    <button
      type="button"
      onClick={alternar}
      aria-label={tema === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
      title={tema === 'dark' ? 'Modo claro' : 'Modo escuro'}
      style={{
        marginLeft: 'auto',
        background: 'none',
        border: '1px solid var(--line)',
        borderRadius: 8,
        width: 34,
        height: 34,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--muted)',
        flex: 'none',
      }}
    >
      {tema === 'dark' ? <IconSol /> : <IconLua />}
    </button>
  );
}
