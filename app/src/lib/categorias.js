export const CATEGORIAS_TRILHA = [
  { valor: 'praia', rotulo: 'Praia' },
  { valor: 'cachoeira', rotulo: 'Cachoeira' },
  { valor: 'montanha', rotulo: 'Montanha/Serra' },
  { valor: 'mata', rotulo: 'Mata/Floresta' },
  { valor: 'mirante', rotulo: 'Mirante' },
  { valor: 'rio_lagoa', rotulo: 'Rio/Lagoa' },
  { valor: 'urbana_parque', rotulo: 'Urbana/Parque' },
];

export const ROTULO_CATEGORIA = Object.fromEntries(CATEGORIAS_TRILHA.map((c) => [c.valor, c.rotulo]));

export const ESTADOS_BR = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];
