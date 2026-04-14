-- =============================================================================
-- CONSOLIDATED DATABASE CHANGES (Post Office project)
-- =============================================================================
-- Purpose: Single script that applies incremental DDL/DML in a sensible order.
-- How to run (replace user, host, and database):
--   mysql -u USER -p -h HOST DATABASE_NAME < backend/db/all_database_changes.sql
--
-- Important:
--   * This is NOT fully idempotent. If a column or table already exists, the
--     matching ALTER/CREATE may fail; comment out sections you have already applied.
--   * Do not rely on USE ... ; pass the target database on the mysql command line.
--   * SET GLOBAL event_scheduler requires privileges (SUPER or SYSTEM_VARIABLES_ADMIN).
--   * Tracking_Number length in package_pickup / shipment_location_event must match
--     your package.Tracking_Number definition (adjust VARCHAR sizes if needed).
--
-- Sources merged:
--   migrations/001_add_customer_demographics.sql
--   migrations/002_add_employee_is_active.sql
--   db/package_constraints.sql
--   migrations/004_add_payment_employee_id.sql
--   db/package_pricing_mods.sql (pricing portion only — stops before duplicate payment ALTER)
--   migrations/005_Package_pickup_set.sql (USE removed; ENABLE event after CREATE)
--   migrations/006_create_shipment_location_event.sql
--
-- Not included from package_pricing_mods.sql (from ~line 291): additional payment/package
-- ALTERs, support_ticket / ticket_issue_type, Date_Created columns, seed INSERTs — may
-- duplicate Section 4 or need manual review. See package_pricing_mods.sql for those.
-- =============================================================================


-- =============================================================================
-- SECTION 1 — Customer demographics
-- Adds birth date parts and sex to customer.
-- Source: migrations/001_add_customer_demographics.sql
-- =============================================================================

-- Run once on DBs missing these columns.


ALTER TABLE customer ADD COLUMN Birth_Day TINYINT NOT NULL DEFAULT 1;
ALTER TABLE customer ADD COLUMN Birth_Month TINYINT NOT NULL DEFAULT 1;
ALTER TABLE customer ADD COLUMN Birth_Year YEAR NOT NULL DEFAULT 2000;
ALTER TABLE customer ADD COLUMN Sex CHAR(1) NOT NULL DEFAULT 'U';


-- =============================================================================
-- SECTION 2 — Employee active flag
-- Soft-deactivate employees without deleting rows.
-- Source: migrations/002_add_employee_is_active.sql
-- =============================================================================




ALTER TABLE employee ADD COLUMN Is_Active ENUM('1','0') NOT NULL DEFAULT '1';


-- =============================================================================
-- SECTION 3 — Package CHECK constraints
-- Sender ≠ recipient; positive dimensions.
-- Source: db/package_constraints.sql
-- =============================================================================


ALTER TABLE package
  ADD CONSTRAINT chk_package_sender_recipient_different
  CHECK (Sender_ID <> Recipient_ID);

ALTER TABLE package
  ADD CONSTRAINT chk_package_dimensions_positive
  CHECK (Dim_X > 0 AND Dim_Y > 0 AND Dim_Z > 0);


-- =============================================================================
-- SECTION 4 — Payment linked to processing employee
-- Source: migrations/004_add_payment_employee_id.sql
-- =============================================================================

-- Links each payment to the employee who processed it (e.g. add-package flow).


ALTER TABLE payment
  ADD COLUMN Employee_ID INT NULL;

ALTER TABLE payment
  ADD CONSTRAINT fk_payment_employee
  FOREIGN KEY (Employee_ID) REFERENCES employee(Employee_ID);

-- Optional: set a placeholder for existing rows before making NOT NULL:
-- UPDATE payment SET Employee_ID = 1 WHERE Employee_ID IS NULL;
-- ALTER TABLE payment MODIFY COLUMN Employee_ID INT NOT NULL;


-- =============================================================================
-- SECTION 5 — Package pricing: cubic inches + price matrix reload
-- Drops Max_Length/Width/Height; adds Max_Cubic_Inches; DELETE + INSERT pricing;
-- UNIQUE on package_type.Package_Type_Code.
-- Source: db/package_pricing_mods.sql (pricing block only)
-- =============================================================================

ALTER TABLE package_pricing DROP COLUMN Max_Length;
ALTER TABLE package_pricing DROP COLUMN Max_Width;
ALTER TABLE package_pricing DROP COLUMN Max_Height;
ALTER TABLE package_pricing ADD COLUMN Max_Cubic_Inches decimal(10,2) DEFAULT NULL;

DELETE FROM package_pricing;

ALTER TABLE package_type
ADD CONSTRAINT uq_package_type_code UNIQUE (Package_Type_Code);



INSERT INTO package_pricing (Package_Type_Code, Min_Weight, Max_Weight, Max_Cubic_Inches, Zone, Price) VALUES

('EXP', 0.00, 10.00, 64.00, 1, 12.00),
('EXP', 10.00, 20.00, 64.00, 1, 12.25),
('EXP', 20.00, 30.00, 64.00, 1, 12.50),
('EXP', 0.00, 10.00, 512.00, 1, 13.00),
('EXP', 10.00, 20.00, 512.00, 1, 13.25),
('EXP', 20.00, 30.00, 512.00, 1, 13.50),
('EXP', 0.00, 10.00, 1728.00, 1, 14.00),
('EXP', 10.00, 20.00, 1728.00, 1, 14.25),
('EXP', 20.00, 30.00, 1728.00, 1, 14.50),

('EXP', 0.00, 10.00, 64.00, 2, 15.00),
('EXP', 10.00, 20.00, 64.00, 2, 15.25),
('EXP', 20.00, 30.00, 64.00, 2, 15.50),
('EXP', 0.00, 10.00, 512.00, 2, 16.00),
('EXP', 10.00, 20.00, 512.00, 2, 16.25),
('EXP', 20.00, 30.00, 512.00, 2, 16.50),
('EXP', 0.00, 10.00, 1728.00, 2, 17.00),
('EXP', 10.00, 20.00, 1728.00, 2, 17.25),
('EXP', 20.00, 30.00, 1728.00, 2, 17.50),

('EXP', 0.00, 10.00, 64.00, 3, 18.00),
('EXP', 10.00, 20.00, 64.00, 3, 18.25),
('EXP', 20.00, 30.00, 64.00, 3, 18.50),
('EXP', 0.00, 10.00, 512.00, 3, 19.00),
('EXP', 10.00, 20.00, 512.00, 3, 19.25),
('EXP', 20.00, 30.00, 512.00, 3, 19.50),
('EXP', 0.00, 10.00, 1728.00, 3, 20.00),
('EXP', 10.00, 20.00, 1728.00, 3, 20.25),
('EXP', 20.00, 30.00, 1728.00, 3, 20.50),

('EXP', 0.00, 10.00, 64.00, 4, 21.00),
('EXP', 10.00, 20.00, 64.00, 4, 21.25),
('EXP', 20.00, 30.00, 64.00, 4, 21.50),
('EXP', 0.00, 10.00, 512.00, 4, 22.00),
('EXP', 10.00, 20.00, 512.00, 4, 22.25),
('EXP', 20.00, 30.00, 512.00, 4, 22.50),
('EXP', 0.00, 10.00, 1728.00, 4, 23.00),
('EXP', 10.00, 20.00, 1728.00, 4, 23.25),
('EXP', 20.00, 30.00, 1728.00, 4, 23.50),

('EXP', 0.00, 10.00, 64.00, 5, 24.00),
('EXP', 10.00, 20.00, 64.00, 5, 24.25),
('EXP', 20.00, 30.00, 64.00, 5, 24.50),
('EXP', 0.00, 10.00, 512.00, 5, 25.00),
('EXP', 10.00, 20.00, 512.00, 5, 25.25),
('EXP', 20.00, 30.00, 512.00, 5, 25.50),
('EXP', 0.00, 10.00, 1728.00, 5, 26.00),
('EXP', 10.00, 20.00, 1728.00, 5, 26.25),
('EXP', 20.00, 30.00, 1728.00, 5, 26.50),

('EXP', 0.00, 10.00, 64.00, 6, 27.00),
('EXP', 10.00, 20.00, 64.00, 6, 27.25),
('EXP', 20.00, 30.00, 64.00, 6, 27.50),
('EXP', 0.00, 10.00, 512.00, 6, 28.00),
('EXP', 10.00, 20.00, 512.00, 6, 28.25),
('EXP', 20.00, 30.00, 512.00, 6, 28.50),
('EXP', 0.00, 10.00, 1728.00, 6, 29.00),
('EXP', 10.00, 20.00, 1728.00, 6, 29.25),
('EXP', 20.00, 30.00, 1728.00, 6, 29.50),

('EXP', 0.00, 10.00, 64.00, 7, 30.00),
('EXP', 10.00, 20.00, 64.00, 7, 30.25),
('EXP', 20.00, 30.00, 64.00, 7, 30.50),
('EXP', 0.00, 10.00, 512.00, 7, 31.00),
('EXP', 10.00, 20.00, 512.00, 7, 31.25),
('EXP', 20.00, 30.00, 512.00, 7, 31.50),
('EXP', 0.00, 10.00, 1728.00, 7, 32.00),
('EXP', 10.00, 20.00, 1728.00, 7, 32.25),
('EXP', 20.00, 30.00, 1728.00, 7, 32.50),

('EXP', 0.00, 10.00, 64.00, 8, 33.00),
('EXP', 10.00, 20.00, 64.00, 8, 33.25),
('EXP', 20.00, 30.00, 64.00, 8, 33.50),
('EXP', 0.00, 10.00, 512.00, 8, 34.00),
('EXP', 10.00, 20.00, 512.00, 8, 34.25),
('EXP', 20.00, 30.00, 512.00, 8, 34.50),
('EXP', 0.00, 10.00, 1728.00, 8, 35.00),
('EXP', 10.00, 20.00, 1728.00, 8, 35.25),
('EXP', 20.00, 30.00, 1728.00, 8, 35.50),

('EXP', 0.00, 10.00, 64.00, 9, 36.00),
('EXP', 10.00, 20.00, 64.00, 9, 36.25),
('EXP', 20.00, 30.00, 64.00, 9, 36.50),
('EXP', 0.00, 10.00, 512.00, 9, 37.00),
('EXP', 10.00, 20.00, 512.00, 9, 37.25),
('EXP', 20.00, 30.00, 512.00, 9, 37.50),
('EXP', 0.00, 10.00, 1728.00, 9, 38.00),
('EXP', 10.00, 20.00, 1728.00, 9, 38.25),
('EXP', 20.00, 30.00, 1728.00, 9, 38.50);


INSERT INTO package_pricing (Package_Type_Code, Min_Weight, Max_Weight, Max_Cubic_Inches, Zone, Price) VALUES

('GEN', 0.00, 10.00, 64.00, 1, 6.00),
('GEN', 10.00, 20.00, 64.00, 1, 6.25),
('GEN', 20.00, 30.00, 64.00, 1, 6.50),
('GEN', 0.00, 10.00, 512.00, 1, 7.00),
('GEN', 10.00, 20.00, 512.00, 1, 7.25),
('GEN', 20.00, 30.00, 512.00, 1, 7.50),
('GEN', 0.00, 10.00, 1728.00, 1, 8.00),
('GEN', 10.00, 20.00, 1728.00, 1, 8.25),
('GEN', 20.00, 30.00, 1728.00, 1, 8.50),

('GEN', 0.00, 10.00, 64.00, 2, 9.00),
('GEN', 10.00, 20.00, 64.00, 2, 9.25),
('GEN', 20.00, 30.00, 64.00, 2, 9.50),
('GEN', 0.00, 10.00, 512.00, 2, 10.00),
('GEN', 10.00, 20.00, 512.00, 2, 10.25),
('GEN', 20.00, 30.00, 512.00, 2, 10.50),
('GEN', 0.00, 10.00, 1728.00, 2, 11.00),
('GEN', 10.00, 20.00, 1728.00, 2, 11.25),
('GEN', 20.00, 30.00, 1728.00, 2, 11.50),

('GEN', 0.00, 10.00, 64.00, 3, 12.00),
('GEN', 10.00, 20.00, 64.00, 3, 12.25),
('GEN', 20.00, 30.00, 64.00, 3, 12.50),
('GEN', 0.00, 10.00, 512.00, 3, 13.00),
('GEN', 10.00, 20.00, 512.00, 3, 13.25),
('GEN', 20.00, 30.00, 512.00, 3, 13.50),
('GEN', 0.00, 10.00, 1728.00, 3, 14.00),
('GEN', 10.00, 20.00, 1728.00, 3, 14.25),
('GEN', 20.00, 30.00, 1728.00, 3, 14.50),

('GEN', 0.00, 10.00, 64.00, 4, 15.00),
('GEN', 10.00, 20.00, 64.00, 4, 15.25),
('GEN', 20.00, 30.00, 64.00, 4, 15.50),
('GEN', 0.00, 10.00, 512.00, 4, 16.00),
('GEN', 10.00, 20.00, 512.00, 4, 16.25),
('GEN', 20.00, 30.00, 512.00, 4, 16.50),
('GEN', 0.00, 10.00, 1728.00, 4, 17.00),
('GEN', 10.00, 20.00, 1728.00, 4, 17.25),
('GEN', 20.00, 30.00, 1728.00, 4, 17.50),

('GEN', 0.00, 10.00, 64.00, 5, 18.00),
('GEN', 10.00, 20.00, 64.00, 5, 18.25),
('GEN', 20.00, 30.00, 64.00, 5, 18.50),
('GEN', 0.00, 10.00, 512.00, 5, 19.00),
('GEN', 10.00, 20.00, 512.00, 5, 19.25),
('GEN', 20.00, 30.00, 512.00, 5, 19.50),
('GEN', 0.00, 10.00, 1728.00, 5, 20.00),
('GEN', 10.00, 20.00, 1728.00, 5, 20.25),
('GEN', 20.00, 30.00, 1728.00, 5, 20.50),

('GEN', 0.00, 10.00, 64.00, 6, 21.00),
('GEN', 10.00, 20.00, 64.00, 6, 21.25),
('GEN', 20.00, 30.00, 64.00, 6, 21.50),
('GEN', 0.00, 10.00, 512.00, 6, 22.00),
('GEN', 10.00, 20.00, 512.00, 6, 22.25),
('GEN', 20.00, 30.00, 512.00, 6, 22.50),
('GEN', 0.00, 10.00, 1728.00, 6, 23.00),
('GEN', 10.00, 20.00, 1728.00, 6, 23.25),
('GEN', 20.00, 30.00, 1728.00, 6, 23.50),

('GEN', 0.00, 10.00, 64.00, 7, 24.00),
('GEN', 10.00, 20.00, 64.00, 7, 24.25),
('GEN', 20.00, 30.00, 64.00, 7, 24.50),
('GEN', 0.00, 10.00, 512.00, 7, 25.00),
('GEN', 10.00, 20.00, 512.00, 7, 25.25),
('GEN', 20.00, 30.00, 512.00, 7, 25.50),
('GEN', 0.00, 10.00, 1728.00, 7, 26.00),
('GEN', 10.00, 20.00, 1728.00, 7, 26.25),
('GEN', 20.00, 30.00, 1728.00, 7, 26.50),

('GEN', 0.00, 10.00, 64.00, 8, 27.00),
('GEN', 10.00, 20.00, 64.00, 8, 27.25),
('GEN', 20.00, 30.00, 64.00, 8, 27.50),
('GEN', 0.00, 10.00, 512.00, 8, 28.00),
('GEN', 10.00, 20.00, 512.00, 8, 28.25),
('GEN', 20.00, 30.00, 512.00, 8, 28.50),
('GEN', 0.00, 10.00, 1728.00, 8, 29.00),
('GEN', 10.00, 20.00, 1728.00, 8, 29.25),
('GEN', 20.00, 30.00, 1728.00, 8, 29.50),

('GEN', 0.00, 10.00, 64.00, 9, 30.00),
('GEN', 10.00, 20.00, 64.00, 9, 30.25),
('GEN', 20.00, 30.00, 64.00, 9, 30.50),
('GEN', 0.00, 10.00, 512.00, 9, 31.00),
('GEN', 10.00, 20.00, 512.00, 9, 31.25),
('GEN', 20.00, 30.00, 512.00, 9, 31.50),
('GEN', 0.00, 10.00, 1728.00, 9, 32.00),
('GEN', 10.00, 20.00, 1728.00, 9, 32.25),
('GEN', 20.00, 30.00, 1728.00, 9, 32.50);


INSERT INTO package_pricing (Package_Type_Code, Min_Weight, Max_Weight, Max_Cubic_Inches, Zone, Price) VALUES

('OVR', 0.00, 10.00, 64.00, 1, 20.00),
('OVR', 10.00, 20.00, 64.00, 1, 20.25),
('OVR', 20.00, 30.00, 64.00, 1, 20.50),
('OVR', 0.00, 10.00, 512.00, 1, 21.00),
('OVR', 10.00, 20.00, 512.00, 1, 21.25),
('OVR', 20.00, 30.00, 512.00, 1, 21.50),
('OVR', 0.00, 10.00, 1728.00, 1, 22.00),
('OVR', 10.00, 20.00, 1728.00, 1, 22.25),
('OVR', 20.00, 30.00, 1728.00, 1, 22.50),

('OVR', 0.00, 10.00, 64.00, 2, 23.00),
('OVR', 10.00, 20.00, 64.00, 2, 23.25),
('OVR', 20.00, 30.00, 64.00, 2, 23.50),
('OVR', 0.00, 10.00, 512.00, 2, 24.00),
('OVR', 10.00, 20.00, 512.00, 2, 24.25),
('OVR', 20.00, 30.00, 512.00, 2, 24.50),
('OVR', 0.00, 10.00, 1728.00, 2, 25.00),
('OVR', 10.00, 20.00, 1728.00, 2, 25.25),
('OVR', 20.00, 30.00, 1728.00, 2, 25.50),

('OVR', 0.00, 10.00, 64.00, 3, 26.00),
('OVR', 10.00, 20.00, 64.00, 3, 26.25),
('OVR', 20.00, 30.00, 64.00, 3, 26.50),
('OVR', 0.00, 10.00, 512.00, 3, 27.00),
('OVR', 10.00, 20.00, 512.00, 3, 27.25),
('OVR', 20.00, 30.00, 512.00, 3, 27.50),
('OVR', 0.00, 10.00, 1728.00, 3, 28.00),
('OVR', 10.00, 20.00, 1728.00, 3, 28.25),
('OVR', 20.00, 30.00, 1728.00, 3, 28.50),

('OVR', 0.00, 10.00, 64.00, 4, 29.00),
('OVR', 10.00, 20.00, 64.00, 4, 29.25),
('OVR', 20.00, 30.00, 64.00, 4, 29.50),
('OVR', 0.00, 10.00, 512.00, 4, 30.00),
('OVR', 10.00, 20.00, 512.00, 4, 30.25),
('OVR', 20.00, 30.00, 512.00, 4, 30.50),
('OVR', 0.00, 10.00, 1728.00, 4, 31.00),
('OVR', 10.00, 20.00, 1728.00, 4, 31.25),
('OVR', 20.00, 30.00, 1728.00, 4, 31.50),

('OVR', 0.00, 10.00, 64.00, 5, 32.00),
('OVR', 10.00, 20.00, 64.00, 5, 32.25),
('OVR', 20.00, 30.00, 64.00, 5, 32.50),
('OVR', 0.00, 10.00, 512.00, 5, 33.00),
('OVR', 10.00, 20.00, 512.00, 5, 33.25),
('OVR', 20.00, 30.00, 512.00, 5, 33.50),
('OVR', 0.00, 10.00, 1728.00, 5, 34.00),
('OVR', 10.00, 20.00, 1728.00, 5, 34.25),
('OVR', 20.00, 30.00, 1728.00, 5, 34.50),

('OVR', 0.00, 10.00, 64.00, 6, 35.00),
('OVR', 10.00, 20.00, 64.00, 6, 35.25),
('OVR', 20.00, 30.00, 64.00, 6, 35.50),
('OVR', 0.00, 10.00, 512.00, 6, 36.00),
('OVR', 10.00, 20.00, 512.00, 6, 36.25),
('OVR', 20.00, 30.00, 512.00, 6, 36.50),
('OVR', 0.00, 10.00, 1728.00, 6, 37.00),
('OVR', 10.00, 20.00, 1728.00, 6, 37.25),
('OVR', 20.00, 30.00, 1728.00, 6, 37.50),

('OVR', 0.00, 10.00, 64.00, 7, 38.00),
('OVR', 10.00, 20.00, 64.00, 7, 38.25),
('OVR', 20.00, 30.00, 64.00, 7, 38.50),
('OVR', 0.00, 10.00, 512.00, 7, 39.00),
('OVR', 10.00, 20.00, 512.00, 7, 39.25),
('OVR', 20.00, 30.00, 512.00, 7, 39.50),
('OVR', 0.00, 10.00, 1728.00, 7, 40.00),
('OVR', 10.00, 20.00, 1728.00, 7, 40.25),
('OVR', 20.00, 30.00, 1728.00, 7, 40.50),

('OVR', 0.00, 10.00, 64.00, 8, 41.00),
('OVR', 10.00, 20.00, 64.00, 8, 41.25),
('OVR', 20.00, 30.00, 64.00, 8, 41.50),
('OVR', 0.00, 10.00, 512.00, 8, 42.00),
('OVR', 10.00, 20.00,  512.00, 8, 42.25),
('OVR', 20.00, 30.00,  512.00, 8, 42.50),
('OVR', 0.00, 10.00, 1728.00, 8, 43.00),
('OVR', 10.00, 20.00, 1728.00, 8, 43.25),
('OVR', 20.00, 30.00, 1728.00, 8, 43.50),

('OVR', 0.00, 10.00, 64.00, 9, 44.00),
('OVR', 10.00, 20.00, 64.00, 9, 44.25),
('OVR', 20.00, 30.00, 64.00, 9, 44.50),
('OVR', 0.00, 10.00, 512.00, 9, 45.00),
('OVR', 10.00, 20.00,  512.00, 9, 45.25),
('OVR', 20.00, 30.00,  512.00, 9, 45.50),
('OVR', 0.00, 10.00, 1728.00, 9, 46.00),
('OVR', 10.00, 20.00, 1728.00, 9, 46.25),
('OVR', 20.00, 30.00, 1728.00, 9, 46.50);

-- =============================================================================
-- SECTION 6 — Package pickup, late fees, trigger, nightly procedure + event
-- Source: migrations/005_Package_pickup_set.sql (edited)
-- =============================================================================

-- Package pickup records (package held at a post office for recipient).
-- (was: per-file mysql redirect)

-- Tracking_Number length must match package.Tracking_Number (use VARCHAR(10) if your Package uses 10).
CREATE TABLE package_pickup (
  Tracking_Number VARCHAR(20) NOT NULL PRIMARY KEY,
  Recipient_ID INT NOT NULL,
  Post_Office_ID INT NOT NULL,
  Arrival_Time DATETIME NULL,
  Pickup_Time DATETIME NULL,
  Is_picked_Up ENUM('1','0') NOT NULL DEFAULT '0',
  CONSTRAINT fk_package_pickup_package
    FOREIGN KEY (Tracking_Number) REFERENCES package(Tracking_Number),
  CONSTRAINT fk_package_pickup_recipient
    FOREIGN KEY (Recipient_ID) REFERENCES customer(Customer_ID),
  CONSTRAINT fk_package_pickup_post_office
    FOREIGN KEY (Post_Office_ID) REFERENCES post_office(Post_Office_ID)
);


-- Package pickup: late fees ($10 after 10 days, +$10 after 20 days) and disposal after 30 days
-- for packages whose shipment status is "At Office". Uses Package_Pickup.Arrival_Time as the clock.
--

-- Tables: Status_Code, Shipment, Shipment_Package, Package_Pickup (see schema.sql).

USE post_office_8;

-- ── 1. Column to hold accumulated late fee (original Package.Price stays unchanged) ──
ALTER TABLE package_pickup
  ADD COLUMN Late_Fee_Amount DECIMAL(10,2) NOT NULL DEFAULT 0.00;

-- ── 2. Status codes (adjust Status_Code values if they collide with your data) ───────
INSERT INTO Status_Code (Status_Code, Status_Name, Is_Final_Status)
SELECT 8, 'At Office', 0
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM Status_Code WHERE Status_Name = 'At Office');

INSERT INTO Status_Code (Status_Code, Status_Name, Is_Final_Status)
SELECT 9, 'Disposed', 1
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM Status_Code WHERE Status_Name = 'Disposed');

-- ── 3. Helper: calendar days since office arrival (DATE-only; same as DATEDIFF rules) ─
--    Fee tier 1:  DATEDIFF > 10  → $10
--    Fee tier 2:  DATEDIFF > 20  → $20 total
--    Disposal:    DATEDIFF >= 30 → status Disposed (still not picked up)


DELIMITER $$

DROP TRIGGER IF EXISTS trg_shipment_au_sync_pickup_arrival $$
CREATE TRIGGER trg_shipment_au_sync_pickup_arrival
AFTER UPDATE ON Shipment
FOR EACH ROW
BEGIN
  DECLARE v_at_office INT;

  SELECT Status_Code INTO v_at_office
  FROM Status_Code
  WHERE Status_Name = 'At Office'
  LIMIT 1;

  IF NOT (NEW.Status_Code <=> OLD.Status_Code) THEN
    IF v_at_office IS NOT NULL AND NEW.Status_Code = v_at_office THEN
      UPDATE package_pickup pp
      INNER JOIN Shipment_Package sp ON sp.Tracking_Number = pp.Tracking_Number
      SET pp.Arrival_Time = COALESCE(NEW.Arrival_Time_Stamp, pp.Arrival_Time, NOW())
      WHERE sp.Shipment_ID = NEW.Shipment_ID;
    END IF;
  END IF;

  IF v_at_office IS NOT NULL AND NEW.Status_Code = v_at_office THEN
    UPDATE package_pickup pp
    INNER JOIN Shipment_Package sp ON sp.Tracking_Number = pp.Tracking_Number
    SET pp.Late_Fee_Amount = CASE
      WHEN pp.Is_picked_Up <> '0' THEN pp.Late_Fee_Amount
      WHEN pp.Arrival_Time IS NULL THEN pp.Late_Fee_Amount
      WHEN DATEDIFF(CURDATE(), DATE(pp.Arrival_Time)) > 20 THEN 20.00
      WHEN DATEDIFF(CURDATE(), DATE(pp.Arrival_Time)) > 10 THEN 10.00
      ELSE 0.00
    END
    WHERE sp.Shipment_ID = NEW.Shipment_ID
      AND pp.Is_picked_Up = '0'
      AND pp.Arrival_Time IS NOT NULL;
  END IF;
END $$

DELIMITER ;



-- (Event scheduler + ENABLE moved to after CREATE EVENT in this consolidated file)


-- Nightly procedure + event: late fees + 30-day disposal (delivery + shipment).
-- Apply to the DB your app uses, e.g.:
-- (No USE line — the database is the one you pass on the mysql command line.)

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_daily_package_pickup_storage $$
CREATE PROCEDURE sp_daily_package_pickup_storage()
BEGIN
  DECLARE v_disposed INT;

  SELECT Status_Code INTO v_disposed
  FROM status_code
  WHERE LOWER(TRIM(Status_Name)) = 'disposed'
     OR REPLACE(LOWER(TRIM(Status_Name)), ' ', '') LIKE '%disposed%'
  LIMIT 1;

  UPDATE package_pickup pp
  INNER JOIN delivery d ON d.Tracking_Number = pp.Tracking_Number
  LEFT JOIN status_code scd ON scd.Status_Code = d.Delivery_Status_Code
  LEFT JOIN shipment_package sp ON sp.Tracking_Number = pp.Tracking_Number
  LEFT JOIN shipment sh ON sh.Shipment_ID = sp.Shipment_ID
  LEFT JOIN status_code scs ON scs.Status_Code = sh.Status_Code
  SET pp.Late_Fee_Amount = CASE
    WHEN pp.Is_picked_Up <> '0' THEN pp.Late_Fee_Amount
    WHEN pp.Arrival_Time IS NULL THEN pp.Late_Fee_Amount
    WHEN DATEDIFF(CURDATE(), DATE(pp.Arrival_Time)) > 20 THEN 20.00
    WHEN DATEDIFF(CURDATE(), DATE(pp.Arrival_Time)) > 10 THEN 10.00
    ELSE 0.00
  END
  WHERE (TRIM(IFNULL(pp.Is_picked_Up, '')) = '0' OR pp.Is_picked_Up IS NULL)
    AND pp.Arrival_Time IS NOT NULL
    AND (
      LOWER(TRIM(REPLACE(REPLACE(REPLACE(IFNULL(scd.Status_Name, ''), '-', ' '), '_', ' '), '  ', ' '))) = 'at office'
      OR REPLACE(LOWER(TRIM(IFNULL(scd.Status_Name, ''))), ' ', '') LIKE '%atoffice%'
      OR (
        sh.Shipment_ID IS NOT NULL
        AND (
          LOWER(TRIM(REPLACE(REPLACE(REPLACE(IFNULL(scs.Status_Name, ''), '-', ' '), '_', ' '), '  ', ' '))) = 'at office'
          OR REPLACE(LOWER(TRIM(IFNULL(scs.Status_Name, ''))), ' ', '') LIKE '%atoffice%'
        )
      )
    );

  IF v_disposed IS NOT NULL THEN
    DROP TEMPORARY TABLE IF EXISTS _pkg_dispose_today;
    CREATE TEMPORARY TABLE _pkg_dispose_today (Tracking_Number VARCHAR(64) PRIMARY KEY);

    INSERT IGNORE INTO _pkg_dispose_today (Tracking_Number)
    SELECT pp.Tracking_Number
    FROM package_pickup pp
    INNER JOIN delivery d ON d.Tracking_Number = pp.Tracking_Number
    INNER JOIN status_code scd ON scd.Status_Code = d.Delivery_Status_Code
    WHERE (TRIM(IFNULL(pp.Is_picked_Up, '')) = '0' OR pp.Is_picked_Up IS NULL)
      AND pp.Arrival_Time IS NOT NULL
      AND DATEDIFF(CURDATE(), DATE(pp.Arrival_Time)) >= 30
      AND (
        LOWER(TRIM(REPLACE(REPLACE(REPLACE(IFNULL(scd.Status_Name, ''), '-', ' '), '_', ' '), '  ', ' '))) = 'at office'
        OR REPLACE(LOWER(TRIM(IFNULL(scd.Status_Name, ''))), ' ', '') LIKE '%atoffice%'
      );

    INSERT IGNORE INTO _pkg_dispose_today (Tracking_Number)
    SELECT pp.Tracking_Number
    FROM package_pickup pp
    INNER JOIN shipment_package sp ON sp.Tracking_Number = pp.Tracking_Number
    INNER JOIN shipment sh ON sh.Shipment_ID = sp.Shipment_ID
    INNER JOIN status_code scs ON scs.Status_Code = sh.Status_Code
    WHERE (TRIM(IFNULL(pp.Is_picked_Up, '')) = '0' OR pp.Is_picked_Up IS NULL)
      AND pp.Arrival_Time IS NOT NULL
      AND DATEDIFF(CURDATE(), DATE(pp.Arrival_Time)) >= 30
      AND (
        LOWER(TRIM(REPLACE(REPLACE(REPLACE(IFNULL(scs.Status_Name, ''), '-', ' '), '_', ' '), '  ', ' '))) = 'at office'
        OR REPLACE(LOWER(TRIM(IFNULL(scs.Status_Name, ''))), ' ', '') LIKE '%atoffice%'
      );

    UPDATE delivery d
    INNER JOIN _pkg_dispose_today t ON t.Tracking_Number = d.Tracking_Number
    SET d.Delivery_Status_Code = v_disposed;

    UPDATE shipment sh
    INNER JOIN shipment_package sp ON sp.Shipment_ID = sh.Shipment_ID
    INNER JOIN _pkg_dispose_today t ON t.Tracking_Number = sp.Tracking_Number
    SET sh.Status_Code = v_disposed;

    DROP TEMPORARY TABLE IF EXISTS _pkg_dispose_today;
  END IF;
END $$

DROP EVENT IF EXISTS evt_daily_package_pickup_storage $$
CREATE EVENT evt_daily_package_pickup_storage
ON SCHEDULE EVERY 1 DAY
STARTS (TIMESTAMP(CURRENT_DATE) + INTERVAL 1 DAY)
ON COMPLETION PRESERVE
ENABLE
DO CALL sp_daily_package_pickup_storage() $$

DELIMITER ;

-- Turn on MySQL Event Scheduler (requires privilege). Safe to run once.
SET GLOBAL event_scheduler = ON;

-- Event was created above; ensure it is enabled.
ALTER EVENT evt_daily_package_pickup_storage ENABLE;


-- =============================================================================
-- SECTION 7 — Shipment location events (routing / tracking timeline)
-- Source: migrations/006_create_shipment_location_event.sql
-- =============================================================================

-- Scan log: arrival / departure at each post office along a package route (shown on public tracking).

--
-- Adjust Tracking_Number length to match package.Tracking_Number in your DB.

CREATE TABLE shipment_location_event (
  Event_ID INT AUTO_INCREMENT PRIMARY KEY,
  Shipment_ID INT NULL,
  Tracking_Number VARCHAR(30) NOT NULL,
  Post_Office_ID INT NOT NULL,
  Event_Type ENUM('arrival', 'departure') NOT NULL,
  Event_Time DATETIME NOT NULL,
  Employee_ID INT NOT NULL,
  Notes VARCHAR(255) NULL,
  CONSTRAINT fk_sle_shipment FOREIGN KEY (Shipment_ID) REFERENCES shipment(Shipment_ID) ON DELETE SET NULL,
  CONSTRAINT fk_sle_package FOREIGN KEY (Tracking_Number) REFERENCES package(Tracking_Number),
  CONSTRAINT fk_sle_office FOREIGN KEY (Post_Office_ID) REFERENCES post_office(Post_Office_ID),
  CONSTRAINT fk_sle_employee FOREIGN KEY (Employee_ID) REFERENCES employee(Employee_ID)
);

CREATE INDEX idx_sle_tracking_time ON shipment_location_event(Tracking_Number, Event_Time);
