export const BADGES = [
  {
    id: 'primeiro-percurso',
    nome: 'Primeiro percurso',
    descricao: 'Grave o seu primeiro percurso',
    conquistado: (s) => s.percursosCount >= 1,
  },
  {
    id: 'trilheiro-dedicado',
    nome: 'Trilheiro dedicado',
    descricao: 'Grave 5 percursos',
    conquistado: (s) => s.percursosCount >= 5,
  },
  {
    id: '10km',
    nome: '10 km',
    descricao: 'Percorra 10 km no total',
    conquistado: (s) => s.distanciaTotalKm >= 10,
  },
  {
    id: '50km',
    nome: '50 km',
    descricao: 'Percorra 50 km no total',
    conquistado: (s) => s.distanciaTotalKm >= 50,
  },
  {
    id: 'explorador',
    nome: 'Explorador',
    descricao: 'Conclua 3 trilhas diferentes',
    conquistado: (s) => s.trilhasConcluidas >= 3,
  },
  {
    id: 'contribuidor',
    nome: 'Contribuidor',
    descricao: 'Cadastre uma trilha nova',
    conquistado: (s) => s.trilhasCadastradas >= 1,
  },
];
