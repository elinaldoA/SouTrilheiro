-- SouTrilheiro — schema inicial (Supabase / Postgres)
-- Rode este arquivo no SQL Editor do seu projeto Supabase.

create extension if not exists "pgcrypto";

create table usuarios (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  nome varchar(120) not null,
  avatar_url text,
  is_admin boolean not null default false,
  criado_em timestamptz not null default now()
);

create type dificuldade_trilha as enum ('facil', 'moderada', 'dificil');
create type status_trilha as enum ('publicada', 'pendente_revisao');

create table trilhas (
  id uuid primary key default gen_random_uuid(),
  nome varchar(160) not null,
  descricao text,
  cidade varchar(120) not null,
  estado char(2) not null,
  distancia_km numeric(5,2) not null,
  elevacao_m int not null default 0,
  tempo_estimado_min int not null,
  dificuldade dificuldade_trilha not null,
  lat numeric(10,7) not null,
  lng numeric(10,7) not null,
  path_geojson jsonb not null,
  status status_trilha not null default 'publicada',
  criado_por uuid references usuarios(id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index idx_trilhas_dificuldade on trilhas (dificuldade);
create index idx_trilhas_status on trilhas (status);
create index idx_trilhas_lat_lng on trilhas (lat, lng);

create table percursos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references usuarios(id) on delete cascade,
  trilha_id uuid not null references trilhas(id) on delete cascade,
  distancia_km numeric(5,2) not null,
  duracao_seg int not null,
  elevacao_m int not null default 0,
  path_geojson jsonb not null,
  iniciado_em timestamptz not null,
  finalizado_em timestamptz not null,
  nota_percurso text,
  criado_em timestamptz not null default now()
);

create index idx_percursos_usuario on percursos (usuario_id);

create table avaliacoes (
  id uuid primary key default gen_random_uuid(),
  trilha_id uuid not null references trilhas(id) on delete cascade,
  usuario_id uuid not null references usuarios(id) on delete cascade,
  nota smallint not null check (nota between 1 and 5),
  comentario text,
  criado_em timestamptz not null default now(),
  unique (trilha_id, usuario_id)
);

create table fotos (
  id uuid primary key default gen_random_uuid(),
  trilha_id uuid not null references trilhas(id) on delete cascade,
  usuario_id uuid not null references usuarios(id) on delete cascade,
  url text not null,
  lat numeric(10,7),
  lng numeric(10,7),
  capturada_em timestamptz,
  criado_em timestamptz not null default now()
);

create type tipo_comentario as enum ('dica', 'condicao', 'alerta');

create table comentarios (
  id uuid primary key default gen_random_uuid(),
  trilha_id uuid not null references trilhas(id) on delete cascade,
  usuario_id uuid not null references usuarios(id) on delete cascade,
  tipo tipo_comentario not null default 'dica',
  km_referencia numeric(5,2),
  texto text not null,
  criado_em timestamptz not null default now()
);

create type tipo_alvo_denuncia as enum ('trilha', 'foto', 'comentario');
create type status_denuncia as enum ('pendente', 'revisado', 'rejeitado');

create table denuncias (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references usuarios(id) on delete cascade,
  tipo_alvo tipo_alvo_denuncia not null,
  alvo_id uuid not null,
  motivo varchar(255) not null,
  status status_denuncia not null default 'pendente',
  criado_em timestamptz not null default now()
);

-- Row Level Security: leitura pública de trilhas publicadas, escrita restrita ao dono
alter table trilhas enable row level security;
alter table usuarios enable row level security;
alter table percursos enable row level security;
alter table avaliacoes enable row level security;

create policy "trilhas_leitura_publica" on trilhas
  for select using (status = 'publicada');

create policy "trilhas_dono_ve_proprias" on trilhas
  for select using (criado_por in (select id from usuarios where auth_user_id = auth.uid()));

create policy "trilhas_insere_proprio" on trilhas
  for insert with check (criado_por in (select id from usuarios where auth_user_id = auth.uid()));

create policy "usuarios_leitura_publica" on usuarios
  for select using (true);

create policy "usuarios_insere_proprio" on usuarios
  for insert with check (auth_user_id = auth.uid());

create policy "usuarios_edita_proprio_perfil" on usuarios
  for update using (auth_user_id = auth.uid());

create policy "percursos_dono_le_e_escreve" on percursos
  for all using (usuario_id in (select id from usuarios where auth_user_id = auth.uid()));

create policy "avaliacoes_leitura_publica" on avaliacoes
  for select using (true);

create policy "avaliacoes_dono_escreve" on avaliacoes
  for insert with check (usuario_id in (select id from usuarios where auth_user_id = auth.uid()));

create policy "avaliacoes_dono_atualiza" on avaliacoes
  for update using (usuario_id in (select id from usuarios where auth_user_id = auth.uid()));

alter table comentarios enable row level security;

create policy "comentarios_leitura_publica" on comentarios
  for select using (true);

create policy "comentarios_dono_escreve" on comentarios
  for insert with check (usuario_id in (select id from usuarios where auth_user_id = auth.uid()));

alter table fotos enable row level security;

create policy "fotos_leitura_publica" on fotos
  for select using (true);

create policy "fotos_dono_escreve" on fotos
  for insert with check (usuario_id in (select id from usuarios where auth_user_id = auth.uid()));

-- Storage: bucket público para as fotos de trilha, upload restrito a usuários autenticados
insert into storage.buckets (id, name, public)
values ('fotos-trilhas', 'fotos-trilhas', true)
on conflict (id) do nothing;

create policy "fotos_trilhas_upload_autenticado" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'fotos-trilhas');

-- Storage: bucket público para avatares de usuário, cada um só mexe no próprio arquivo.
insert into storage.buckets (id, name, public)
values ('avatares', 'avatares', true)
on conflict (id) do nothing;

create policy "avatares_upload_proprio" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatares' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatares_atualiza_proprio" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatares' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatares_remove_proprio" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatares' and (storage.foldername(name))[1] = auth.uid()::text);

-- Moderação: restrita a usuários com is_admin = true.
create policy "trilhas_admin_ve_todas" on trilhas
  for select to authenticated
  using (exists (select 1 from usuarios u where u.auth_user_id = auth.uid() and u.is_admin));

create policy "trilhas_admin_atualiza_status" on trilhas
  for update to authenticated
  using (exists (select 1 from usuarios u where u.auth_user_id = auth.uid() and u.is_admin));

create policy "trilhas_admin_remove" on trilhas
  for delete to authenticated
  using (exists (select 1 from usuarios u where u.auth_user_id = auth.uid() and u.is_admin));

alter table denuncias enable row level security;

create policy "denuncias_insere_proprio" on denuncias
  for insert with check (usuario_id in (select id from usuarios where auth_user_id = auth.uid()));

create policy "denuncias_admin_le" on denuncias
  for select to authenticated
  using (exists (select 1 from usuarios u where u.auth_user_id = auth.uid() and u.is_admin));

create policy "denuncias_admin_atualiza" on denuncias
  for update to authenticated
  using (exists (select 1 from usuarios u where u.auth_user_id = auth.uid() and u.is_admin));

-- Feed de atividade: seguir usuários e ver os percursos deles.
create table seguidores (
  seguidor_id uuid not null references usuarios(id) on delete cascade,
  seguido_id uuid not null references usuarios(id) on delete cascade,
  criado_em timestamptz not null default now(),
  primary key (seguidor_id, seguido_id),
  check (seguidor_id <> seguido_id)
);

alter table seguidores enable row level security;

create policy "seguidores_leitura_publica" on seguidores
  for select using (true);

create policy "seguidores_insere_proprio" on seguidores
  for insert with check (seguidor_id in (select id from usuarios where auth_user_id = auth.uid()));

create policy "seguidores_remove_proprio" on seguidores
  for delete using (seguidor_id in (select id from usuarios where auth_user_id = auth.uid()));

-- Percursos passam a ter leitura pública, para alimentar o feed de quem você segue
-- (a política de dono continua valendo para insert/update/delete).
create policy "percursos_leitura_publica" on percursos
  for select using (true);

-- Curtidas em itens do feed (percurso, avaliação ou foto).
create type tipo_alvo_curtida as enum ('percurso', 'avaliacao', 'foto');

create table curtidas (
  usuario_id uuid not null references usuarios(id) on delete cascade,
  tipo_alvo tipo_alvo_curtida not null,
  alvo_id uuid not null,
  criado_em timestamptz not null default now(),
  primary key (usuario_id, tipo_alvo, alvo_id)
);

alter table curtidas enable row level security;

create policy "curtidas_leitura_publica" on curtidas
  for select using (true);

create policy "curtidas_insere_proprio" on curtidas
  for insert with check (usuario_id in (select id from usuarios where auth_user_id = auth.uid()));

create policy "curtidas_remove_proprio" on curtidas
  for delete using (usuario_id in (select id from usuarios where auth_user_id = auth.uid()));

-- Notificações push (Web Push). Cada linha é uma inscrição de um dispositivo/navegador.
create table push_inscricoes (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references usuarios(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  criado_em timestamptz not null default now()
);

alter table push_inscricoes enable row level security;

create policy "push_inscricoes_dono_le_e_escreve" on push_inscricoes
  for all using (usuario_id in (select id from usuarios where auth_user_id = auth.uid()));

-- A Edge Function que envia os pushes usa a service role key (contorna RLS),
-- então não precisa de política de leitura adicional para o backend.

-- Comentários em itens do feed (percurso, avaliação ou foto) — reaproveita o padrão
-- polimórfico já usado por "curtidas" (tipo_alvo + alvo_id).
create table feed_comentarios (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references usuarios(id) on delete cascade,
  tipo_alvo tipo_alvo_curtida not null,
  alvo_id uuid not null,
  texto text not null,
  criado_em timestamptz not null default now()
);

create index idx_feed_comentarios_alvo on feed_comentarios (tipo_alvo, alvo_id);

alter table feed_comentarios enable row level security;

create policy "feed_comentarios_leitura_publica" on feed_comentarios
  for select using (true);

create policy "feed_comentarios_dono_escreve" on feed_comentarios
  for insert with check (usuario_id in (select id from usuarios where auth_user_id = auth.uid()));

create policy "feed_comentarios_dono_remove" on feed_comentarios
  for delete using (usuario_id in (select id from usuarios where auth_user_id = auth.uid()));

-- Contagem agregada de curtidas no banco (evita trazer todas as linhas pro cliente).
create or replace function curtidas_resumo(p_tipo tipo_alvo_curtida, p_ids uuid[])
returns table (alvo_id uuid, total bigint, curtido boolean)
language sql stable as $$
  select
    c.alvo_id,
    count(*) as total,
    bool_or(c.usuario_id in (select id from usuarios where auth_user_id = auth.uid())) as curtido
  from curtidas c
  where c.tipo_alvo = p_tipo and c.alvo_id = any(p_ids)
  group by c.alvo_id;
$$;

-- Contagem agregada de comentários de feed por item, sem trazer os textos.
create or replace function comentarios_contagem(p_tipo tipo_alvo_curtida, p_ids uuid[])
returns table (alvo_id uuid, total bigint)
language sql stable as $$
  select fc.alvo_id, count(*) as total
  from feed_comentarios fc
  where fc.tipo_alvo = p_tipo and fc.alvo_id = any(p_ids)
  group by fc.alvo_id;
$$;

-- Excluir/editar posts próprios pelo feed: avaliações e fotos não tinham essas
-- políticas ainda (percursos já tem "for all" própria, então já cobre delete).
create policy "avaliacoes_dono_remove" on avaliacoes
  for delete using (usuario_id in (select id from usuarios where auth_user_id = auth.uid()));

create policy "fotos_dono_atualiza" on fotos
  for update using (usuario_id in (select id from usuarios where auth_user_id = auth.uid()));

create policy "fotos_dono_remove" on fotos
  for delete using (usuario_id in (select id from usuarios where auth_user_id = auth.uid()));
