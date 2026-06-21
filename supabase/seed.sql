-- =====================================================================
-- Lendas — Seed inicial (MVP: Copa do Mundo)
-- Aplicar DEPOIS do schema.sql.
--
-- Idempotente: pode ser rodado mais de uma vez sem duplicar dados.
--   - O tournament usa ON CONFLICT (slug).
--   - Cada squad só é inserido (com seus jogadores) se ainda não existir,
--     evitando duplicação de forma não-destrutiva.
--
-- Nomes reais e conhecidos, sem fotos/escudos/logos.
-- Posições em português: GOL, ZAG, LE, LD, VOL, MC, MEI, PE, PD, SA, CA.
-- =====================================================================

do $$
declare
  v_tournament uuid;
  v_squad uuid;
begin
  -- -----------------------------------------------------------------
  -- Tournament
  -- -----------------------------------------------------------------
  insert into public.tournaments (slug, name, type, is_active)
  values ('world-cup', 'Copa do Mundo', 'international', true)
  on conflict (slug) do nothing;

  select id into v_tournament from public.tournaments where slug = 'world-cup';

  -- -----------------------------------------------------------------
  -- Brasil 2002
  -- -----------------------------------------------------------------
  select id into v_squad from public.squads
    where tournament_id = v_tournament and display_name = 'Brasil 2002';
  if v_squad is null then
    insert into public.squads (tournament_id, country_code, country_name, year, display_name, overall)
    values (v_tournament, 'BRA', 'Brasil', 2002, 'Brasil 2002', 92)
    returning id into v_squad;

    insert into public.players
      (squad_id, first_name, full_name, number, position, overall, pace, shooting, passing, defending, physical, set_piece, penalty) values
    (v_squad, 'Marcos', 'Marcos', 1, 'GOL', 86, 60, 25, 55, 86, 82, 30, 40),
    (v_squad, 'Dida', 'Dida', 12, 'GOL', 85, 62, 25, 56, 85, 84, 30, 40),
    (v_squad, 'Cafu', 'Cafu', 2, 'LD', 88, 88, 60, 80, 84, 82, 60, 55),
    (v_squad, 'Belletti', 'Juliano Belletti', 15, 'LD', 82, 80, 58, 74, 80, 80, 55, 50),
    (v_squad, 'Roberto Carlos', 'Roberto Carlos', 6, 'LE', 90, 92, 78, 78, 82, 85, 90, 70),
    (v_squad, 'Lúcio', 'Lúcio', 3, 'ZAG', 87, 78, 55, 70, 88, 88, 55, 55),
    (v_squad, 'Roque Júnior', 'Roque Júnior', 4, 'ZAG', 82, 72, 45, 66, 83, 82, 45, 45),
    (v_squad, 'Edmílson', 'Edmílson', 14, 'ZAG', 83, 74, 50, 74, 82, 80, 50, 50),
    (v_squad, 'Gilberto Silva', 'Gilberto Silva', 8, 'VOL', 84, 72, 55, 78, 84, 82, 55, 55),
    (v_squad, 'Vampeta', 'Vampeta', 17, 'VOL', 80, 70, 55, 74, 78, 80, 55, 55),
    (v_squad, 'Kléberson', 'Kléberson', 19, 'MC', 81, 78, 62, 78, 76, 78, 65, 60),
    (v_squad, 'Juninho', 'Juninho Paulista', 13, 'MC', 83, 76, 75, 84, 60, 68, 88, 75),
    (v_squad, 'Rivaldo', 'Rivaldo', 10, 'MEI', 91, 80, 88, 86, 60, 78, 88, 88),
    (v_squad, 'Ronaldinho', 'Ronaldinho Gaúcho', 11, 'PE', 90, 88, 84, 88, 55, 76, 88, 82),
    (v_squad, 'Denílson', 'Denílson', 21, 'PD', 82, 90, 70, 76, 50, 68, 70, 65),
    (v_squad, 'Ronaldo', 'Ronaldo', 9, 'CA', 94, 94, 94, 80, 45, 84, 80, 90);
  end if;

  -- -----------------------------------------------------------------
  -- Brasil 1994
  -- -----------------------------------------------------------------
  select id into v_squad from public.squads
    where tournament_id = v_tournament and display_name = 'Brasil 1994';
  if v_squad is null then
    insert into public.squads (tournament_id, country_code, country_name, year, display_name, overall)
    values (v_tournament, 'BRA', 'Brasil', 1994, 'Brasil 1994', 90)
    returning id into v_squad;

    insert into public.players
      (squad_id, first_name, full_name, number, position, overall, pace, shooting, passing, defending, physical, set_piece, penalty) values
    (v_squad, 'Taffarel', 'Cláudio Taffarel', 1, 'GOL', 85, 60, 25, 55, 85, 80, 30, 40),
    (v_squad, 'Zetti', 'Zetti', 12, 'GOL', 80, 58, 24, 52, 80, 78, 28, 38),
    (v_squad, 'Jorginho', 'Jorginho', 2, 'LD', 83, 82, 58, 78, 80, 78, 60, 55),
    (v_squad, 'Cafu', 'Cafu', 14, 'LD', 84, 86, 58, 78, 80, 80, 58, 52),
    (v_squad, 'Branco', 'Branco', 6, 'LE', 83, 76, 72, 76, 80, 82, 85, 70),
    (v_squad, 'Leonardo', 'Leonardo', 16, 'LE', 84, 84, 72, 82, 70, 74, 75, 68),
    (v_squad, 'Márcio Santos', 'Márcio Santos', 3, 'ZAG', 81, 72, 45, 66, 82, 82, 45, 45),
    (v_squad, 'Ricardo Rocha', 'Ricardo Rocha', 4, 'ZAG', 80, 70, 42, 64, 81, 81, 42, 42),
    (v_squad, 'Aldair', 'Aldair', 13, 'ZAG', 85, 76, 50, 72, 86, 84, 50, 48),
    (v_squad, 'Mauro Silva', 'Mauro Silva', 5, 'VOL', 84, 70, 50, 76, 84, 82, 50, 50),
    (v_squad, 'Dunga', 'Dunga', 8, 'VOL', 85, 70, 58, 80, 84, 84, 60, 60),
    (v_squad, 'Zinho', 'Zinho', 17, 'MC', 82, 80, 66, 80, 70, 74, 70, 65),
    (v_squad, 'Mazinho', 'Mazinho', 11, 'MC', 81, 80, 62, 78, 74, 76, 62, 60),
    (v_squad, 'Raí', 'Raí', 10, 'MEI', 85, 76, 80, 84, 60, 74, 85, 80),
    (v_squad, 'Bebeto', 'Bebeto', 7, 'SA', 88, 86, 86, 78, 50, 72, 75, 80),
    (v_squad, 'Romário', 'Romário', 9, 'CA', 93, 90, 92, 80, 40, 74, 70, 88);
  end if;

  -- -----------------------------------------------------------------
  -- Argentina 1986
  -- -----------------------------------------------------------------
  select id into v_squad from public.squads
    where tournament_id = v_tournament and display_name = 'Argentina 1986';
  if v_squad is null then
    insert into public.squads (tournament_id, country_code, country_name, year, display_name, overall)
    values (v_tournament, 'ARG', 'Argentina', 1986, 'Argentina 1986', 91)
    returning id into v_squad;

    insert into public.players
      (squad_id, first_name, full_name, number, position, overall, pace, shooting, passing, defending, physical, set_piece, penalty) values
    (v_squad, 'Pumpido', 'Nery Pumpido', 1, 'GOL', 83, 60, 25, 55, 83, 80, 30, 40),
    (v_squad, 'Islas', 'Luis Islas', 12, 'GOL', 79, 60, 24, 52, 79, 77, 28, 36),
    (v_squad, 'Cuciuffo', 'José Luis Cuciuffo', 13, 'LD', 79, 76, 45, 66, 80, 80, 45, 45),
    (v_squad, 'Clausen', 'José Luis Clausen', 2, 'LD', 78, 76, 44, 66, 79, 80, 44, 44),
    (v_squad, 'Ruggeri', 'Oscar Ruggeri', 19, 'ZAG', 84, 74, 48, 68, 85, 84, 48, 46),
    (v_squad, 'Brown', 'José Luis Brown', 6, 'ZAG', 82, 70, 46, 66, 83, 83, 46, 44),
    (v_squad, 'Olarticoechea', 'Julio Olarticoechea', 16, 'LE', 81, 78, 55, 72, 79, 80, 55, 52),
    (v_squad, 'Garré', 'Oscar Garré', 3, 'LE', 78, 74, 48, 68, 78, 78, 48, 46),
    (v_squad, 'Giusti', 'Ricardo Giusti', 14, 'VOL', 82, 76, 58, 76, 82, 82, 58, 56),
    (v_squad, 'Batista', 'Sergio Batista', 5, 'VOL', 81, 72, 55, 74, 80, 80, 55, 54),
    (v_squad, 'Burruchaga', 'Jorge Burruchaga', 7, 'MC', 85, 80, 78, 84, 66, 74, 78, 75),
    (v_squad, 'Enrique', 'Héctor Enrique', 15, 'MC', 83, 78, 68, 80, 72, 78, 68, 66),
    (v_squad, 'Borghi', 'Claudio Borghi', 20, 'MEI', 80, 78, 72, 80, 55, 70, 72, 70),
    (v_squad, 'Maradona', 'Diego Maradona', 10, 'MEI', 97, 90, 90, 94, 55, 75, 92, 90),
    (v_squad, 'Valdano', 'Jorge Valdano', 11, 'SA', 86, 82, 84, 80, 55, 80, 72, 78),
    (v_squad, 'Pasculli', 'Pedro Pasculli', 17, 'CA', 81, 82, 80, 72, 45, 72, 65, 72);
  end if;

  -- -----------------------------------------------------------------
  -- Argentina 2022
  -- -----------------------------------------------------------------
  select id into v_squad from public.squads
    where tournament_id = v_tournament and display_name = 'Argentina 2022';
  if v_squad is null then
    insert into public.squads (tournament_id, country_code, country_name, year, display_name, overall)
    values (v_tournament, 'ARG', 'Argentina', 2022, 'Argentina 2022', 92)
    returning id into v_squad;

    insert into public.players
      (squad_id, first_name, full_name, number, position, overall, pace, shooting, passing, defending, physical, set_piece, penalty) values
    (v_squad, 'Emiliano', 'Emiliano Martínez', 23, 'GOL', 87, 68, 28, 60, 86, 86, 35, 45),
    (v_squad, 'Armani', 'Franco Armani', 1, 'GOL', 80, 62, 25, 55, 80, 80, 30, 40),
    (v_squad, 'Molina', 'Nahuel Molina', 26, 'LD', 82, 88, 55, 76, 80, 78, 55, 52),
    (v_squad, 'Montiel', 'Gonzalo Montiel', 4, 'LD', 80, 84, 52, 74, 79, 78, 52, 50),
    (v_squad, 'Romero', 'Cristian Romero', 13, 'ZAG', 86, 80, 50, 74, 86, 86, 50, 48),
    (v_squad, 'Otamendi', 'Nicolás Otamendi', 19, 'ZAG', 84, 76, 50, 72, 84, 85, 50, 48),
    (v_squad, 'Tagliafico', 'Nicolás Tagliafico', 3, 'LE', 81, 82, 52, 74, 80, 78, 52, 50),
    (v_squad, 'Acuña', 'Marcos Acuña', 8, 'LE', 83, 84, 58, 78, 82, 80, 58, 55),
    (v_squad, 'De Paul', 'Rodrigo De Paul', 7, 'VOL', 86, 82, 72, 84, 80, 82, 72, 70),
    (v_squad, 'Paredes', 'Leandro Paredes', 5, 'VOL', 83, 72, 68, 84, 78, 80, 80, 72),
    (v_squad, 'Enzo', 'Enzo Fernández', 24, 'MC', 85, 80, 74, 86, 76, 80, 74, 72),
    (v_squad, 'Alexis', 'Alexis Mac Allister', 20, 'MC', 85, 80, 76, 85, 74, 80, 76, 74),
    (v_squad, 'Di María', 'Ángel Di María', 11, 'PD', 88, 86, 82, 86, 60, 72, 82, 80),
    (v_squad, 'Messi', 'Lionel Messi', 10, 'MEI', 96, 85, 92, 94, 50, 68, 92, 92),
    (v_squad, 'Julián', 'Julián Álvarez', 9, 'CA', 85, 88, 84, 80, 55, 78, 72, 80),
    (v_squad, 'Lautaro', 'Lautaro Martínez', 22, 'CA', 85, 86, 84, 76, 50, 82, 72, 82);
  end if;

  -- -----------------------------------------------------------------
  -- França 1998
  -- -----------------------------------------------------------------
  select id into v_squad from public.squads
    where tournament_id = v_tournament and display_name = 'França 1998';
  if v_squad is null then
    insert into public.squads (tournament_id, country_code, country_name, year, display_name, overall)
    values (v_tournament, 'FRA', 'França', 1998, 'França 1998', 91)
    returning id into v_squad;

    insert into public.players
      (squad_id, first_name, full_name, number, position, overall, pace, shooting, passing, defending, physical, set_piece, penalty) values
    (v_squad, 'Barthez', 'Fabien Barthez', 16, 'GOL', 86, 68, 28, 60, 85, 82, 35, 45),
    (v_squad, 'Lama', 'Bernard Lama', 1, 'GOL', 79, 60, 25, 55, 79, 78, 30, 38),
    (v_squad, 'Thuram', 'Lilian Thuram', 15, 'LD', 87, 84, 52, 76, 86, 86, 52, 50),
    (v_squad, 'Lizarazu', 'Bixente Lizarazu', 3, 'LE', 85, 84, 58, 78, 82, 80, 58, 55),
    (v_squad, 'Blanc', 'Laurent Blanc', 5, 'ZAG', 85, 72, 55, 76, 85, 84, 60, 58),
    (v_squad, 'Desailly', 'Marcel Desailly', 8, 'ZAG', 87, 78, 52, 74, 87, 88, 52, 50),
    (v_squad, 'Leboeuf', 'Frank Leboeuf', 18, 'ZAG', 82, 72, 55, 74, 82, 82, 60, 58),
    (v_squad, 'Karembeu', 'Christian Karembeu', 14, 'VOL', 81, 82, 55, 76, 80, 82, 55, 54),
    (v_squad, 'Deschamps', 'Didier Deschamps', 7, 'VOL', 84, 74, 58, 80, 82, 80, 58, 58),
    (v_squad, 'Petit', 'Emmanuel Petit', 17, 'MC', 84, 76, 68, 82, 80, 82, 72, 70),
    (v_squad, 'Zidane', 'Zinédine Zidane', 10, 'MEI', 95, 76, 84, 94, 62, 80, 88, 85),
    (v_squad, 'Djorkaeff', 'Youri Djorkaeff', 6, 'MEI', 86, 80, 82, 84, 62, 74, 80, 80),
    (v_squad, 'Henry', 'Thierry Henry', 12, 'PD', 85, 92, 82, 78, 50, 76, 70, 78),
    (v_squad, 'Dugarry', 'Christophe Dugarry', 11, 'SA', 80, 80, 76, 74, 48, 76, 65, 72),
    (v_squad, 'Trezeguet', 'David Trezeguet', 20, 'CA', 84, 82, 84, 72, 45, 80, 68, 80),
    (v_squad, 'Guivarc''h', 'Stéphane Guivarc''h', 9, 'CA', 79, 80, 76, 70, 45, 76, 60, 72);
  end if;

  -- -----------------------------------------------------------------
  -- França 2018
  -- -----------------------------------------------------------------
  select id into v_squad from public.squads
    where tournament_id = v_tournament and display_name = 'França 2018';
  if v_squad is null then
    insert into public.squads (tournament_id, country_code, country_name, year, display_name, overall)
    values (v_tournament, 'FRA', 'França', 2018, 'França 2018', 92)
    returning id into v_squad;

    insert into public.players
      (squad_id, first_name, full_name, number, position, overall, pace, shooting, passing, defending, physical, set_piece, penalty) values
    (v_squad, 'Lloris', 'Hugo Lloris', 1, 'GOL', 87, 72, 28, 62, 86, 82, 35, 45),
    (v_squad, 'Mandanda', 'Steve Mandanda', 16, 'GOL', 80, 66, 25, 56, 80, 80, 30, 40),
    (v_squad, 'Pavard', 'Benjamin Pavard', 2, 'LD', 83, 82, 55, 76, 82, 82, 55, 52),
    (v_squad, 'Lucas', 'Lucas Hernández', 21, 'LE', 84, 86, 58, 78, 82, 82, 58, 55),
    (v_squad, 'Varane', 'Raphaël Varane', 4, 'ZAG', 87, 84, 50, 76, 87, 86, 50, 48),
    (v_squad, 'Umtiti', 'Samuel Umtiti', 5, 'ZAG', 84, 80, 50, 74, 84, 84, 50, 48),
    (v_squad, 'Kimpembe', 'Presnel Kimpembe', 3, 'ZAG', 82, 80, 48, 72, 83, 84, 48, 46),
    (v_squad, 'Kanté', 'N''Golo Kanté', 13, 'VOL', 88, 84, 55, 80, 88, 82, 55, 55),
    (v_squad, 'Pogba', 'Paul Pogba', 6, 'MC', 88, 80, 78, 86, 78, 86, 80, 78),
    (v_squad, 'Matuidi', 'Blaise Matuidi', 14, 'MC', 83, 80, 62, 80, 80, 82, 62, 60),
    (v_squad, 'Tolisso', 'Corentin Tolisso', 12, 'MC', 81, 80, 70, 80, 74, 80, 70, 68),
    (v_squad, 'Fekir', 'Nabil Fekir', 18, 'MEI', 82, 82, 80, 82, 55, 72, 78, 76),
    (v_squad, 'Griezmann', 'Antoine Griezmann', 7, 'SA', 89, 84, 86, 86, 58, 74, 82, 85),
    (v_squad, 'Mbappé', 'Kylian Mbappé', 10, 'PD', 91, 97, 86, 80, 52, 80, 72, 82),
    (v_squad, 'Dembélé', 'Ousmane Dembélé', 11, 'PE', 83, 92, 78, 80, 50, 68, 70, 72),
    (v_squad, 'Giroud', 'Olivier Giroud', 9, 'CA', 84, 72, 82, 76, 55, 86, 68, 80);
  end if;

  -- -----------------------------------------------------------------
  -- Alemanha 2014
  -- -----------------------------------------------------------------
  select id into v_squad from public.squads
    where tournament_id = v_tournament and display_name = 'Alemanha 2014';
  if v_squad is null then
    insert into public.squads (tournament_id, country_code, country_name, year, display_name, overall)
    values (v_tournament, 'DEU', 'Alemanha', 2014, 'Alemanha 2014', 91)
    returning id into v_squad;

    insert into public.players
      (squad_id, first_name, full_name, number, position, overall, pace, shooting, passing, defending, physical, set_piece, penalty) values
    (v_squad, 'Neuer', 'Manuel Neuer', 1, 'GOL', 90, 72, 30, 72, 88, 86, 40, 50),
    (v_squad, 'Weidenfeller', 'Roman Weidenfeller', 12, 'GOL', 79, 62, 25, 56, 79, 80, 30, 40),
    (v_squad, 'Lahm', 'Philipp Lahm', 16, 'LD', 88, 86, 58, 84, 84, 78, 62, 58),
    (v_squad, 'Höwedes', 'Benedikt Höwedes', 21, 'LE', 81, 76, 48, 74, 82, 82, 48, 46),
    (v_squad, 'Boateng', 'Jérôme Boateng', 17, 'ZAG', 85, 80, 50, 76, 86, 88, 50, 48),
    (v_squad, 'Hummels', 'Mats Hummels', 5, 'ZAG', 87, 76, 55, 80, 87, 86, 55, 52),
    (v_squad, 'Mertesacker', 'Per Mertesacker', 4, 'ZAG', 82, 62, 48, 72, 84, 86, 48, 46),
    (v_squad, 'Khedira', 'Sami Khedira', 6, 'VOL', 84, 80, 62, 80, 82, 84, 62, 60),
    (v_squad, 'Schweinsteiger', 'Bastian Schweinsteiger', 7, 'VOL', 88, 76, 72, 86, 82, 84, 78, 74),
    (v_squad, 'Kroos', 'Toni Kroos', 18, 'MC', 88, 72, 78, 90, 72, 78, 86, 80),
    (v_squad, 'Götze', 'Mario Götze', 19, 'MEI', 84, 84, 80, 82, 58, 72, 76, 76),
    (v_squad, 'Özil', 'Mesut Özil', 8, 'MEI', 88, 80, 78, 90, 55, 70, 82, 80),
    (v_squad, 'Müller', 'Thomas Müller', 13, 'SA', 88, 80, 86, 82, 58, 78, 75, 82),
    (v_squad, 'Schürrle', 'André Schürrle', 9, 'PE', 82, 88, 80, 78, 50, 74, 70, 74),
    (v_squad, 'Podolski', 'Lukas Podolski', 10, 'PE', 83, 82, 82, 76, 50, 78, 80, 76),
    (v_squad, 'Klose', 'Miroslav Klose', 11, 'CA', 84, 72, 84, 74, 48, 80, 68, 80);
  end if;

  -- -----------------------------------------------------------------
  -- Espanha 2010
  -- -----------------------------------------------------------------
  select id into v_squad from public.squads
    where tournament_id = v_tournament and display_name = 'Espanha 2010';
  if v_squad is null then
    insert into public.squads (tournament_id, country_code, country_name, year, display_name, overall)
    values (v_tournament, 'ESP', 'Espanha', 2010, 'Espanha 2010', 91)
    returning id into v_squad;

    insert into public.players
      (squad_id, first_name, full_name, number, position, overall, pace, shooting, passing, defending, physical, set_piece, penalty) values
    (v_squad, 'Casillas', 'Iker Casillas', 1, 'GOL', 89, 74, 28, 64, 88, 80, 38, 48),
    (v_squad, 'Valdés', 'Víctor Valdés', 23, 'GOL', 83, 68, 26, 60, 83, 80, 32, 42),
    (v_squad, 'Ramos', 'Sergio Ramos', 15, 'LD', 88, 84, 55, 78, 87, 86, 60, 58),
    (v_squad, 'Capdevila', 'Joan Capdevila', 11, 'LE', 81, 78, 52, 74, 80, 80, 52, 50),
    (v_squad, 'Piqué', 'Gerard Piqué', 3, 'ZAG', 86, 72, 55, 80, 86, 86, 55, 52),
    (v_squad, 'Puyol', 'Carles Puyol', 5, 'ZAG', 86, 78, 50, 74, 87, 86, 50, 48),
    (v_squad, 'Albiol', 'Raúl Albiol', 17, 'ZAG', 80, 72, 45, 70, 81, 82, 45, 44),
    (v_squad, 'Busquets', 'Sergio Busquets', 16, 'VOL', 85, 68, 55, 84, 82, 80, 55, 55),
    (v_squad, 'Xabi', 'Xabi Alonso', 14, 'VOL', 86, 70, 72, 88, 78, 80, 85, 78),
    (v_squad, 'Xavi', 'Xavi Hernández', 8, 'MC', 90, 72, 72, 94, 68, 72, 82, 76),
    (v_squad, 'Cesc', 'Cesc Fàbregas', 10, 'MC', 85, 80, 76, 86, 66, 76, 78, 76),
    (v_squad, 'Iniesta', 'Andrés Iniesta', 6, 'MEI', 90, 80, 78, 92, 62, 72, 80, 78),
    (v_squad, 'Silva', 'David Silva', 21, 'MEI', 87, 82, 80, 88, 55, 68, 80, 78),
    (v_squad, 'Pedro', 'Pedro Rodríguez', 18, 'PD', 83, 88, 76, 80, 55, 72, 68, 72),
    (v_squad, 'Villa', 'David Villa', 7, 'CA', 88, 84, 88, 80, 50, 76, 80, 85),
    (v_squad, 'Torres', 'Fernando Torres', 9, 'CA', 86, 86, 84, 76, 48, 80, 70, 80);
  end if;

end $$;
