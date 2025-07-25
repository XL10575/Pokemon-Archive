# Database Queries Documentation

## Pokemon Archive System - Complete Database Query Reference

This document provides a comprehensive list of all database queries used in the Pokemon Archive System project.

---

## Table of Contents

1. [Database Connection](#database-connection)
2. [User Authentication Queries](#user-authentication-queries)
3. [Pokemon Management Queries](#pokemon-management-queries)
4. [Inventory & Item Management Queries](#inventory--item-management-queries)
5. [Guild Management Queries](#guild-management-queries)
6. [Game Records Queries](#game-records-queries)
7. [Database Schema Queries](#database-schema-queries)
8. [Data Insertion Queries](#data-insertion-queries)

---

## Database Connection

### Connection Function
**File:** `app.py`
```python
def get_db_connection():
    db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'pokemon.db')
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn
```

---

## User Authentication Queries

### Login Verification
**File:** `app.py` - `/` route
```sql
SELECT * FROM User WHERE username = ? AND password_hash = ?
```

### User Registration
**File:** `app.py` - `/register` route

#### Check Existing Username
```sql
SELECT * FROM User WHERE username = ?
```

#### Insert New User
```sql
INSERT INTO User (username, password_hash) VALUES (?, ?)
```

#### Create Trainer Profile
```sql
INSERT INTO Trainer (TrainerID, UserID, Name) VALUES (?, ?, ?)
```

---

## Pokemon Management Queries

### Get User's Pokemon Collection
**File:** `app.py` - `/pokemon` route

#### Get Trainer ID
```sql
SELECT TrainerID FROM Trainer WHERE UserID = ?
```

#### Get Owned Pokemon
```sql
SELECT p.*, pc.catch_date, pc.nickname, pc.CatchID 
FROM pokemon p 
JOIN Pokemon_Catch pc ON p.pokedex_number = pc.PID 
WHERE pc.TrainerID = ?
```

### Get All Pokemon (Pokedex)
**File:** `app.py` - `/pokedex` route
```sql
SELECT * FROM pokemon ORDER BY pokedex_number
```

### Get Pokemon Details
**File:** `app.py` - `/pokemon/<int:pokemon_id>` route

#### Get Pokemon Info
```sql
SELECT * FROM pokemon WHERE pokedex_number = ?
```

#### Check User Ownership
```sql
SELECT * FROM Pokemon_Catch 
WHERE TrainerID = ? AND PID = ?
```

### Add Pokemon to Collection
**File:** `app.py` - `/add_pokemon/<int:pokemon_id>` route

#### Verify Pokemon Exists
```sql
SELECT * FROM pokemon WHERE pokedex_number = ?
```

#### Add to Collection
```sql
INSERT INTO Pokemon_Catch (TrainerID, PID, catch_date, nickname)
VALUES (?, ?, datetime('now'), ?)
```

### Update Pokemon Nickname
**File:** `app.py` - `/update_nickname/<int:catch_id>` route

#### Verify Ownership
```sql
SELECT * FROM Pokemon_Catch 
WHERE CatchID = ? AND TrainerID = ?
```

#### Update Nickname
```sql
UPDATE Pokemon_Catch 
SET nickname = ? 
WHERE CatchID = ? AND TrainerID = ?
```

### Release Pokemon
**File:** `app.py` - `/release_pokemon/<int:catch_id>` route

#### Get Pokemon Info for Release
```sql
SELECT pc.*, p.name FROM Pokemon_Catch pc
JOIN pokemon p ON pc.PID = p.pokedex_number
WHERE pc.CatchID = ? AND pc.TrainerID = ?
```

#### Delete Pokemon from Collection
```sql
DELETE FROM Pokemon_Catch 
WHERE CatchID = ? AND TrainerID = ?
```

---

## Inventory & Item Management Queries

### Get All Items (Inventory View)
**File:** `app.py` - `/inventory` route

#### Get All Available Items
```sql
SELECT * FROM Item ORDER BY ItemID
```

#### Get User's Items
```sql
SELECT i.* FROM Item i
JOIN Bag_Wear bw ON i.ItemID = bw.ItemID
WHERE bw.TrainerID = ?
```

### Add Item to Inventory
**File:** `app.py` - `/add_item/<int:item_id>` route

#### Check Item Exists
```sql
SELECT * FROM Item WHERE ItemID = ?
```

#### Check Existing Quantity
```sql
SELECT quantity FROM Bag_Wear WHERE TrainerID = ? AND ItemID = ?
```

#### Update Existing Item Quantity
```sql
UPDATE Bag_Wear SET quantity = ? WHERE TrainerID = ? AND ItemID = ?
```

#### Add New Item
```sql
INSERT INTO Bag_Wear (TrainerID, ItemID, quantity) VALUES (?, ?, 1)
```

### Get User's Bag Items
**File:** `app.py` - `/bag` route
```sql
SELECT i.*, bw.quantity FROM Item i
JOIN Bag_Wear bw ON i.ItemID = bw.ItemID
WHERE bw.TrainerID = ?
ORDER BY i.categories, i.name
```

### Update Item Quantity
**File:** `app.py` - `/update_item_quantity/<int:item_id>` route

#### Get Current Quantity
```sql
SELECT quantity FROM Bag_Wear WHERE TrainerID = ? AND ItemID = ?
```

#### Remove Item (when quantity <= 0)
```sql
DELETE FROM Bag_Wear WHERE TrainerID = ? AND ItemID = ?
```

#### Update Quantity
```sql
UPDATE Bag_Wear SET quantity = ? WHERE TrainerID = ? AND ItemID = ?
```

### Remove Item from Bag
**File:** `app.py` - `/remove_item/<int:item_id>` route
```sql
DELETE FROM Bag_Wear WHERE TrainerID = ? AND ItemID = ?
```

---

## Guild Management Queries

### Get Guild Information
**File:** `app.py` - `/guild` route

#### Get User's Current Guild
```sql
SELECT g.*, t.Name as trainer_name
FROM Guild g
JOIN Trainer t ON g.GuildID = t.GuildID
WHERE t.UserID = ?
```

#### Get All Guilds with Member Info
```sql
SELECT g.GuildID, g.name, g.Region,
       COUNT(t.TrainerID) as member_count,
       GROUP_CONCAT(t.Name, ',') as member_names
FROM Guild g
LEFT JOIN Trainer t ON g.GuildID = t.GuildID
GROUP BY g.GuildID, g.name, g.Region
ORDER BY g.GuildID
```

### Create New Guild
**File:** `app.py` - `/add_guild` route

#### Check Guild Name Exists
```sql
SELECT GuildID FROM Guild WHERE name = ?
```

#### Insert New Guild
```sql
INSERT INTO Guild (name, Region) VALUES (?, ?)
```

### Join Guild
**File:** `app.py` - `/join_guild` route

#### Get Trainer Info
```sql
SELECT TrainerID, GuildID FROM Trainer WHERE UserID = ?
```

#### Verify Guild Exists
```sql
SELECT GuildID FROM Guild WHERE GuildID = ?
```

#### Join Guild
```sql
UPDATE Trainer SET GuildID = ? WHERE UserID = ?
```

### Leave Guild
**File:** `app.py` - `/leave_guild` route

#### Check Current Guild Membership
```sql
SELECT TrainerID, GuildID FROM Trainer WHERE UserID = ?
```

#### Leave Guild
```sql
UPDATE Trainer SET GuildID = NULL WHERE UserID = ?
```

---

## Game Records Queries

### Get Game Records
**File:** `app.py` - `/game` route

#### Get All Games with Trainer Names
```sql
SELECT g.*, 
       c.Name as challenger_name, 
       a.Name as accepter_name,
       w.Name as winner_name
FROM Game g
LEFT JOIN Trainer c ON g.ChallengerID = c.TrainerID
LEFT JOIN Trainer a ON g.AccepterID = a.TrainerID
LEFT JOIN Trainer w ON g.winner_id = w.TrainerID
ORDER BY g.GameID DESC
```

#### Get All Trainers
```sql
SELECT TrainerID, Name FROM Trainer ORDER BY Name
```

### Add Game Record
**File:** `app.py` - `/add_game` route

#### Verify Challenger Exists
```sql
SELECT TrainerID FROM Trainer WHERE TrainerID = ?
```

#### Verify Accepter Exists
```sql
SELECT TrainerID FROM Trainer WHERE TrainerID = ?
```

#### Insert Game Record
```sql
INSERT INTO Game (ChallengerID, AccepterID, winner_id) VALUES (?, ?, ?)
```

---

## Database Schema Queries

### Table Creation Scripts
**File:** `sql/create_tables_without_pokemon.sql`

#### Guild Table
```sql
CREATE TABLE Guild (
    GuildID INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    Region TEXT
);
```

#### Item Table
```sql
CREATE TABLE Item (
    ItemID INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    categories TEXT,
    effect TEXT
);
```

#### Bag_Wear Table
```sql
CREATE TABLE Bag_Wear (
    BagID INTEGER PRIMARY KEY AUTOINCREMENT,
    TrainerID INTEGER NOT NULL,
    ItemID INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (TrainerID) REFERENCES Trainer(TrainerID),
    FOREIGN KEY (ItemID) REFERENCES Item(ItemID)
);
```

### User Authentication Tables
**File:** `sql/add_table_user_for_login.sql`

#### User Table
```sql
CREATE TABLE User (
    UserID INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL
);
```

### Pokemon Table Modification
**File:** `sql/modify_pokemon.sql`

#### Create New Pokemon Table with Primary Key
```sql
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
    classfication TEXT,
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
```

#### Copy Data from Original Table
```sql
INSERT INTO pokemon_with_pk SELECT 
    pokedex_number, abilities, against_bug, against_dark, against_dragon, 
    against_electric, against_fairy, against_fight, against_fire, against_flying, 
    against_ghost, against_grass, against_ground, against_ice, against_normal, 
    against_poison, against_psychic, against_rock, against_steel, against_water, 
    attack, capture_rate, classfication, defense, hp, japanese_name, name, 
    sp_attack, sp_defense, speed, type1, type2, generation, is_legendary
FROM pokemon;
```

#### Drop Original Table and Rename
```sql
DROP TABLE pokemon;
ALTER TABLE pokemon_with_pk RENAME TO pokemon;
```

### Table Updates
**File:** `sql/update_bag_wear_table.sql`

#### Add Quantity Column
```sql
ALTER TABLE Bag_Wear ADD COLUMN quantity INTEGER DEFAULT 1;
```

#### Update Existing Records
```sql
UPDATE Bag_Wear SET quantity = 1 WHERE quantity IS NULL;
```

---

## Data Insertion Queries

### Item Data Insertion
**File:** `sql/insert_items.sql`

#### Insert Items (Sample)
```sql
INSERT INTO Item (ItemID, name, categories, effect) VALUES
(1, 'Ability Urge', 'Battle Items', 'When used, it activates the Ability of an ally Pokémon.'),
(2, 'Aux Evasion', 'Battle Items', 'Makes moves less likely to strike a Pokémon during a battle.'),
(3, 'Bold Mint', 'Battle Items', 'Changes the Pokémon''s stats to match the Bold nature.'),
-- ... (35 total items)
(35, 'Ultra Ball', 'Pokeballs', 'Catches wild Pokémon with 2x the rate of a Poké Ball.');
```

### Guild Data Insertion
**File:** `sql/guild_data.sql`

#### Insert Sample Guilds
```sql
INSERT INTO Guild (name, Region) VALUES ('Kanto Explorers', 'Kanto');
INSERT INTO Guild (name, Region) VALUES ('Johto Guardians', 'Johto');
INSERT INTO Guild (name, Region) VALUES ('Hoenn Rangers', 'Hoenn');
INSERT INTO Guild (name, Region) VALUES ('Sinnoh Champions', 'Sinnoh');
INSERT INTO Guild (name, Region) VALUES ('Unova Legends', 'Unova');
INSERT INTO Guild (name, Region) VALUES ('Kalos Knights', 'Kalos');
INSERT INTO Guild (name, Region) VALUES ('Alola Island Challengers', 'Alola');
INSERT INTO Guild (name, Region) VALUES ('Galar Pioneers', 'Galar');
```

---

## Summary

This Pokemon Archive System uses **SQLite** as its database engine and implements a comprehensive set of queries covering:

- **User Management**: Authentication, registration, and trainer profiles
- **Pokemon Collection**: Adding, viewing, updating, and releasing Pokemon
- **Inventory System**: Item management with quantity tracking
- **Guild System**: Creating, joining, and leaving guilds
- **Game Records**: Battle history tracking
- **Database Schema**: Table creation and modification scripts

**Total Query Categories**: 6 main functional areas  
**Total SQL Files**: 6 schema/data files  
**Database Engine**: SQLite3  
**ORM**: Raw SQL queries with sqlite3.Row factory

---

*Generated on: $(date)*  
*Project: Pokemon Archive System*  
*Database: pokemon.db*