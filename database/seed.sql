-- SouTrilheiro — dados iniciais para desenvolvimento
-- Rode depois do schema.sql, no SQL Editor do Supabase.

insert into trilhas (nome, descricao, cidade, estado, distancia_km, elevacao_m, tempo_estimado_min, dificuldade, lat, lng, path_geojson) values
('Trilha do Pico da Bandeira', 'Terceiro pico mais alto do Brasil, dentro do Parque Nacional do Caparaó, com nascer do sol famoso.', 'Ibitirama', 'ES', 10.00, 1100, 360,
  'dificil', -20.4522, -41.7889,
  '[[-20.4522,-41.7889],[-20.4480,-41.7850],[-20.4440,-41.7810],[-20.4390,-41.7770]]'),

('Trilha da Pedra Azul', 'Trilha que circunda o monumento natural da Pedra Azul, com vista para a Serra do Caparaó.', 'Domingos Martins', 'ES', 4.20, 260, 100,
  'moderada', -20.4308, -41.0244,
  '[[-20.4308,-41.0244],[-20.4285,-41.0225],[-20.4260,-41.0205]]'),

('Trilha da Pedra do Elefante', 'Subida até o mirante em formato de elefante, dentro do Parque Estadual da Pedra Azul.', 'Domingos Martins', 'ES', 3.00, 190, 80,
  'moderada', -20.4275, -41.0195,
  '[[-20.4275,-41.0195],[-20.4255,-41.0175],[-20.4235,-41.0155]]'),

('Trilha do Pico do Forno Grande', 'Segundo ponto mais alto do Espírito Santo, no Parque Estadual do Forno Grande.', 'Castelo', 'ES', 6.80, 700, 240,
  'dificil', -20.5567, -41.2011,
  '[[-20.5567,-41.2011],[-20.5530,-41.1980],[-20.5490,-41.1950]]'),

('Trilha da Reserva de Duas Bocas', 'Percurso fácil em meio à mata atlântica preservada, com opção de banho em rio.', 'Cariacica', 'ES', 2.80, 90, 70,
  'facil', -20.3167, -40.5000,
  '[[-20.3167,-40.5000],[-20.3150,-40.4980],[-20.3130,-40.4960]]'),

('Trilha da Cachoeira da Fumaça', 'Caminhada até uma cachoeira de queda alta na região norte do estado.', 'Pancas', 'ES', 5.50, 220, 130,
  'moderada', -19.2233, -40.8508,
  '[[-19.2233,-40.8508],[-19.2210,-40.8480],[-19.2185,-40.8455]]');
