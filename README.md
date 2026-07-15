# SouTrilheiro

SouTrilheiro é um PWA (Progressive Web App) para quem gosta de caminhar, pedalar ou correr em trilhas na natureza. A proposta é reunir num só lugar tudo que um trilheiro precisa antes, durante e depois de uma trilha: descobrir trilhas próximas, se guiar por elas no mapa, registrar o próprio percurso e acompanhar a evolução ao longo do tempo — além de contar com informações e experiências de quem já passou por lá.

## Para que o app serve

- **Descobrir trilhas**: buscar trilhas por proximidade e filtros (dificuldade, distância, tipo de percurso etc.).
- **Visualizar no mapa**: ver o traçado da trilha antes de sair de casa, com mapa interativo.
- **Registrar o percurso**: gravar a própria caminhada/pedalada via GPS, com opção de pausar e retomar durante o trajeto.
- **Acompanhar o histórico**: consultar percursos já feitos e estatísticas agregadas (distância total, número de trilhas concluídas, etc.).
- **Usar offline**: instalar o app no celular e continuar usando mapas e percursos salvos mesmo sem internet, sincronizando automaticamente quando a conexão volta.
- **Participar da comunidade**:
  - avaliar trilhas com estrelas e deixar comentários;
  - reportar alertas de condição em pontos específicos da trilha (ex.: trecho alagado, árvore caída);
  - compartilhar fotos de cada trilha;
  - cadastrar novas trilhas, que passam por uma revisão antes de ficarem públicas.
- **Moderação da comunidade**: contas administradoras podem aprovar ou rejeitar trilhas cadastradas e revisar denúncias, mantendo a qualidade do conteúdo.
- **Notificações**: o usuário é avisado quando uma trilha cadastrada por ele é aprovada, ou quando alguém comenta em uma trilha sua.

## Público-alvo

Pessoas que praticam atividades ao ar livre em trilhas — trekking, caminhada, corrida ou ciclismo — e querem tanto planejar a próxima trilha quanto guardar um histórico de tudo que já percorreram, contribuindo com a comunidade de outros trilheiros no caminho.

## Estado atual

O app já cobre o fluxo essencial (busca, mapa, gravação de percurso, histórico, login e uso offline) e os recursos de comunidade (avaliações, comentários, alertas, fotos, cadastro e moderação de trilhas). O traçado completo de trilhas cadastradas pela comunidade ainda é simplificado e deve ser aprimorado em versões futuras.

## Stack

- **Frontend**: React 18 + Vite, PWA via `vite-plugin-pwa` (service worker com cache offline de dados do Supabase e tiles de mapa).
- **Mapa**: Leaflet + react-leaflet, tiles do MapTiler.
- **Backend**: Supabase (Postgres, Auth, Storage) acessado diretamente do frontend via `@supabase/supabase-js` — não há um servidor de aplicação próprio.
- **Funções server-side**: uma Supabase Edge Function (`supabase/functions/enviar-push`) para envio de push notifications.
- **Testes**: Vitest, com `@testing-library/react` para componentes.
- **Lint**: ESLint (flat config).

## Estrutura do projeto

```
app/
  src/
    api/         chamadas ao Supabase, uma função por operação/tabela
    components/  componentes reutilizáveis
    context/     contexto React (auth, tema, presença, notificações)
    lib/         funções puras (geo, gpx, formatação, validação de upload etc.)
    pages/       uma página por rota (ver App.jsx)
supabase/
  functions/     Edge Functions do Supabase (Deno)
database/        migrations e schema SQL (não versionado no git — histórico local apenas)
```

## Rodando localmente

Pré-requisitos: Node 20+, uma instância Supabase (projeto próprio ou de desenvolvimento) e uma API key do MapTiler.

```bash
cd app
cp .env.example .env   # preencha com suas credenciais Supabase/MapTiler/VAPID
npm install
npm run dev             # sobe o servidor de desenvolvimento (Vite)
```

Outros comandos úteis, todos rodados dentro de `app/`:

```bash
npm test        # roda os testes (Vitest)
npm run lint    # roda o ESLint
npm run build   # gera o build de produção em app/dist
```

O CI (`.github/workflows/ci.yml`) roda lint, testes e build a cada push/PR na `master`.

## Deploy

Não há pipeline de deploy automatizado. O build (`npm run build`) gera um PWA estático em `app/dist`, que pode ser hospedado em qualquer serviço de arquivos estáticos (Netlify, Vercel, Cloudflare Pages etc.) — configure lá as mesmas variáveis de ambiente do `.env`. A Edge Function em `supabase/functions/enviar-push` é publicada separadamente via `supabase functions deploy` (Supabase CLI). Migrations em `database/` precisam ser aplicadas manualmente no projeto Supabase de destino.
