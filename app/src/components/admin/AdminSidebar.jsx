import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../Avatar';

const propsBase = {
  width: 18,
  height: 18,
  viewBox: '0 0 20 20',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

function IconDashboard() {
  return (
    <svg {...propsBase}>
      <rect x="3" y="3" width="6" height="6" rx="1" />
      <rect x="11" y="3" width="6" height="6" rx="1" />
      <rect x="3" y="11" width="6" height="6" rx="1" />
      <rect x="11" y="11" width="6" height="6" rx="1" />
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

function IconChats() {
  return (
    <svg {...propsBase}>
      <path d="M3 4.5h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H8l-3.6 3v-3H3a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Z" />
    </svg>
  );
}

function IconUsuarios() {
  return (
    <svg {...propsBase}>
      <circle cx="7.5" cy="7" r="3" />
      <path d="M2.5 17c0-3 2.2-5 5-5s5 2 5 5" />
      <circle cx="14.5" cy="8" r="2.3" />
      <path d="M13 17c.2-2.2 1.6-3.8 3.7-3.8 1 0 1.8.3 2.4.9" />
    </svg>
  );
}

function IconConteudo() {
  return (
    <svg {...propsBase}>
      <rect x="3" y="3.5" width="14" height="13" rx="1.5" />
      <path d="M6 8h8M6 11h8M6 14h5" />
    </svg>
  );
}

function IconConfiguracoes() {
  return (
    <svg {...propsBase}>
      <circle cx="10" cy="10" r="2.6" />
      <path d="M10 3v2.1M10 14.9V17M3 10h2.1M14.9 10H17M5 5l1.5 1.5M13.5 13.5 15 15M15 5l-1.5 1.5M6.5 13.5 5 15" />
    </svg>
  );
}

function IconModeracao() {
  return (
    <svg {...propsBase}>
      <path d="M10 2.5 16.5 5v5c0 4-2.8 6.6-6.5 7.5-3.7-.9-6.5-3.5-6.5-7.5V5Z" />
      <path d="M7.3 10 9.3 12l3.4-4" />
    </svg>
  );
}

const ITENS = [
  { to: '/admin', label: 'Dashboard', Icone: IconDashboard, fim: true },
  { to: '/admin/feed', label: 'Feed', Icone: IconFeed },
  { to: '/admin/chats', label: 'Chats', Icone: IconChats },
  { to: '/admin/usuarios', label: 'Usuários', Icone: IconUsuarios },
  { to: '/admin/conteudo', label: 'Conteúdo', Icone: IconConteudo },
  { to: '/admin/moderacao', label: 'Moderação', Icone: IconModeracao },
  { to: '/admin/configuracoes', label: 'Configurações', Icone: IconConfiguracoes },
];

export default function AdminSidebar() {
  const { usuario } = useAuth();

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-brand">
        <img src={`${import.meta.env.BASE_URL}icons/logo.jpeg`} alt="" />
        <span>Backoffice</span>
      </div>

      <nav className="admin-sidebar-nav">
        {ITENS.map(({ to, label, Icone, fim }) => (
          <NavLink key={to} to={to} end={fim} className={({ isActive }) => `admin-sidebar-link${isActive ? ' active' : ''}`}>
            <Icone />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="admin-sidebar-footer">
        {usuario && (
          <NavLink
            to="/admin/perfil"
            className={({ isActive }) => `admin-sidebar-link admin-sidebar-user${isActive ? ' active' : ''}`}
          >
            <Avatar nome={usuario.nome} url={usuario.avatar_url} size={32} />
            <span className="admin-sidebar-user-name">{usuario.nome}</span>
          </NavLink>
        )}
      </div>
    </aside>
  );
}
