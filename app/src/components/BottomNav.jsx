import { NavLink } from 'react-router-dom';
import { useNotificacoes } from '../context/NotificacoesContext';
import { useChatBadge } from '../context/ChatBadgeContext';
import { useAuth } from '../context/AuthContext';

const propsBase = {
  width: 20,
  height: 20,
  viewBox: '0 0 20 20',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

function IconBuscar() {
  return (
    <svg {...propsBase}>
      <circle cx="8.5" cy="8.5" r="5.5" />
      <line x1="16.5" y1="16.5" x2="12.6" y2="12.6" />
    </svg>
  );
}

function IconGravar() {
  return (
    <svg {...propsBase}>
      <circle cx="10" cy="10" r="7" />
      <circle cx="10" cy="10" r="2.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconFeed() {
  return (
    <svg {...propsBase}>
      <path d="M4 6.5h12M4 10h8M4 13.5h10" />
    </svg>
  );
}

function IconChat() {
  return (
    <svg {...propsBase}>
      <path d="M3 4.5h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H8l-3.6 3v-3H3a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Z" />
    </svg>
  );
}

function IconHistorico() {
  return (
    <svg {...propsBase}>
      <circle cx="10" cy="10" r="7" />
      <path d="M10 6v4l3 2" />
    </svg>
  );
}

function IconPainel() {
  return (
    <svg {...propsBase}>
      <rect x="3" y="3" width="6" height="6" rx="1" />
      <rect x="11" y="3" width="6" height="6" rx="1" />
      <rect x="3" y="11" width="6" height="6" rx="1" />
      <rect x="11" y="11" width="6" height="6" rx="1" />
    </svg>
  );
}

const ITEM_BUSCAR = { to: '/buscar', label: 'Buscar', Icone: IconBuscar };

const ITENS_BASE = [
  { to: '/feed', label: 'Feed', Icone: IconFeed },
  { to: '/chat', label: 'Chat', Icone: IconChat },
  { to: '/gravar', label: 'Gravar', Icone: IconGravar },
  { to: '/historico', label: 'Histórico', Icone: IconHistorico },
];

export function useNavItems() {
  const { temAtividadeNova } = useNotificacoes();
  const { totalNaoLidas } = useChatBadge();
  const { ehGuiaAprovado } = useAuth();

  let itemInicial = { to: '/', label: 'Buscar', Icone: IconBuscar };
  let itens = ITENS_BASE;
  if (ehGuiaAprovado) {
    itemInicial = { to: '/', label: 'Painel', Icone: IconPainel };
    itens = [ITEM_BUSCAR, ...ITENS_BASE];
  }

  return { itens: [itemInicial, ...itens], temAtividadeNova, totalNaoLidas };
}

export default function BottomNav() {
  const { itens, temAtividadeNova, totalNaoLidas } = useNavItems();

  return (
    <nav className="bottom-nav">
      {itens.map(({ to, label, Icone }) => (
        <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => (isActive ? 'active' : undefined)}>
          <span style={{ position: 'relative' }}>
            <Icone />
            {to === '/feed' && temAtividadeNova && (
              <span
                aria-label="Atividade nova"
                style={{
                  position: 'absolute',
                  top: -2,
                  right: -3,
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: 'var(--accent)',
                }}
              />
            )}
            {to === '/chat' && totalNaoLidas > 0 && (
              <span
                aria-label={`${totalNaoLidas} mensagens não lidas`}
                style={{
                  position: 'absolute',
                  top: -6,
                  right: -10,
                  minWidth: 15,
                  height: 15,
                  padding: '0 3px',
                  borderRadius: 999,
                  background: 'var(--p0)',
                  color: '#fff',
                  fontSize: '0.58rem',
                  fontWeight: 700,
                  fontFamily: 'var(--mono)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1,
                }}
              >
                {totalNaoLidas > 99 ? '99+' : totalNaoLidas}
              </span>
            )}
          </span>
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
