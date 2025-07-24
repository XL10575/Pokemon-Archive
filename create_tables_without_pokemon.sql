-- Create Guild table
CREATE TABLE Guild (
    GuildID INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    Region TEXT
);


-- Create Item table (new table)
CREATE TABLE Item (
    ItemID INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    categories TEXT,
    effect TEXT
);

-- Create modified Bag_Wear table (removed color and brand, added item relationship)
CREATE TABLE Bag_Wear (
    BagID INTEGER PRIMARY KEY,
    TrainerID INTEGER NOT NULL,
    ItemID INTEGER,
    FOREIGN KEY (TrainerID) REFERENCES Trainer(TrainerID),
    FOREIGN KEY (ItemID) REFERENCES Item(ItemID)
);

-- Create Game table
CREATE TABLE Game (
    GameID INTEGER PRIMARY KEY AUTOINCREMENT,
    ChallengerID INTEGER NOT NULL,
    AccepterID INTEGER NOT NULL,
    game_date DATE DEFAULT CURRENT_DATE,
    winner_id INTEGER,
    FOREIGN KEY (ChallengerID) REFERENCES Trainer(TrainerID),
    FOREIGN KEY (AccepterID) REFERENCES Trainer(TrainerID),
    FOREIGN KEY (winner_id) REFERENCES Trainer(TrainerID),
    CHECK (ChallengerID != AccepterID)
);

-- Create Pokemon_Catch table (capture relationship)
CREATE TABLE Pokemon_Catch (
    CatchID INTEGER PRIMARY KEY AUTOINCREMENT,
    PID INTEGER NOT NULL,
    TrainerID INTEGER NOT NULL,
    catch_date DATE DEFAULT CURRENT_DATE,
    nickname TEXT,
    FOREIGN KEY (PID) REFERENCES Pokemon(pokedex_number),
    FOREIGN KEY (TrainerID) REFERENCES Trainer(TrainerID)
);