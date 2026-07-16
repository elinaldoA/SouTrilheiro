# SouTrilheiro

SouTrilheiro é um PWA (Progressive Web App) para quem gosta de caminhar, pedalar ou correr em trilhas na natureza. A proposta é reunir num só lugar tudo que um trilheiro precisa antes, durante e depois de uma trilha: descobrir trilhas próximas, se guiar por elas no mapa, registrar o próprio percurso e acompanhar a evolução ao longo do tempo — além de uma camada social completa (feed, stories, chat, seguir outros trilheiros), um papel de guia para quem organiza saídas em grupo, e um backoffice de administração e moderação por trás de tudo isso.

## O que o app faz

**Trilhas**
- Buscar trilhas por proximidade e filtros (dificuldade, distância, categoria, estado, gratuita/paga).
- Ver o traçado no mapa antes de sair de casa (Leaflet + tiles MapTiler).
- Cadastrar trilha nova — guias aprovados publicam direto, os demais entram como pendente de revisão.
- Avaliar com estrelas, comentar (dicas/condições/alertas por km), reportar denúncias, ver fotos e vídeos.

**Percursos**
- Gravar o próprio percurso via GPS, com pausar/retomar e indicador de sinal fraco.
- Funciona **offline-first**: sem login ou sem rede, o percurso é salvo em `localStorage` e sincronizado depois que a conexão volta.
- Histórico com estatísticas agregadas, badges de conquista, e exportação/leitura de GPX.
- Sugerir o próprio percurso gravado como traçado oficial da trilha (fica pendente até um guia/admin aprovar).

**Comunidade e feed**
- Feed cronológico dos posts de quem o usuário segue (percursos, avaliações, fotos, vídeos), com stories de 24h.
- Curtidas com reações, comentários, hashtags, marcação e menção de pessoas, itens salvos.
- Seguir outros trilheiros, ver perfil público e estatísticas, sugestões de quem seguir.

**Chat**
- Conversas diretas e em grupo, em tempo real (Supabase Realtime), com indicador de digitando e presença online.
- Anexos, edição e exclusão de mensagem, confirmação de leitura. Criar grupo é restrito a admins e guias aprovados.
- Regras de "apagar para todos" variam por papel: admin sempre pode; guia aprovado tem o mesmo poder que um admin numa conversa direta com um usuário comum.

**Guias e saídas guiadas**
- Usuário pode solicitar virar guia; aprovação é feita por um admin.
- Guia aprovado publica e gerencia suas próprias trilhas, e cria saídas guiadas com vagas e inscrição de participantes.

**Moderação** (`/moderacao`, tela de usuário com guard `is_admin` — não faz parte do backoffice em `/admin`)
- Fila de trilhas pendentes, denúncias, pedidos de guia e traçados propostos para aprovar/rejeitar.

**Backoffice** (`/admin`, exige `usuario.is_admin`)
- Dashboard com métricas agregadas (usuários, trilhas, percursos, avaliações, denúncias pendentes) e gráfico de novos usuários.
- Gestão de usuários: promover/remover admin, banir/desbanir com motivo.
- Gestão de conteúdo por tipo (percursos, avaliações, fotos, vídeos, comentários) e visão do feed/stories global (inclusive stories expirados).
- Supervisão de todas as conversas do site, incluindo DMs das quais o admin não participa — o admin pode inclusive enviar mensagens em qualquer conversa.
- Configurações: categorias de trilha (CRUD) e campo de comissão da plataforma — hoje só um valor de referência, o app ainda **não processa pagamentos**.
- Alternador de tema claro/escuro.

**Infraestrutura de PWA**
- Instalável, uso offline de mapas/percursos/trilhas salvos, sincronização automática ao reconectar.
- Push notifications via Web Push (Edge Function dedicada).

## Papéis de usuário

| Papel | Como se torna | Principais poderes extras |
|---|---|---|
| Comum | padrão ao criar conta | cadastra trilha (fica pendente), grava percursos, participa da comunidade e do chat |
| Guia | solicita em `/perfil`, aprovado por um admin | publica/gerencia trilhas próprias direto, cria saídas guiadas, poder de moderação em DMs com usuários comuns |
| Admin | definido manualmente (`usuarios.is_admin`) | acesso total ao `/admin`, aprova/rejeita conteúdo e guias, modera qualquer conversa |

## Público-alvo

Pessoas que praticam atividades ao ar livre em trilhas — trekking, caminhada, corrida ou ciclismo — e querem tanto planejar a próxima trilha quanto guardar um histórico de tudo que já percorreram, contribuindo com a comunidade de outros trilheiros no caminho.

## Arquitetura

Sem servidor de aplicação próprio: o frontend fala direto com o Supabase (`@supabase/supabase-js`), e a autorização vive inteiramente no banco (RLS + funções `security definer`) — não há checagem de papel repetida no cliente antes de cada escrita sensível, só roteamento de UI. A única peça de backend próprio é uma Edge Function para push notifications.

```
Navegador (React 18 + Vite, PWA)
   │  @supabase/supabase-js
   ▼
Supabase — Postgres (RLS) · Auth · Storage · Realtime
   │  trigger de app / chamada explícita
   ▼
Edge Function enviar-push (Deno) ──► Web Push (VAPID) ──► dispositivo do usuário
```

- **Realtime** é usado principalmente no chat (mensagens, edições, exclusões, leituras, indicador de digitando via broadcast) e em presença online; fora daí, poucos módulos assinam mudanças ao vivo.
- **Leituras agregadas** (contagem de curtidas, comentários, vagas de saída, mensagens não lidas, métricas do dashboard) passam por funções Postgres (`curtidas_resumo`, `comentarios_contagem`, `saidas_vagas_ocupadas`, `admin_metricas_dashboard` etc.) em vez de N+1 queries do cliente.
- **Offline** é implementado com `localStorage` puro (não IndexedDB, apesar de ser um PWA): percursos gravados sem rede/login e trilhas salvas para visualização offline ficam lá até sincronizar.

## Segurança

- **RLS em toda tabela sensível**, evoluída de forma incremental — dezenas de migrations existem só para corrigir ou estender política de acesso conforme cada feature nova chegava (chat, stories, feed sem trilha, gestão do admin sobre conteúdo alheio).
- **Rate limit no banco**: trigger genérico `impede_flood()` limita denúncias (10/hora/usuário) e mensagens de chat (40/minuto/usuário) — vale mesmo se alguém chamar a API do Supabase direto, sem passar pela UI.
- **Auto-elevação bloqueada**: trigger em `usuarios` impede um usuário de virar admin ou se desbanir sozinho, mesmo com acesso de update na própria linha.
- **Upload validado pelo conteúdo real do arquivo**, não pela extensão (`lib/uploadSeguro.js`), com limites espelhados no bucket do Storage; anexos de chat que não são imagem/vídeo são forçados a `application/octet-stream` para o navegador nunca renderizar um HTML/SVG disfarçado.
- **Edge Function com CORS restrito** a uma allow-list de origens (produção + dev local) e exige JWT válido de um usuário conhecido.

## Modelo de dados

28 tabelas Postgres (`database/schema.sql` + ~35 migrations incrementais), agrupadas por domínio:

| Domínio | Tabelas |
|---|---|
| Identidade | `usuarios`, `guias` |
| Trilhas / percursos | `trilhas`, `categorias_trilha`, `percursos`, `tracados_propostos`, `saidas_guiadas`, `inscricoes_saida` |
| Comunidade / feed | `avaliacoes`, `comentarios`, `feed_comentarios`, `curtidas`, `fotos`, `videos`, `stories`, `story_visualizacoes`, `salvos`, `seguidores`, `marcacoes`, `mencoes` |
| Chat | `conversas`, `mensagens`, `conversa_participantes`, `conversa_leituras`, `conversa_limpezas`, `mensagem_ocultacoes` |
| Moderação / sistema | `denuncias`, `push_inscricoes`, `configuracoes_app` |

Detalhe de colunas, relacionamentos e políticas de RLS de cada tabela está nos próprios arquivos SQL (ver [Estrutura do projeto](#estrutura-do-projeto)) — não duplicado aqui para não desatualizar.

## Stack

- **Frontend**: React 18 + Vite, PWA via `vite-plugin-pwa` (service worker com cache offline de dados do Supabase e tiles de mapa).
- **Mapa**: Leaflet + react-leaflet, tiles do MapTiler.
- **Backend**: Supabase (Postgres, Auth, Storage, Realtime) acessado diretamente do frontend via `@supabase/supabase-js` — não há um servidor de aplicação próprio.
- **Funções server-side**: uma Supabase Edge Function (`supabase/functions/enviar-push`) para envio de push notifications.
- **Testes**: Vitest, com `@testing-library/react` para componentes.
- **Lint**: ESLint (flat config).

## Estrutura do projeto

```
app/
  src/
    api/         chamadas ao Supabase, um módulo por domínio/tabela (~26 arquivos)
    components/  componentes reutilizáveis; components/admin/ é exclusivo do backoffice
    context/     AuthContext, CategoriasContext, ChatBadgeContext, NotificacoesContext,
                 PresenceContext, ThemeContext
    lib/         funções puras (geo, gpx, formatação, badges, upload seguro, sync offline etc.)
    pages/       uma página por rota (ver App.jsx); pages/admin/ é o backoffice
supabase/
  functions/     Edge Functions do Supabase (Deno) — enviar-push
database/        migrations e schema SQL (não versionado no git — histórico local apenas)
```

## Rodando localmente

Pré-requisitos: Node 20+, uma instância Supabase (projeto próprio ou de desenvolvimento) e uma API key do MapTiler.

```bash
cd app
cp .env.example .env   # preencha VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_MAPTILER_KEY, VITE_VAPID_PUBLIC_KEY
npm install
npm run dev             # sobe o servidor de desenvolvimento (Vite)
```

Outros comandos úteis, todos rodados dentro de `app/`:

```bash
npm test        # roda os testes (Vitest)
npm run lint    # roda o ESLint
npm run build   # gera o build de produção em app/dist
```

O CI (`.github/workflows/ci.yml`) roda lint, testes e build a cada push/PR na `master`. A cobertura de testes hoje é concentrada em `lib/` e componentes isolados (11 suítes) — as regras de negócio em `api/` e as políticas de RLS não têm teste automatizado; a superfície é coberta principalmente por revisão manual e pelas próprias constraints/triggers do banco.

## Deploy

O deploy do frontend é automatizado: `.github/workflows/deploy-pages.yml` builda o app e publica `app/dist` no GitHub Pages a cada push na `master` (as variáveis de ambiente vêm de secrets do repositório). O build também pode ser gerado manualmente (`npm run build`, dentro de `app/`) e hospedado em qualquer serviço de arquivos estáticos (Netlify, Vercel, Cloudflare Pages etc.), configurando lá as mesmas variáveis do `.env`. A Edge Function em `supabase/functions/enviar-push` é publicada separadamente via `supabase functions deploy` (Supabase CLI). Migrations em `database/` precisam ser aplicadas manualmente, na ordem correta, no projeto Supabase de destino.

## Estado atual e limitações conhecidas

- O traçado completo de trilhas cadastradas pela comunidade ainda é simplificado e deve ser aprimorado em versões futuras.
- `database/` não é gerenciado por uma ferramenta de migration formal: são arquivos SQL soltos, propositalmente fora do git, aplicados manualmente — não há garantia de que o schema local reflita exatamente o de produção.
- O campo de "comissão da plataforma" em `/admin/configuracoes` já existe no banco e na UI, mas nenhum fluxo de pagamento foi implementado ainda — é infraestrutura para uma feature futura.
- `AdminPerfil.jsx` é essencialmente um wrapper trivial da página `Perfil` de usuário comum dentro do layout do backoffice.
- O offline-first usa `localStorage` (não IndexedDB) para percursos e trilhas salvas — suficiente para o volume atual, mas com limite de tamanho do navegador.
