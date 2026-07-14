import { supabase } from '../lib/supabaseClient';

const CAMPOS_FOTO = 'id, url, legenda, localizacao, criado_em, usuarios(id, nome, avatar_url), trilhas(id, nome)';
const CAMPOS_VIDEO = 'id, url, legenda, localizacao, criado_em, usuarios(id, nome, avatar_url), trilhas(id, nome)';

export async function buscarPorHashtag(tag, limite = 30) {
  const termo = `%#${tag}%`;

  const [fotosRes, videosRes] = await Promise.all([
    supabase.from('fotos').select(CAMPOS_FOTO).ilike('legenda', termo).order('criado_em', { ascending: false }).limit(limite),
    supabase.from('videos').select(CAMPOS_VIDEO).ilike('legenda', termo).order('criado_em', { ascending: false }).limit(limite),
  ]);
  if (fotosRes.error) throw fotosRes.error;
  if (videosRes.error) throw videosRes.error;

  const fotos = fotosRes.data.map((f) => ({
    id: f.id,
    tipo: 'foto',
    criadoEm: f.criado_em,
    usuario: f.usuarios,
    trilha: f.trilhas,
    url: f.url,
    legenda: f.legenda,
    localizacao: f.localizacao,
  }));

  const videos = videosRes.data.map((v) => ({
    id: v.id,
    tipo: 'video',
    criadoEm: v.criado_em,
    usuario: v.usuarios,
    trilha: v.trilhas,
    url: v.url,
    legenda: v.legenda,
    localizacao: v.localizacao,
  }));

  return [...fotos, ...videos].sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm)).slice(0, limite);
}
