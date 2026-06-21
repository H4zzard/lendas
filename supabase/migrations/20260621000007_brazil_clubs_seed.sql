-- =====================================================================
-- Lendas — Etapa 19: modo "Clubes do Brasil"
-- Novo tournament + 8 clubes históricos + 16 jogadores cada (128).
-- Aplicar DEPOIS das migrations anteriores. NÃO altera a Copa do Mundo.
-- Idempotente: insere cada clube (com seus jogadores) só se ainda não existir.
-- Sem escudos/logos/imagens — apenas nomes, posições e códigos.
-- =====================================================================

do $$
declare
  v_tournament uuid;
  v_squad uuid;
begin
  insert into public.tournaments (slug, name, type, is_active)
  values ('brazil-clubs', 'Clubes do Brasil', 'clubs', true)
  on conflict (slug) do nothing;

  select id into v_tournament from public.tournaments where slug = 'brazil-clubs';

  -- ----------------------------------------------------------------- Santos 1962
  select id into v_squad from public.squads
    where tournament_id = v_tournament and display_name = 'Santos 1962';
  if v_squad is null then
    insert into public.squads (tournament_id, country_code, country_name, year, display_name, overall)
    values (v_tournament, 'BRA', 'Brasil', 1962, 'Santos 1962', 90) returning id into v_squad;
    insert into public.players
      (squad_id, first_name, full_name, number, position, overall, pace, shooting, passing, defending, physical, set_piece, penalty) values
    (v_squad, 'Gylmar', 'Gylmar dos Santos', 1, 'GOL', 86, 60, 25, 58, 86, 82, 30, 42),
    (v_squad, 'Laércio', 'Laércio', 12, 'GOL', 77, 58, 24, 52, 77, 75, 28, 36),
    (v_squad, 'Dalmo', 'Dalmo Gaspar', 2, 'LD', 81, 84, 55, 74, 78, 76, 56, 52),
    (v_squad, 'Geraldino', 'Geraldino', 6, 'LE', 79, 82, 52, 72, 76, 74, 54, 50),
    (v_squad, 'Mauro', 'Mauro Ramos', 3, 'ZAG', 85, 70, 48, 70, 86, 85, 50, 46),
    (v_squad, 'Calvet', 'Calvet', 4, 'ZAG', 80, 68, 45, 66, 82, 82, 46, 44),
    (v_squad, 'Haroldo', 'Haroldo', 5, 'ZAG', 79, 68, 44, 64, 81, 81, 45, 42),
    (v_squad, 'Zito', 'José Ely de Miranda', 8, 'VOL', 85, 74, 62, 82, 82, 82, 62, 58),
    (v_squad, 'Dudu', 'Dudu', 15, 'VOL', 80, 72, 58, 78, 80, 80, 56, 55),
    (v_squad, 'Lima', 'Lima', 16, 'MC', 81, 76, 64, 82, 70, 76, 66, 60),
    (v_squad, 'Mengálvio', 'Mengálvio', 19, 'MEI', 84, 76, 78, 86, 58, 72, 84, 78),
    (v_squad, 'Dorval', 'Dorval Rodrigues', 7, 'PD', 83, 87, 74, 76, 54, 72, 68, 66),
    (v_squad, 'Pepe', 'José Macia Pepe', 11, 'PE', 88, 84, 86, 80, 54, 76, 90, 82),
    (v_squad, 'Coutinho', 'Antônio Coutinho', 9, 'SA', 89, 85, 88, 82, 50, 78, 72, 84),
    (v_squad, 'Pagão', 'Pagão', 18, 'CA', 82, 80, 82, 72, 46, 76, 66, 78),
    (v_squad, 'Pelé', 'Edson Arantes do Nascimento', 10, 'CA', 95, 90, 92, 88, 55, 84, 86, 90);
  end if;

  -- ----------------------------------------------------------------- Flamengo 1981
  select id into v_squad from public.squads
    where tournament_id = v_tournament and display_name = 'Flamengo 1981';
  if v_squad is null then
    insert into public.squads (tournament_id, country_code, country_name, year, display_name, overall)
    values (v_tournament, 'BRA', 'Brasil', 1981, 'Flamengo 1981', 89) returning id into v_squad;
    insert into public.players
      (squad_id, first_name, full_name, number, position, overall, pace, shooting, passing, defending, physical, set_piece, penalty) values
    (v_squad, 'Raul', 'Raul Plassmann', 1, 'GOL', 83, 60, 25, 56, 83, 80, 30, 40),
    (v_squad, 'Cantarele', 'Cantarele', 12, 'GOL', 76, 58, 24, 52, 76, 75, 28, 36),
    (v_squad, 'Leandro', 'Leandro', 2, 'LD', 88, 86, 60, 82, 84, 80, 64, 58),
    (v_squad, 'Júnior', 'Leovegildo Júnior', 6, 'LE', 89, 86, 66, 86, 82, 80, 78, 66),
    (v_squad, 'Marinho', 'Marinho', 3, 'ZAG', 82, 70, 46, 68, 83, 83, 46, 44),
    (v_squad, 'Mozer', 'Carlos Mozer', 4, 'ZAG', 83, 72, 48, 70, 84, 84, 48, 46),
    (v_squad, 'Figueiredo', 'Figueiredo', 5, 'ZAG', 79, 68, 44, 64, 80, 81, 44, 42),
    (v_squad, 'Andrade', 'Andrade', 8, 'VOL', 84, 76, 60, 80, 82, 84, 58, 56),
    (v_squad, 'Adílio', 'Adílio', 16, 'MC', 82, 76, 66, 82, 72, 76, 66, 62),
    (v_squad, 'Zico', 'Arthur Antunes Coimbra', 10, 'MEI', 94, 80, 90, 92, 58, 76, 94, 90),
    (v_squad, 'Tita', 'Milton Queiroz Tita', 7, 'MC', 83, 82, 74, 82, 62, 74, 72, 70),
    (v_squad, 'Vítor', 'Vítor', 17, 'PD', 80, 86, 70, 74, 52, 72, 66, 64),
    (v_squad, 'Lico', 'Lico', 11, 'PE', 81, 85, 72, 76, 52, 72, 70, 66),
    (v_squad, 'Anselmo', 'Anselmo', 19, 'SA', 80, 80, 80, 72, 48, 76, 64, 76),
    (v_squad, 'Nunes', 'Cláudio Adão Nunes', 9, 'CA', 85, 84, 86, 74, 48, 80, 66, 80),
    (v_squad, 'Baroninho', 'Baroninho', 18, 'CA', 78, 80, 78, 70, 46, 74, 62, 74);
  end if;

  -- ----------------------------------------------------------------- São Paulo 1992
  select id into v_squad from public.squads
    where tournament_id = v_tournament and display_name = 'São Paulo 1992';
  if v_squad is null then
    insert into public.squads (tournament_id, country_code, country_name, year, display_name, overall)
    values (v_tournament, 'BRA', 'Brasil', 1992, 'São Paulo 1992', 89) returning id into v_squad;
    insert into public.players
      (squad_id, first_name, full_name, number, position, overall, pace, shooting, passing, defending, physical, set_piece, penalty) values
    (v_squad, 'Zetti', 'Armando Zetti', 1, 'GOL', 85, 60, 25, 56, 85, 80, 32, 42),
    (v_squad, 'Gilmar', 'Gilmar Rinaldi', 12, 'GOL', 77, 58, 24, 52, 77, 76, 28, 36),
    (v_squad, 'Cafu', 'Marcos Evangelista Cafu', 2, 'LD', 87, 90, 58, 80, 82, 82, 58, 54),
    (v_squad, 'Ronaldão', 'Ronaldão', 3, 'ZAG', 82, 70, 46, 68, 83, 84, 46, 44),
    (v_squad, 'Adílson', 'Adílson Batista', 4, 'ZAG', 82, 70, 47, 70, 83, 83, 50, 46),
    (v_squad, 'Válber', 'Válber', 5, 'ZAG', 79, 70, 46, 68, 80, 80, 46, 44),
    (v_squad, 'Ivan', 'Ivan', 6, 'LE', 80, 82, 52, 72, 78, 78, 52, 50),
    (v_squad, 'Pintado', 'Pintado', 8, 'VOL', 81, 74, 56, 78, 80, 82, 56, 54),
    (v_squad, 'Doriva', 'Doriva', 15, 'VOL', 80, 74, 55, 78, 79, 80, 55, 52),
    (v_squad, 'Cerezo', 'Toninho Cerezo', 19, 'VOL', 84, 72, 64, 84, 80, 82, 68, 62),
    (v_squad, 'Dinho', 'Dinho', 16, 'MC', 80, 74, 62, 80, 70, 76, 62, 58),
    (v_squad, 'Raí', 'Raí Souza Vieira', 10, 'MEI', 90, 78, 84, 88, 60, 76, 88, 86),
    (v_squad, 'Macedo', 'Macedo', 11, 'PD', 80, 86, 72, 74, 52, 70, 66, 64),
    (v_squad, 'Müller', 'Luís Antônio Müller', 7, 'SA', 86, 86, 84, 80, 52, 76, 74, 80),
    (v_squad, 'Palhinha', 'Palhinha', 9, 'CA', 83, 84, 84, 74, 46, 76, 66, 80),
    (v_squad, 'Gérson', 'Gérson', 18, 'CA', 78, 80, 78, 70, 46, 74, 62, 74);
  end if;

  -- ----------------------------------------------------------------- Palmeiras 1999
  select id into v_squad from public.squads
    where tournament_id = v_tournament and display_name = 'Palmeiras 1999';
  if v_squad is null then
    insert into public.squads (tournament_id, country_code, country_name, year, display_name, overall)
    values (v_tournament, 'BRA', 'Brasil', 1999, 'Palmeiras 1999', 88) returning id into v_squad;
    insert into public.players
      (squad_id, first_name, full_name, number, position, overall, pace, shooting, passing, defending, physical, set_piece, penalty) values
    (v_squad, 'Marcos', 'Marcos Roberto', 1, 'GOL', 88, 62, 26, 58, 88, 84, 34, 44),
    (v_squad, 'Sérgio', 'Sérgio', 12, 'GOL', 76, 58, 24, 52, 76, 76, 28, 36),
    (v_squad, 'Arce', 'Francisco Arce', 2, 'LD', 82, 84, 56, 76, 80, 78, 58, 54),
    (v_squad, 'Júnior Baiano', 'Júnior Baiano', 3, 'ZAG', 83, 70, 48, 70, 84, 86, 48, 46),
    (v_squad, 'Roque Júnior', 'Roque Júnior', 4, 'ZAG', 84, 74, 48, 72, 85, 84, 50, 46),
    (v_squad, 'Cléber', 'Cléber', 13, 'ZAG', 79, 70, 45, 66, 81, 82, 45, 44),
    (v_squad, 'Júnior', 'Júnior', 6, 'LE', 80, 82, 52, 72, 79, 78, 52, 50),
    (v_squad, 'César Sampaio', 'César Sampaio', 8, 'VOL', 84, 74, 62, 80, 82, 84, 60, 58),
    (v_squad, 'Galeano', 'Galeano', 5, 'VOL', 79, 74, 56, 76, 79, 80, 54, 52),
    (v_squad, 'Zinho', 'Crizam Zinho', 7, 'MC', 83, 80, 68, 82, 68, 74, 70, 66),
    (v_squad, 'Alex', 'Alex Rodrigo Dias', 10, 'MEI', 86, 78, 82, 86, 58, 74, 84, 82),
    (v_squad, 'Paulo Nunes', 'Paulo Nunes', 11, 'PD', 81, 86, 76, 76, 52, 74, 66, 66),
    (v_squad, 'Euller', 'Euller', 18, 'PE', 80, 88, 74, 74, 50, 72, 64, 64),
    (v_squad, 'Rogério', 'Rogério', 17, 'SA', 79, 82, 78, 74, 48, 72, 64, 72),
    (v_squad, 'Oséas', 'Oséas', 9, 'CA', 81, 80, 82, 72, 46, 78, 64, 78),
    (v_squad, 'Evair', 'Evair', 19, 'CA', 82, 78, 84, 74, 46, 78, 72, 82);
  end if;

  -- ----------------------------------------------------------------- Vasco 1998
  select id into v_squad from public.squads
    where tournament_id = v_tournament and display_name = 'Vasco 1998';
  if v_squad is null then
    insert into public.squads (tournament_id, country_code, country_name, year, display_name, overall)
    values (v_tournament, 'BRA', 'Brasil', 1998, 'Vasco 1998', 88) returning id into v_squad;
    insert into public.players
      (squad_id, first_name, full_name, number, position, overall, pace, shooting, passing, defending, physical, set_piece, penalty) values
    (v_squad, 'Carlos Germano', 'Carlos Germano', 1, 'GOL', 84, 60, 25, 56, 84, 80, 30, 42),
    (v_squad, 'Helton', 'Helton', 12, 'GOL', 76, 58, 24, 52, 76, 76, 28, 36),
    (v_squad, 'Jorginho', 'Jorginho', 2, 'LD', 84, 82, 58, 80, 80, 78, 62, 56),
    (v_squad, 'Mauro Galvão', 'Mauro Galvão', 3, 'ZAG', 82, 68, 48, 72, 84, 82, 52, 46),
    (v_squad, 'Odvan', 'Odvan', 4, 'ZAG', 79, 68, 45, 66, 81, 82, 45, 44),
    (v_squad, 'Galego', 'Galego', 5, 'ZAG', 78, 68, 44, 64, 80, 81, 44, 42),
    (v_squad, 'Nasa', 'Nasa', 6, 'LE', 78, 80, 50, 70, 78, 78, 50, 48),
    (v_squad, 'Luisinho', 'Luisinho', 15, 'VOL', 80, 74, 58, 78, 80, 80, 56, 54),
    (v_squad, 'Ramon', 'Ramon', 16, 'VOL', 79, 74, 55, 76, 79, 80, 55, 52),
    (v_squad, 'Pedrinho', 'Pedrinho', 8, 'MC', 82, 80, 72, 82, 64, 74, 72, 68),
    (v_squad, 'Juninho', 'Juninho Pernambucano', 18, 'MC', 85, 78, 80, 86, 66, 76, 90, 80),
    (v_squad, 'Felipe', 'Felipe Maestro', 10, 'MEI', 84, 76, 80, 86, 58, 74, 82, 78),
    (v_squad, 'Vágner', 'Vágner', 17, 'PD', 78, 86, 72, 74, 50, 72, 64, 64),
    (v_squad, 'Edmundo', 'Edmundo Alves', 11, 'SA', 89, 86, 88, 82, 50, 78, 76, 84),
    (v_squad, 'Romário', 'Romário de Souza Faria', 9, 'CA', 92, 86, 92, 80, 42, 76, 72, 88),
    (v_squad, 'Luizão', 'Luizão', 19, 'CA', 82, 80, 84, 72, 46, 82, 64, 80);
  end if;

  -- ----------------------------------------------------------------- Corinthians 2012
  select id into v_squad from public.squads
    where tournament_id = v_tournament and display_name = 'Corinthians 2012';
  if v_squad is null then
    insert into public.squads (tournament_id, country_code, country_name, year, display_name, overall)
    values (v_tournament, 'BRA', 'Brasil', 2012, 'Corinthians 2012', 87) returning id into v_squad;
    insert into public.players
      (squad_id, first_name, full_name, number, position, overall, pace, shooting, passing, defending, physical, set_piece, penalty) values
    (v_squad, 'Cássio', 'Cássio Ramos', 12, 'GOL', 86, 62, 26, 58, 86, 86, 34, 44),
    (v_squad, 'Júlio César', 'Júlio César', 1, 'GOL', 76, 58, 24, 52, 76, 76, 28, 36),
    (v_squad, 'Alessandro', 'Alessandro', 2, 'LD', 81, 82, 54, 76, 80, 78, 56, 52),
    (v_squad, 'Chicão', 'Chicão', 3, 'ZAG', 81, 68, 46, 68, 83, 84, 46, 44),
    (v_squad, 'Leandro Castán', 'Leandro Castán', 4, 'ZAG', 83, 72, 48, 70, 84, 85, 48, 46),
    (v_squad, 'Paulo André', 'Paulo André', 13, 'ZAG', 80, 70, 46, 66, 82, 83, 46, 44),
    (v_squad, 'Fábio Santos', 'Fábio Santos', 6, 'LE', 81, 82, 58, 76, 80, 78, 64, 58),
    (v_squad, 'Ralf', 'Ralf', 8, 'VOL', 81, 74, 55, 78, 82, 82, 54, 52),
    (v_squad, 'Paulinho', 'José Paulo Bezerra', 15, 'VOL', 85, 80, 72, 82, 80, 84, 66, 66),
    (v_squad, 'Danilo', 'Danilo Larangeira', 7, 'MC', 81, 74, 68, 82, 68, 74, 72, 68),
    (v_squad, 'Douglas', 'Douglas', 10, 'MEI', 80, 76, 74, 84, 58, 72, 76, 72),
    (v_squad, 'Edenílson', 'Edenílson', 16, 'MC', 78, 78, 66, 80, 66, 74, 64, 62),
    (v_squad, 'Jorge Henrique', 'Jorge Henrique', 11, 'PD', 79, 86, 72, 74, 54, 76, 62, 62),
    (v_squad, 'Emerson', 'Emerson Sheik', 18, 'SA', 83, 82, 82, 80, 50, 78, 72, 78),
    (v_squad, 'Liedson', 'Liedson', 9, 'CA', 82, 82, 84, 74, 48, 74, 66, 80),
    (v_squad, 'Guerrero', 'Paolo Guerrero', 19, 'CA', 84, 82, 86, 76, 48, 82, 66, 82);
  end if;

  -- ----------------------------------------------------------------- Grêmio 1995
  select id into v_squad from public.squads
    where tournament_id = v_tournament and display_name = 'Grêmio 1995';
  if v_squad is null then
    insert into public.squads (tournament_id, country_code, country_name, year, display_name, overall)
    values (v_tournament, 'BRA', 'Brasil', 1995, 'Grêmio 1995', 87) returning id into v_squad;
    insert into public.players
      (squad_id, first_name, full_name, number, position, overall, pace, shooting, passing, defending, physical, set_piece, penalty) values
    (v_squad, 'Danrlei', 'Danrlei de Deus', 1, 'GOL', 83, 60, 25, 56, 83, 80, 30, 42),
    (v_squad, 'Roberto', 'Roberto', 12, 'GOL', 76, 58, 24, 52, 76, 76, 28, 36),
    (v_squad, 'Goiano', 'Goiano', 2, 'LD', 80, 82, 52, 72, 79, 78, 54, 50),
    (v_squad, 'Adílson', 'Adílson', 3, 'ZAG', 81, 70, 46, 68, 82, 84, 46, 44),
    (v_squad, 'Rivarola', 'Rivarola', 4, 'ZAG', 79, 68, 45, 66, 81, 82, 45, 44),
    (v_squad, 'Carlos Miguel', 'Carlos Miguel', 13, 'ZAG', 79, 68, 44, 64, 80, 81, 44, 42),
    (v_squad, 'Magno', 'Magno', 6, 'LE', 78, 80, 50, 70, 78, 78, 50, 48),
    (v_squad, 'Vampeta', 'Marcos Vampeta', 5, 'VOL', 80, 72, 55, 76, 80, 82, 54, 52),
    (v_squad, 'Dinho', 'Dinho', 8, 'VOL', 82, 74, 60, 80, 82, 84, 58, 56),
    (v_squad, 'Émerson', 'Émerson', 16, 'MC', 81, 76, 64, 82, 70, 76, 66, 62),
    (v_squad, 'Roger', 'Roger Machado', 17, 'MC', 80, 78, 68, 82, 66, 74, 68, 64),
    (v_squad, 'Arílson', 'Arílson', 10, 'MEI', 83, 78, 78, 84, 58, 72, 80, 76),
    (v_squad, 'Paulo Nunes', 'Paulo Nunes', 7, 'PD', 82, 87, 78, 76, 52, 74, 66, 66),
    (v_squad, 'Luís Henrique', 'Luís Henrique', 18, 'SA', 79, 82, 78, 74, 48, 72, 64, 72),
    (v_squad, 'Jardel', 'Mário Jardel', 9, 'CA', 88, 84, 90, 76, 48, 84, 70, 84),
    (v_squad, 'Sandro', 'Sandro', 19, 'CA', 79, 80, 80, 72, 46, 76, 62, 76);
  end if;

  -- ----------------------------------------------------------------- Cruzeiro 2003
  select id into v_squad from public.squads
    where tournament_id = v_tournament and display_name = 'Cruzeiro 2003';
  if v_squad is null then
    insert into public.squads (tournament_id, country_code, country_name, year, display_name, overall)
    values (v_tournament, 'BRA', 'Brasil', 2003, 'Cruzeiro 2003', 88) returning id into v_squad;
    insert into public.players
      (squad_id, first_name, full_name, number, position, overall, pace, shooting, passing, defending, physical, set_piece, penalty) values
    (v_squad, 'Gomes', 'Heurelho Gomes', 1, 'GOL', 85, 62, 26, 56, 85, 82, 32, 44),
    (v_squad, 'Artur', 'Artur', 12, 'GOL', 76, 58, 24, 52, 76, 76, 28, 36),
    (v_squad, 'Maurinho', 'Maurinho', 2, 'LD', 80, 84, 54, 74, 79, 78, 54, 52),
    (v_squad, 'Luisão', 'Anderson Luisão', 3, 'ZAG', 84, 74, 48, 72, 85, 86, 48, 46),
    (v_squad, 'Cris', 'Cristiano Marques', 4, 'ZAG', 84, 76, 48, 72, 85, 85, 48, 46),
    (v_squad, 'Cléber', 'Cléber', 13, 'ZAG', 79, 70, 45, 66, 81, 82, 45, 44),
    (v_squad, 'Leandro', 'Leandro', 6, 'LE', 79, 82, 52, 72, 78, 78, 52, 50),
    (v_squad, 'Sorín', 'Juan Pablo Sorín', 16, 'LE', 84, 82, 64, 84, 78, 80, 72, 68),
    (v_squad, 'Augusto', 'Augusto Recife', 8, 'VOL', 80, 74, 56, 78, 80, 82, 56, 54),
    (v_squad, 'Maldonado', 'Jonas Maldonado', 5, 'VOL', 81, 74, 58, 80, 82, 82, 58, 56),
    (v_squad, 'Geílson', 'Geílson', 17, 'MC', 79, 76, 64, 80, 68, 74, 64, 60),
    (v_squad, 'Ricardinho', 'Ricardinho', 10, 'MEI', 85, 78, 80, 88, 58, 72, 84, 80),
    (v_squad, 'Guilherme', 'Guilherme', 11, 'PD', 80, 86, 76, 76, 50, 74, 66, 66),
    (v_squad, 'Mota', 'Luís Mota', 7, 'SA', 81, 82, 82, 76, 48, 76, 66, 78),
    (v_squad, 'Deivid', 'Deivid', 9, 'CA', 82, 82, 84, 74, 46, 80, 64, 80),
    (v_squad, 'Aristizábal', 'Víctor Aristizábal', 19, 'CA', 83, 78, 86, 74, 46, 78, 70, 84);
  end if;

end $$;
