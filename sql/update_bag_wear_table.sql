-- Add quantity column to Bag_Wear table to support item quantity tracking
ALTER TABLE Bag_Wear ADD COLUMN quantity INTEGER DEFAULT 1;

-- Update existing records to have quantity 1
UPDATE Bag_Wear SET quantity = 1 WHERE quantity IS NULL;