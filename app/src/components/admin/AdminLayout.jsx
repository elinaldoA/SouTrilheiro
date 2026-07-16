import { Routes, Route } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminDashboard from '../../pages/admin/AdminDashboard';
import AdminFeed from '../../pages/admin/AdminFeed';
import AdminUsuarios from '../../pages/admin/AdminUsuarios';
import AdminConteudo from '../../pages/admin/AdminConteudo';
import AdminChats from '../../pages/admin/AdminChats';
import AdminChatDetalhe from '../../pages/admin/AdminChatDetalhe';
import AdminConfiguracoes from '../../pages/admin/AdminConfiguracoes';
import AdminPerfil from '../../pages/admin/AdminPerfil';
import Moderacao from '../../pages/Moderacao';
import '../../styles/admin.css';

export default function AdminLayout() {
  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        <Routes>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/feed" element={<AdminFeed />} />
          <Route path="/admin/usuarios" element={<AdminUsuarios />} />
          <Route path="/admin/conteudo" element={<AdminConteudo />} />
          <Route path="/admin/chats" element={<AdminChats />} />
          <Route path="/admin/chats/:id" element={<AdminChatDetalhe />} />
          <Route path="/admin/configuracoes" element={<AdminConfiguracoes />} />
          <Route path="/admin/moderacao" element={<Moderacao />} />
          <Route path="/admin/perfil" element={<AdminPerfil />} />
        </Routes>
      </main>
    </div>
  );
}
