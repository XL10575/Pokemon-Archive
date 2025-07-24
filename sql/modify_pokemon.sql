-- Step 1: Create a new table
CREATE TABLE pokemon_with_pk (
    pokedex_number INTEGER PRIMARY KEY,
    abilities TEXT,
    against_bug INTEGER,
    against_dark INTEGER,
    against_dragon INTEGER,
    against_electric INTEGER,
    against_fairy INTEGER,
    against_fight INTEGER,
    against_fire INTEGER,
    against_flying INTEGER,
    against_ghost INTEGER,
    against_grass INTEGER,
    against_ground INTEGER,
    against_ice INTEGER,
    against_normal INTEGER,
    against_poison INTEGER,
    against_psychic INTEGER,
    against_rock INTEGER,
    against_steel INTEGER,
    against_water INTEGER,
    attack INTEGER,
    capture_rate INTEGER,
    classification TEXT,
    defense INTEGER,
    hp INTEGER,
    japanese_name TEXT,
    name TEXT,
    sp_attack INTEGER,
    sp_defense INTEGER,
    speed INTEGER,
    type1 TEXT,
    type2 TEXT,
    generation INTEGER,
    is_legendary INTEGER
);

-- Step 2: copy all to new table
INSERT INTO pokemon_with_pk (
    pokedex_number, abilities, against_bug, against_dark, against_dragon, 
    against_electric, against_fairy, against_fight, against_fire, against_flying, 
    against_ghost, against_grass, against_ground, against_ice, against_normal, 
    against_poison, against_psychic, against_rock, against_steel, against_water, 
    attack, capture_rate, classification, defense, hp, japanese_name, name, 
    sp_attack, sp_defense, speed, type1, type2, generation, is_legendary
)
SELECT 
    pokedex_number, abilities, against_bug, against_dark, against_dragon, 
    against_electric, against_fairy, against_fight, against_fire, against_flying, 
    against_ghost, against_grass, against_ground, against_ice, against_normal, 
    against_poison, against_psychic, against_rock, against_steel, against_water, 
    attack, capture_rate, classfication, defense, hp, japanese_name, name, 
    sp_attack, sp_defense, speed, type1, type2, generation, is_legendary
FROM pokemon;

-- Step 3: delete origin table
DROP TABLE pokemon;

-- Step 4: rename table
ALTER TABLE pokemon_with_pk RENAME TO pokemon;

-- test if success
PRAGMA table_info(pokemon);