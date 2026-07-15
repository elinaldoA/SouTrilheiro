import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNavItems } from './BottomNav';
import Avatar from './Avatar';
import ThemeToggle from './ThemeToggle';

export default function Sidebar() {
  const { itens, temAtividadeNova, totalNaoLidas } = useNavItems();
  const { usuario } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img src={`${import.meta.env.BASE_URL}icons/logo.jpeg`} alt="" />
        <span>SouTrilheiro</span>
      </div>

      <nav className="sidebar-nav">
        {itens.map(({ to, label, Icone }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          >
            <Icone />
            <span>{label}</span>
            {to === '/feed' && temAtividadeNova && <span className="sidebar-link-dot" aria-label="Atividade nova" />}
            {to === '/chat' && totalNaoLidas > 0 && (
              <span className="sidebar-link-badge">{totalNaoLidas > 99 ? '99+' : totalNaoLidas}</span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        {usuario && (
          <NavLink to="/perfil" className="sidebar-user">
            <Avatar nome={usuario.nome} url={usuario.avatar_url} size={36} />
            <span className="sidebar-user-name">{usuario.nome}</span>
          </NavLink>
        )}
        <ThemeToggle />
      </div>
    </aside>
  );
}
