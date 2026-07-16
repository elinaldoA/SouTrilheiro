import { supabase } from './supabaseClient';

const EXTENSAO_POR_MIME_IMAGEM = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

const EXTENSAO_POR_MIME_VIDEO = {
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
};

// Espelham o file_size_limit já definido nos buckets (ver database/migration_storage_mime_types.sql,
// migration_videos.sql, migration_chat_anexos.sql) — checar aqui só evita a viagem de rede
// até o Storage recusar; o limite que vale de verdade é o do bucket.
const TAMANHO_MAXIMO_IMAGEM = 10 * 1024 * 1024;
const TAMANHO_MAXIMO_VIDEO = 100 * 1024 * 1024;

/**
 * Valida que o arquivo é realmente uma imagem de um tipo conhecido (a extensão do
 * nome escolhido pelo usuário nunca é confiável) e devolve extensão/content-type
 * seguros para o upload.
 */
export function validarImagem(arquivo) {
  const extensao = EXTENSAO_POR_MIME_IMAGEM[arquivo.type];
  if (!extensao) throw new Error('Envie uma imagem em JPG, PNG, WEBP ou GIF.');
  if (arquivo.size > TAMANHO_MAXIMO_IMAGEM) throw new Error('Imagem maior que 10MB.');
  return { extensao, contentType: arquivo.type };
}

/** Mesma ideia de validarImagem, mas para vídeo. */
export function validarVideo(arquivo) {
  const extensao = EXTENSAO_POR_MIME_VIDEO[arquivo.type];
  if (!extensao) throw new Error('Envie um vídeo em MP4, WEBM ou MOV.');
  if (arquivo.size > TAMANHO_MAXIMO_VIDEO) throw new Error('Vídeo maior que 100MB.');
  return { extensao, contentType: arquivo.type };
}

/** Envia o arquivo para o bucket, no caminho informado, e devolve a URL pública. */
export async function enviarArquivoParaBucket(bucket, caminho, arquivo, contentType) {
  const { error } = await supabase.storage.from(bucket).upload(caminho, arquivo, { contentType });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(caminho);
  return data.publicUrl;
}
