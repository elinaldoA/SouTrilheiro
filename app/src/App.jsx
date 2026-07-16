import { useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import Sidebar from './components/Sidebar';
import Avatar from './components/Avatar';
import AdminRoute from './components/admin/AdminRoute';
import AdminLayout from './components/admin/AdminLayout';
import Buscar from './pages/Buscar';
import DetalheTrilha from './pages/DetalheTrilha';
import Gravar from './pages/Gravar';
import Historico from './pages/Historico';
import DetalhePercurso from './pages/DetalhePercurso';
import Perfil from './pages/Perfil';
import CadastrarTrilha from './pages/CadastrarTrilha';
import PainelGuia from './pages/PainelGuia';
import Feed from './pages/Feed';
import Salvos from './pages/Salvos';
import Pessoas from './pages/Pessoas';
import Conversas from './pages/Conversas';
import Chat from './pages/Chat';
import PerfilPublico from './pages/PerfilPublico';
import Hashtag from './pages/Hashtag';
import ThemeToggle from './components/ThemeToggle';
import LoginForm from './components/LoginForm';
import RedefinirSenhaForm from './components/RedefinirSenhaForm';
import { useAuth } from './context/AuthContext';
import { sincronizarPercursosPendentes } from './lib/sincronizarPercursos';

function Home() {
  const { ehGuiaAprovado } = useAuth();
  if (ehGuiaAprovado) return <PainelGuia />;
  return <Buscar />;
}

function TelaAutenticacao({ children }) {
  return (
    <div className="auth-screen">
      <div className="auth-card">
        <img src={`${import.meta.env.BASE_URL}icons/logo.jpeg`} alt="SouTrilheiro" className="auth-logo" />
        <span className="auth-brand">SouTrilheiro</span>
        <div className="auth-form-wrap">{children}</div>
      </div>
    </div>
  );
}

export default function App() {
  const { usuario, autenticado, carregando, recuperandoSenha, erroAutenticacao, tentarNovamenteAutenticacao, contaBanida } =
    useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!usuario) return;
    sincronizarPercursosPendentes(usuario.id);
    const aoFicarOnline = () => sincronizarPercursosPendentes(usuario.id);
    window.addEventListener('online', aoFicarOnline);
    return () => window.removeEventListener('online', aoFicarOnline);
  }, [usuario]);

  if (carregando) {
    return (
      <TelaAutenticacao>
        <p className="state-message">Carregando…</p>
      </TelaAutenticacao>
    );
  }

  if (recuperandoSenha) {
    return (
      <TelaAutenticacao>
        <h1 style={{ fontSize: '1.2rem' }}>Redefinir senha</h1>
        <RedefinirSenhaForm />
      </TelaAutenticacao>
    );
  }

  if (autenticado && !usuario && erroAutenticacao) {
    return (
      <TelaAutenticacao>
        <p className="state-message">Não foi possível carregar seu perfil. Verifique sua conexão e tente novamente.</p>
        <button type="button" className="btn btn-primary" onClick={tentarNovamenteAutenticacao}>
          Tentar novamente
        </button>
      </TelaAutenticacao>
    );
  }

  if (contaBanida) {
    return (
      <TelaAutenticacao>
        <p className="state-message">
          Sua conta foi suspensa.{contaBanida.motivo ? ` Motivo: ${contaBanida.motivo}` : ''}
        </p>
      </TelaAutenticacao>
    );
  }

  if (!autenticado || !usuario) {
    return (
      <TelaAutenticacao>
        <LoginForm />
      </TelaAutenticacao>
    );
  }

  if (location.pathname.startsWith('/admin')) {
    return (
      <AdminRoute>
        <AdminLayout />
      </AdminRoute>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />

      <div className="app-shell">
        <header className="app-header">
          <Link to="/perfil" className="app-header-user">
            <Avatar nome={usuario.nome} url={usuario.avatar_url} size={32} />
            <span className="app-header-user-name">{usuario.nome}</span>
          </Link>
          <ThemeToggle />
        </header>

        <main className="app-main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/buscar" element={<Buscar />} />
            <Route path="/painel-guia" element={<PainelGuia />} />
            <Route path="/trilha/:id" element={<DetalheTrilha />} />
            <Route path="/gravar" element={<Gravar />} />
            <Route path="/gravar/:trilhaId" element={<Gravar />} />
            <Route path="/historico" element={<Historico />} />
            <Route path="/historico/:id" element={<DetalhePercurso />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/usuario/:id" element={<PerfilPublico />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/salvos" element={<Salvos />} />
            <Route path="/hashtag/:tag" element={<Hashtag />} />
            <Route path="/pessoas" element={<Pessoas />} />
            <Route path="/chat" element={<Conversas />} />
            <Route path="/chat/:id" element={<Chat />} />
            <Route path="/cadastrar-trilha" element={<CadastrarTrilha />} />
          </Routes>
        </main>

        <BottomNav />
      </div>
    </div>
  );
}
