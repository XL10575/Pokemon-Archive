-- Simple Login System - Just User table with Trainer relationship

-- Create simplified User table
CREATE TABLE User (
    UserID INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    is_active INTEGER DEFAULT 1
);

-- Create Trainer table with User relationship (1:1)
CREATE TABLE Trainer (
    TrainerID INTEGER PRIMARY KEY,
    UserID INTEGER UNIQUE NOT NULL, -- One user = One trainer
    Name TEXT NOT NULL,
    Address TEXT,
    Number INTEGER,
    Rank INTEGER,
    GuildID INTEGER,
    FOREIGN KEY (UserID) REFERENCES User(UserID),
    FOREIGN KEY (GuildID) REFERENCES Guild(GuildID)
);

-- Create indexes for better performance
CREATE INDEX idx_user_username ON User(username);
CREATE INDEX idx_trainer_userid ON Trainer(UserID);