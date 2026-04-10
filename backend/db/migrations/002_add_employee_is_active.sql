-- Run once on existing databases missing is_active on Employee.
-- mysql -u root -p your_database < backend/db/migrations/002_add_employee_is_active.sql

ALTER TABLE employee ADD COLUMN Is_Active ENUM('1','0') NOT NULL DEFAULT '1';
