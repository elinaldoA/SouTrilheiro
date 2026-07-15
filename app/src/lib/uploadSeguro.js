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

/**
 * Valida que o arquivo é realmente uma imagem de um tipo conhecido (a extensão do
 * nome escolhido pelo usuário nunca é confiável) e devolve extensão/content-type
 * seguros para o upload.
 */
export function validarImagem(arquivo) {
  const extensao = EXTENSAO_POR_MIME_IMAGEM[arquivo.type];
  if (!extensao) throw new Error('Envie uma imagem em JPG, PNG, WEBP ou GIF.');
  return { extensao, contentType: arquivo.type };
}

/** Mesma ideia de validarImagem, mas para vídeo. */
export function validarVideo(arquivo) {
  const extensao = EXTENSAO_POR_MIME_VIDEO[arquivo.type];
  if (!extensao) throw new Error('Envie um vídeo em MP4, WEBM ou MOV.');
  return { extensao, contentType: arquivo.type };
}
