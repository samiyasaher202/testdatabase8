ALTER TABLE package
ADD COLUMN Lost_Status ENUM('active', 'lost', 'notified') NOT NULL DEFAULT 'active';