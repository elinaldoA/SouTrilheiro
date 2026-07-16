import { useState } from 'react';
import {
  adicionarParticipantes,
  removerParticipante,
  renomearGrupo,
  fecharGrupo,
  reabrirGrupo,
  excluirGrupo,
} from '../api/chat';
import { listarUsuarios } from '../api/usuarios';
import Avatar from './Avatar';
import { IconX, IconLapis, IconMais } from './ChatIcones';

/** Painel de gestão do grupo: membros, adicionar/remover, renomear e excluir (para o admin). */
export default function PainelGrupoChat({ conversa, participantes, usuario, ehAdmin, souAdminGrupo, onFechar, onAtualizado, onSaiu, onExcluido }) {
  const [mostrarAdicionar, setMostrarAdicionar] = useState(false);
  const [candidatos, setCandidatos] = useState([]);
  const [selecionados, setSelecionados] = useState(new Set());
  const [carregandoCandidatos, setCarregandoCandidatos] = useState(false);
  const [editandoNome, setEditandoNome] = useState(false);
  const [nomeGrupo, setNomeGrupo] = useState(conversa.nome ?? '');
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState('');

  const idsAtuais = new Set(participantes.map((p) => p.id));

  // O admin geral do site manda mais que o admin do grupo: só ele pode remover
  // o próprio criador do grupo ou outro admin geral que esteja no grupo. O
  // admin do grupo remove membros comuns normalmente.
  function podeRemover(p) {
    if (!souAdminGrupo || p.id === usuario.id) return false;
    const alvoEhSuperior = p.id === conversa.criado_por || p.is_admin;
    return ehAdmin || !alvoEhSuperior;
  }

  async function abrirAdicionar() {
    setMostrarAdicionar(true);
    setErro('');
    setCarregandoCandidatos(true);
    try {
      const todos = await listarUsuarios(usuario.id);
      setCandidatos(todos.filter((u) => !idsAtuais.has(u.id)));
    } finally {
      setCarregandoCandidatos(false);
    }
  }

  function alternarSelecao(id) {
    setSelecionados((atuais) => {
      const novo = new Set(atuais);
      novo.has(id) ? novo.delete(id) : novo.add(id);
      return novo;
    });
  }

  async function confirmarAdicionar() {
    if (selecionados.size === 0) return;
    setProcessando(true);
    setErro('');
    try {
      await adicionarParticipantes(conversa.id, [...selecionados]);
      await onAtualizado();
      setMostrarAdicionar(false);
      setSelecionados(new Set());
    } catch (e) {
      setErro(e.message ?? 'Não foi possível adicionar os membros.');
    } finally {
      setProcessando(false);
    }
  }

  async function remover(membroId) {
    if (!window.confirm('Remover este membro do grupo?')) return;
    setProcessando(true);
    try {
      await removerParticipante(conversa.id, membroId);
      await onAtualizado();
    } finally {
      setProcessando(false);
    }
  }

  async function sair() {
    if (!window.confirm('Sair deste grupo?')) return;
    setProcessando(true);
    try {
      await removerParticipante(conversa.id, usuario.id);
      onSaiu();
    } finally {
      setProcessando(false);
    }
  }

  async function excluir() {
    if (!window.confirm('Excluir este grupo para todos os participantes? Essa ação não pode ser desfeita.')) return;
    setProcessando(true);
    try {
      await excluirGrupo(conversa.id);
      onExcluido();
    } finally {
      setProcessando(false);
    }
  }

  async function alternarFechado() {
    setProcessando(true);
    setErro('');
    try {
      if (conversa.fechado) await reabrirGrupo(conversa.id);
      else await fecharGrupo(conversa.id);
      await onAtualizado();
    } catch (e) {
      setErro(e.message ?? 'Não foi possível alterar o grupo.');
    } finally {
      setProcessando(false);
    }
  }

  async function salvarNome(e) {
    e.preventDefault();
    const valor = nomeGrupo.trim();
    if (!valor || valor === conversa.nome) {
      setEditandoNome(false);
      return;
    }
    setProcessando(true);
    setErro('');
    try {
      await renomearGrupo(conversa.id, valor);
      await onAtualizado();
      setEditandoNome(false);
    } catch (e2) {
      setErro(e2.message ?? 'Não foi possível renomear o grupo.');
    } finally {
      setProcessando(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 20, background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'flex-end' }} onClick={onFechar}>
      <div
        className="feed-card"
        style={{ width: 320, maxWidth: '100%', height: '100%', overflowY: 'auto', borderRadius: 0, padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <strong style={{ fontSize: '1rem' }}>Informações do grupo</strong>
          <button type="button" className="painel-icone-btn" onClick={onFechar} aria-label="Fechar">
            <IconX />
          </button>
        </div>

        {editandoNome ? (
          <form onSubmit={salvarNome} style={{ display: 'flex', gap: 6 }}>
            <input className="field" value={nomeGrupo} onChange={(e) => setNomeGrupo(e.target.value)} autoFocus style={{ flex: 1 }} />
            <button type="submit" className="btn btn-sm btn-primary" disabled={processando}>Salvar</button>
            <button type="button" className="btn btn-sm btn-outline" onClick={() => { setEditandoNome(false); setNomeGrupo(conversa.nome ?? ''); }}>Cancelar</button>
          </form>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 600 }}>{conversa.nome}</span>
            {souAdminGrupo && (
              <button type="button" className="painel-icone-btn" onClick={() => setEditandoNome(true)} aria-label="Renomear grupo" title="Renomear grupo">
                <IconLapis />
              </button>
            )}
          </div>
        )}

        {erro && <p style={{ color: 'var(--p0)', fontSize: '0.8rem', margin: 0 }}>{erro}</p>}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{participantes.length} membros</span>
          {souAdminGrupo && (
            <button type="button" className="btn btn-sm btn-outline" onClick={abrirAdicionar} disabled={processando}>
              <IconMais /> Adicionar
            </button>
          )}
        </div>

        {mostrarAdicionar && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, border: '1px solid var(--line)', borderRadius: 10, padding: 10 }}>
            {carregandoCandidatos && <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Carregando trilheiros…</span>}
            {!carregandoCandidatos && candidatos.length === 0 && (
              <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Todos os trilheiros já estão no grupo.</span>
            )}
            {!carregandoCandidatos && candidatos.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto' }}>
                {candidatos.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => alternarSelecao(u.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: 6,
                      borderRadius: 8,
                      border: `1px solid ${selecionados.has(u.id) ? 'var(--accent)' : 'var(--line)'}`,
                      background: 'var(--surface-raised)',
                      textAlign: 'left',
                    }}
                  >
                    <Avatar nome={u.nome} url={u.avatar_url} size={26} />
                    <span style={{ fontSize: '0.84rem', flex: 1 }}>{u.nome}</span>
                    {selecionados.has(u.id) && <span style={{ color: 'var(--accent)' }}>✓</span>}
                  </button>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-sm btn-outline" onClick={() => setMostrarAdicionar(false)}>Cancelar</button>
              <button type="button" className="btn btn-sm btn-primary" onClick={confirmarAdicionar} disabled={processando || selecionados.size === 0}>
                Adicionar {selecionados.size > 0 ? `(${selecionados.size})` : ''}
              </button>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {participantes.map((p) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar nome={p.nome} url={p.avatar_url} size={30} />
              <span style={{ fontSize: '0.86rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.nome}
                {p.id === usuario.id && ' (você)'}
              </span>
              {p.id === conversa.criado_por && <span className="mini-badge">Admin</span>}
              {p.id !== conversa.criado_por && p.is_admin && <span className="mini-badge">Admin do site</span>}
              {podeRemover(p) && (
                <button type="button" className="painel-icone-btn" onClick={() => remover(p.id)} disabled={processando} aria-label={`Remover ${p.nome}`} title="Remover do grupo">
                  <IconX />
                </button>
              )}
            </div>
          ))}
        </div>

        {conversa.fechado && (
          <p style={{ fontSize: '0.78rem', color: 'var(--muted)', margin: 0 }}>
            Grupo fechado: só o admin pode enviar mensagens.
          </p>
        )}

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {souAdminGrupo && (
            <button type="button" className="btn btn-sm btn-outline" onClick={alternarFechado} disabled={processando}>
              {conversa.fechado ? 'Reabrir grupo' : 'Fechar grupo'}
            </button>
          )}
          <button type="button" className="btn btn-sm btn-outline" onClick={sair} disabled={processando}>
            Sair do grupo
          </button>
          {souAdminGrupo && (
            <button type="button" className="btn btn-sm btn-perigo" onClick={excluir} disabled={processando}>
              Excluir grupo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
