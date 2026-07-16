import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listarConversasAdmin } from '../../api/admin';
import Avatar from '../../components/Avatar';

function formatarDataHora(iso) {
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function AdminChats() {
  const [conversas, setConversas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    listarConversasAdmin()
      .then(setConversas)
      .catch((e) => setErro(e.message ?? 'Não foi possível carregar as conversas.'))
      .finally(() => setCarregando(false));
  }, []);

  return (
    <div className="admin-page">
      <h1>Chats</h1>
      <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: 0 }}>
        Todas as conversas do site, diretas e em grupo — o admin vê e modera qualquer uma, mesmo sem participar dela.
      </p>

      {carregando && <p className="state-message">Carregando…</p>}
      {erro && <p className="state-message">{erro}</p>}

      {!carregando && !erro && (
        <div className="admin-list">
          {conversas.map((c) => (
            <Link key={c.id} to={`/admin/chats/${c.id}`} className="admin-card admin-card-row admin-chat-row">
              <div className="admin-card-row-info">
                <div className="admin-card-row-titulo" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {c.tipo === 'grupo' && <span className="mini-badge">Grupo</span>}
                  <span>{c.nome}</span>
                  {c.fechado && (
                    <span className="mini-badge" style={{ color: 'var(--p1)', borderColor: 'var(--p1)' }}>
                      fechado
                    </span>
                  )}
                </div>
                <p className="admin-card-row-meta">
                  {c.totalMembros} membro{c.totalMembros === 1 ? '' : 's'}
                  {c.ultimaMensagem && ` · última mensagem em ${formatarDataHora(c.ultimaMensagem.criado_em)}`}
                </p>
              </div>
              <div className="admin-chat-avatares">
                {c.membros.slice(0, 4).map((m) => (
                  <Avatar key={m.id} nome={m.nome} url={m.avatar_url} size={26} />
                ))}
              </div>
            </Link>
          ))}
          {conversas.length === 0 && <p className="state-message">Nenhuma conversa ainda.</p>}
        </div>
      )}
    </div>
  );
}
