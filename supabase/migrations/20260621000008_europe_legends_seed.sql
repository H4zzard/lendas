-- =====================================================================
-- Lendas — Etapa 20: modo "Europa Lendária"
-- Novo tournament + 8 clubes europeus históricos + 16 jogadores cada (128).
-- Aplicar DEPOIS das migrations anteriores. NÃO altera world-cup nem brazil-clubs.
-- Idempotente: insere cada clube (com seus jogadores) só se ainda não existir.
-- Sem escudos/logos/imagens — apenas nomes, posições e códigos.
-- =====================================================================

do $$
declare
  v_tournament uuid;
  v_squad uuid;
begin
  insert into public.tournaments (slug, name, type, is_active)
  values ('europe-legends', 'Europa Lendária', 'clubs', true)
  on conflict (slug) do nothing;

  select id into v_tournament from public.tournaments where slug = 'europe-legends';

  -- ----------------------------------------------------------------- Real Madrid 2002
  select id into v_squad from public.squads
    where tournament_id = v_tournament and display_name = 'Real Madrid 2002';
  if v_squad is null then
    insert into public.squads (tournament_id, country_code, country_name, year, display_name, overall)
    values (v_tournament, 'ESP', 'Espanha', 2002, 'Real Madrid 2002', 91) returning id into v_squad;
    insert into public.players
      (squad_id, first_name, full_name, number, position, overall, pace, shooting, passing, defending, physical, set_piece, penalty) values
    (v_squad, 'Casillas', 'Iker Casillas', 1, 'GOL', 88, 74, 28, 64, 88, 80, 38, 48),
    (v_squad, 'César', 'César Sánchez', 25, 'GOL', 76, 58, 24, 52, 76, 76, 28, 36),
    (v_squad, 'Salgado', 'Míchel Salgado', 2, 'LD', 80, 82, 52, 74, 80, 80, 52, 50),
    (v_squad, 'Roberto Carlos', 'Roberto Carlos', 3, 'LE', 89, 92, 78, 78, 80, 84, 90, 72),
    (v_squad, 'Hierro', 'Fernando Hierro', 4, 'ZAG', 85, 68, 60, 76, 85, 86, 72, 80),
    (v_squad, 'Helguera', 'Iván Helguera', 6, 'ZAG', 82, 72, 52, 74, 82, 84, 52, 50),
    (v_squad, 'Pavón', 'Francisco Pavón', 18, 'ZAG', 79, 74, 45, 66, 81, 82, 45, 44),
    (v_squad, 'Makelele', 'Claude Makelele', 19, 'VOL', 85, 78, 50, 78, 86, 82, 50, 52),
    (v_squad, 'Flávio', 'Flávio Conceição', 8, 'VOL', 80, 74, 58, 78, 79, 80, 56, 54),
    (v_squad, 'Guti', 'José María Gutiérrez', 14, 'MC', 83, 76, 74, 86, 58, 72, 76, 72),
    (v_squad, 'Zidane', 'Zinédine Zidane', 5, 'MEI', 95, 76, 84, 94, 62, 80, 88, 86),
    (v_squad, 'Figo', 'Luís Figo', 10, 'PD', 90, 84, 82, 88, 55, 74, 82, 84),
    (v_squad, 'McManaman', 'Steve McManaman', 17, 'PE', 81, 84, 72, 80, 55, 72, 68, 66),
    (v_squad, 'Raúl', 'Raúl González', 7, 'SA', 89, 84, 88, 82, 52, 74, 76, 84),
    (v_squad, 'Ronaldo', 'Ronaldo Nazário', 11, 'CA', 93, 93, 93, 80, 42, 82, 80, 90),
    (v_squad, 'Morientes', 'Fernando Morientes', 9, 'CA', 84, 78, 84, 74, 48, 82, 66, 80);
  end if;

  -- ----------------------------------------------------------------- Barcelona 2011
  select id into v_squad from public.squads
    where tournament_id = v_tournament and display_name = 'Barcelona 2011';
  if v_squad is null then
    insert into public.squads (tournament_id, country_code, country_name, year, display_name, overall)
    values (v_tournament, 'ESP', 'Espanha', 2011, 'Barcelona 2011', 92) returning id into v_squad;
    insert into public.players
      (squad_id, first_name, full_name, number, position, overall, pace, shooting, passing, defending, physical, set_piece, penalty) values
    (v_squad, 'Valdés', 'Víctor Valdés', 1, 'GOL', 85, 68, 26, 62, 85, 80, 34, 44),
    (v_squad, 'Pinto', 'José Manuel Pinto', 13, 'GOL', 76, 58, 24, 54, 76, 76, 28, 36),
    (v_squad, 'Alves', 'Dani Alves', 2, 'LD', 87, 90, 60, 82, 80, 78, 62, 58),
    (v_squad, 'Abidal', 'Éric Abidal', 22, 'LE', 83, 82, 52, 74, 83, 82, 52, 50),
    (v_squad, 'Piqué', 'Gerard Piqué', 3, 'ZAG', 87, 74, 56, 82, 87, 86, 56, 54),
    (v_squad, 'Puyol', 'Carles Puyol', 5, 'ZAG', 86, 78, 50, 74, 87, 86, 50, 48),
    (v_squad, 'Mascherano', 'Javier Mascherano', 14, 'ZAG', 83, 76, 48, 76, 84, 82, 48, 46),
    (v_squad, 'Busquets', 'Sergio Busquets', 16, 'VOL', 86, 68, 55, 86, 84, 80, 56, 56),
    (v_squad, 'Xavi', 'Xavi Hernández', 6, 'MC', 91, 72, 72, 95, 68, 72, 82, 78),
    (v_squad, 'Iniesta', 'Andrés Iniesta', 8, 'MC', 91, 80, 78, 93, 62, 72, 80, 78),
    (v_squad, 'Keita', 'Seydou Keita', 15, 'MEI', 80, 76, 68, 80, 72, 80, 64, 62),
    (v_squad, 'Pedro', 'Pedro Rodríguez', 17, 'PD', 84, 90, 78, 82, 55, 72, 68, 72),
    (v_squad, 'Villa', 'David Villa', 7, 'PE', 87, 84, 88, 80, 50, 76, 80, 85),
    (v_squad, 'Messi', 'Lionel Messi', 10, 'SA', 96, 90, 92, 94, 48, 68, 90, 90),
    (v_squad, 'Alexis', 'Alexis Sánchez', 9, 'SA', 82, 90, 80, 78, 50, 74, 66, 76),
    (v_squad, 'Afellay', 'Ibrahim Afellay', 20, 'PD', 79, 86, 72, 80, 52, 72, 66, 66);
  end if;

  -- ----------------------------------------------------------------- Milan 2007
  select id into v_squad from public.squads
    where tournament_id = v_tournament and display_name = 'Milan 2007';
  if v_squad is null then
    insert into public.squads (tournament_id, country_code, country_name, year, display_name, overall)
    values (v_tournament, 'ITA', 'Itália', 2007, 'Milan 2007', 90) returning id into v_squad;
    insert into public.players
      (squad_id, first_name, full_name, number, position, overall, pace, shooting, passing, defending, physical, set_piece, penalty) values
    (v_squad, 'Dida', 'Nélson Dida', 1, 'GOL', 84, 62, 26, 56, 84, 84, 32, 44),
    (v_squad, 'Kalac', 'Zeljko Kalac', 16, 'GOL', 76, 58, 24, 52, 76, 78, 28, 36),
    (v_squad, 'Oddo', 'Massimo Oddo', 44, 'LD', 80, 80, 55, 76, 80, 78, 60, 56),
    (v_squad, 'Jankulovski', 'Marek Jankulovski', 18, 'LE', 79, 80, 52, 74, 79, 80, 52, 50),
    (v_squad, 'Maldini', 'Paolo Maldini', 3, 'ZAG', 88, 76, 52, 80, 88, 84, 58, 56),
    (v_squad, 'Nesta', 'Alessandro Nesta', 13, 'ZAG', 88, 76, 48, 78, 89, 86, 50, 48),
    (v_squad, 'Kaladze', 'Kakha Kaladze', 4, 'ZAG', 80, 72, 46, 70, 82, 83, 46, 44),
    (v_squad, 'Gattuso', 'Gennaro Gattuso', 8, 'VOL', 84, 78, 55, 76, 84, 86, 54, 54),
    (v_squad, 'Ambrosini', 'Massimo Ambrosini', 23, 'VOL', 81, 74, 60, 78, 80, 82, 58, 56),
    (v_squad, 'Pirlo', 'Andrea Pirlo', 21, 'MC', 88, 68, 76, 92, 66, 72, 92, 84),
    (v_squad, 'Seedorf', 'Clarence Seedorf', 10, 'MC', 86, 76, 82, 86, 62, 78, 84, 80),
    (v_squad, 'Kaká', 'Ricardo Kaká', 22, 'MEI', 91, 88, 86, 88, 58, 76, 82, 84),
    (v_squad, 'Gourcuff', 'Yoann Gourcuff', 28, 'MEI', 79, 76, 74, 82, 56, 72, 76, 72),
    (v_squad, 'Serginho', 'Serginho', 27, 'LE', 79, 82, 54, 74, 78, 78, 54, 52),
    (v_squad, 'Gilardino', 'Alberto Gilardino', 11, 'CA', 83, 80, 84, 74, 46, 78, 64, 80),
    (v_squad, 'Inzaghi', 'Filippo Inzaghi', 9, 'CA', 85, 80, 88, 70, 42, 72, 62, 82);
  end if;

  -- ----------------------------------------------------------------- Liverpool 2005
  select id into v_squad from public.squads
    where tournament_id = v_tournament and display_name = 'Liverpool 2005';
  if v_squad is null then
    insert into public.squads (tournament_id, country_code, country_name, year, display_name, overall)
    values (v_tournament, 'ENG', 'Inglaterra', 2005, 'Liverpool 2005', 88) returning id into v_squad;
    insert into public.players
      (squad_id, first_name, full_name, number, position, overall, pace, shooting, passing, defending, physical, set_piece, penalty) values
    (v_squad, 'Dudek', 'Jerzy Dudek', 1, 'GOL', 82, 62, 26, 56, 82, 82, 30, 42),
    (v_squad, 'Carson', 'Scott Carson', 25, 'GOL', 75, 58, 24, 52, 75, 76, 28, 36),
    (v_squad, 'Finnan', 'Steve Finnan', 3, 'LD', 80, 82, 52, 74, 80, 78, 52, 50),
    (v_squad, 'Riise', 'John Arne Riise', 6, 'LE', 81, 84, 72, 76, 80, 82, 76, 66),
    (v_squad, 'Carragher', 'Jamie Carragher', 23, 'ZAG', 84, 72, 46, 72, 85, 84, 48, 46),
    (v_squad, 'Hyypiä', 'Sami Hyypiä', 4, 'ZAG', 84, 68, 50, 74, 86, 86, 52, 50),
    (v_squad, 'Traoré', 'Djimi Traoré', 22, 'ZAG', 78, 76, 44, 66, 80, 82, 44, 42),
    (v_squad, 'Hamann', 'Dietmar Hamann', 16, 'VOL', 82, 70, 58, 80, 82, 82, 62, 58),
    (v_squad, 'Gerrard', 'Steven Gerrard', 8, 'MC', 89, 82, 86, 86, 72, 84, 84, 82),
    (v_squad, 'Alonso', 'Xabi Alonso', 14, 'MC', 86, 70, 72, 90, 76, 78, 86, 80),
    (v_squad, 'García', 'Luis García', 10, 'MEI', 81, 84, 78, 82, 54, 68, 72, 72),
    (v_squad, 'Kewell', 'Harry Kewell', 7, 'PE', 80, 84, 76, 80, 52, 74, 68, 68),
    (v_squad, 'Šmicer', 'Vladimír Šmicer', 11, 'PD', 79, 82, 74, 78, 52, 72, 66, 64),
    (v_squad, 'Baroš', 'Milan Baroš', 5, 'CA', 81, 86, 82, 74, 46, 76, 64, 76),
    (v_squad, 'Cissé', 'Djibril Cissé', 9, 'CA', 81, 90, 82, 72, 46, 80, 62, 78),
    (v_squad, 'Núñez', 'Antonio Núñez', 27, 'SA', 77, 80, 76, 72, 48, 74, 62, 72);
  end if;

  -- ----------------------------------------------------------------- Manchester United 1999
  select id into v_squad from public.squads
    where tournament_id = v_tournament and display_name = 'Manchester United 1999';
  if v_squad is null then
    insert into public.squads (tournament_id, country_code, country_name, year, display_name, overall)
    values (v_tournament, 'ENG', 'Inglaterra', 1999, 'Manchester United 1999', 90) returning id into v_squad;
    insert into public.players
      (squad_id, first_name, full_name, number, position, overall, pace, shooting, passing, defending, physical, set_piece, penalty) values
    (v_squad, 'Schmeichel', 'Peter Schmeichel', 1, 'GOL', 88, 68, 28, 64, 88, 86, 34, 46),
    (v_squad, 'Van der Gouw', 'Raimond van der Gouw', 17, 'GOL', 76, 58, 24, 52, 76, 77, 28, 36),
    (v_squad, 'Gary Neville', 'Gary Neville', 2, 'LD', 81, 80, 52, 76, 82, 80, 54, 52),
    (v_squad, 'Irwin', 'Denis Irwin', 3, 'LE', 81, 80, 56, 76, 81, 80, 66, 68),
    (v_squad, 'Stam', 'Jaap Stam', 6, 'ZAG', 86, 74, 48, 72, 87, 88, 48, 46),
    (v_squad, 'Johnsen', 'Ronny Johnsen', 5, 'ZAG', 80, 74, 46, 70, 82, 84, 46, 44),
    (v_squad, 'Berg', 'Henning Berg', 12, 'ZAG', 79, 72, 45, 66, 81, 83, 45, 42),
    (v_squad, 'Keane', 'Roy Keane', 16, 'VOL', 88, 80, 72, 84, 86, 88, 68, 72),
    (v_squad, 'Butt', 'Nicky Butt', 8, 'VOL', 80, 74, 60, 78, 80, 82, 58, 56),
    (v_squad, 'Beckham', 'David Beckham', 7, 'PD', 88, 78, 80, 90, 60, 74, 94, 80),
    (v_squad, 'Scholes', 'Paul Scholes', 18, 'MC', 88, 74, 84, 90, 66, 76, 82, 80),
    (v_squad, 'Giggs', 'Ryan Giggs', 11, 'PE', 89, 92, 80, 84, 58, 76, 76, 74),
    (v_squad, 'Sheringham', 'Teddy Sheringham', 10, 'SA', 82, 72, 84, 80, 48, 76, 72, 80),
    (v_squad, 'Yorke', 'Dwight Yorke', 19, 'CA', 85, 84, 86, 80, 48, 78, 66, 80),
    (v_squad, 'Cole', 'Andy Cole', 9, 'CA', 85, 86, 86, 76, 46, 78, 64, 80),
    (v_squad, 'Solskjær', 'Ole Gunnar Solskjær', 20, 'CA', 84, 84, 86, 74, 46, 76, 66, 82);
  end if;

  -- ----------------------------------------------------------------- Bayern 2013
  select id into v_squad from public.squads
    where tournament_id = v_tournament and display_name = 'Bayern 2013';
  if v_squad is null then
    insert into public.squads (tournament_id, country_code, country_name, year, display_name, overall)
    values (v_tournament, 'DEU', 'Alemanha', 2013, 'Bayern 2013', 91) returning id into v_squad;
    insert into public.players
      (squad_id, first_name, full_name, number, position, overall, pace, shooting, passing, defending, physical, set_piece, penalty) values
    (v_squad, 'Neuer', 'Manuel Neuer', 1, 'GOL', 90, 74, 30, 74, 88, 86, 42, 52),
    (v_squad, 'Starke', 'Tom Starke', 22, 'GOL', 76, 58, 24, 54, 76, 78, 28, 36),
    (v_squad, 'Lahm', 'Philipp Lahm', 21, 'LD', 88, 86, 58, 84, 84, 78, 62, 58),
    (v_squad, 'Alaba', 'David Alaba', 27, 'LE', 85, 86, 62, 82, 82, 80, 72, 66),
    (v_squad, 'Boateng', 'Jérôme Boateng', 17, 'ZAG', 85, 82, 48, 76, 86, 88, 48, 46),
    (v_squad, 'Dante', 'Dante Bonfim', 4, 'ZAG', 82, 74, 48, 72, 83, 85, 48, 46),
    (v_squad, 'Van Buyten', 'Daniel van Buyten', 5, 'ZAG', 80, 68, 52, 70, 82, 86, 52, 50),
    (v_squad, 'Schweinsteiger', 'Bastian Schweinsteiger', 31, 'VOL', 88, 76, 74, 88, 82, 84, 80, 78),
    (v_squad, 'Javi Martínez', 'Javi Martínez', 8, 'VOL', 85, 76, 60, 80, 85, 86, 58, 58),
    (v_squad, 'Kroos', 'Toni Kroos', 39, 'MC', 87, 72, 76, 90, 70, 78, 86, 80),
    (v_squad, 'Müller', 'Thomas Müller', 25, 'MEI', 88, 80, 86, 84, 58, 78, 76, 82),
    (v_squad, 'Robben', 'Arjen Robben', 10, 'PD', 90, 92, 86, 84, 52, 72, 74, 80),
    (v_squad, 'Ribéry', 'Franck Ribéry', 7, 'PE', 90, 90, 82, 86, 54, 74, 76, 78),
    (v_squad, 'Shaqiri', 'Xherdan Shaqiri', 11, 'MEI', 81, 86, 78, 82, 52, 70, 74, 72),
    (v_squad, 'Mandžukić', 'Mario Mandžukić', 9, 'CA', 84, 80, 84, 74, 50, 84, 64, 80),
    (v_squad, 'Gómez', 'Mario Gómez', 33, 'CA', 83, 78, 86, 72, 44, 82, 62, 82);
  end if;

  -- ----------------------------------------------------------------- Inter 2010
  select id into v_squad from public.squads
    where tournament_id = v_tournament and display_name = 'Inter 2010';
  if v_squad is null then
    insert into public.squads (tournament_id, country_code, country_name, year, display_name, overall)
    values (v_tournament, 'ITA', 'Itália', 2010, 'Inter 2010', 89) returning id into v_squad;
    insert into public.players
      (squad_id, first_name, full_name, number, position, overall, pace, shooting, passing, defending, physical, set_piece, penalty) values
    (v_squad, 'Júlio César', 'Júlio César', 12, 'GOL', 86, 68, 26, 60, 86, 84, 32, 44),
    (v_squad, 'Toldo', 'Francesco Toldo', 1, 'GOL', 78, 58, 24, 54, 78, 80, 28, 36),
    (v_squad, 'Maicon', 'Maicon Douglas', 13, 'LD', 86, 88, 62, 80, 82, 84, 62, 58),
    (v_squad, 'Chivu', 'Cristian Chivu', 26, 'LE', 80, 76, 50, 72, 81, 82, 50, 48),
    (v_squad, 'Lúcio', 'Lúcio', 6, 'ZAG', 85, 76, 55, 72, 86, 88, 55, 54),
    (v_squad, 'Samuel', 'Walter Samuel', 25, 'ZAG', 84, 72, 46, 72, 86, 86, 48, 46),
    (v_squad, 'Córdoba', 'Iván Córdoba', 2, 'ZAG', 80, 74, 45, 68, 82, 82, 45, 44),
    (v_squad, 'Cambiasso', 'Esteban Cambiasso', 19, 'VOL', 84, 74, 64, 82, 83, 84, 66, 64),
    (v_squad, 'Zanetti', 'Javier Zanetti', 4, 'VOL', 85, 82, 58, 82, 84, 84, 60, 60),
    (v_squad, 'Stanković', 'Dejan Stanković', 5, 'MC', 82, 74, 76, 82, 62, 78, 82, 76),
    (v_squad, 'Muntari', 'Sulley Muntari', 11, 'MC', 80, 80, 68, 78, 72, 82, 66, 64),
    (v_squad, 'Sneijder', 'Wesley Sneijder', 10, 'MEI', 88, 76, 84, 90, 58, 72, 88, 84),
    (v_squad, 'Pandev', 'Goran Pandev', 27, 'PE', 81, 80, 80, 80, 54, 74, 68, 72),
    (v_squad, 'Eto''o', 'Samuel Eto''o', 9, 'PD', 88, 90, 86, 80, 52, 80, 70, 82),
    (v_squad, 'Milito', 'Diego Milito', 22, 'CA', 87, 82, 88, 78, 48, 80, 68, 84),
    (v_squad, 'Balotelli', 'Mario Balotelli', 45, 'CA', 82, 84, 84, 72, 46, 84, 66, 82);
  end if;

  -- ----------------------------------------------------------------- Ajax 1995
  select id into v_squad from public.squads
    where tournament_id = v_tournament and display_name = 'Ajax 1995';
  if v_squad is null then
    insert into public.squads (tournament_id, country_code, country_name, year, display_name, overall)
    values (v_tournament, 'NED', 'Holanda', 1995, 'Ajax 1995', 88) returning id into v_squad;
    insert into public.players
      (squad_id, first_name, full_name, number, position, overall, pace, shooting, passing, defending, physical, set_piece, penalty) values
    (v_squad, 'Van der Sar', 'Edwin van der Sar', 1, 'GOL', 86, 68, 28, 66, 86, 82, 34, 46),
    (v_squad, 'Menzo', 'Stanley Menzo', 16, 'GOL', 76, 58, 24, 52, 76, 76, 28, 36),
    (v_squad, 'Reiziger', 'Michael Reiziger', 2, 'LD', 80, 84, 52, 76, 80, 78, 52, 50),
    (v_squad, 'Bogarde', 'Winston Bogarde', 17, 'LE', 80, 80, 52, 72, 80, 84, 52, 50),
    (v_squad, 'Blind', 'Danny Blind', 4, 'ZAG', 82, 70, 52, 76, 84, 82, 62, 60),
    (v_squad, 'Frank de Boer', 'Frank de Boer', 3, 'ZAG', 84, 72, 55, 82, 85, 82, 72, 66),
    (v_squad, 'Silooy', 'Sonny Silooy', 12, 'ZAG', 78, 70, 45, 66, 80, 80, 45, 44),
    (v_squad, 'Rijkaard', 'Frank Rijkaard', 5, 'VOL', 86, 74, 62, 84, 85, 86, 66, 66),
    (v_squad, 'Davids', 'Edgar Davids', 8, 'VOL', 84, 82, 64, 82, 82, 84, 62, 62),
    (v_squad, 'Seedorf', 'Clarence Seedorf', 6, 'MC', 85, 78, 80, 86, 62, 78, 82, 78),
    (v_squad, 'Ronald de Boer', 'Ronald de Boer', 7, 'MC', 82, 80, 74, 82, 60, 74, 72, 70),
    (v_squad, 'Litmanen', 'Jari Litmanen', 10, 'MEI', 87, 78, 84, 86, 56, 72, 82, 84),
    (v_squad, 'Finidi', 'Finidi George', 11, 'PD', 82, 86, 76, 80, 52, 72, 68, 68),
    (v_squad, 'Overmars', 'Marc Overmars', 9, 'PE', 86, 93, 80, 80, 52, 70, 70, 72),
    (v_squad, 'Kluivert', 'Patrick Kluivert', 14, 'CA', 86, 84, 86, 80, 48, 82, 66, 82),
    (v_squad, 'Kanu', 'Nwankwo Kanu', 15, 'SA', 82, 82, 80, 80, 48, 80, 64, 74);
  end if;

end $$;
