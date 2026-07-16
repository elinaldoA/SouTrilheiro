import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AdminRoute({ children }) {
  const { usuario, carregando } = useAuth();

  if (carregando) return <p className="state-message">Carregando…</p>;

  if (!usuario?.is_admin) {
    return (
      <p className="state-message">
        Você não tem acesso ao backoffice. <Link to="/">Voltar</Link>
      </p>
    );
  }

  return children;
}
