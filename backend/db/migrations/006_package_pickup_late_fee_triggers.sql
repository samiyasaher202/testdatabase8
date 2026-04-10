-- Package pickup: late fees ($10 after 10 days, +$10 after 20 days) and disposal after 30 days
-- for packages whose shipment status is "At Office". Uses Package_Pickup.Arrival_Time as the clock.
--
-- Prerequisites:
--   SET GLOBAL event_scheduler = ON;   -- required for time-based fees / disposal
--
-- Tables: Status_Code, Shipment, Shipment_Package, Package_Pickup (see schema.sql).

USE post_office_8;

-- ── 1. Column to hold accumulated late fee (original Package.Price stays unchanged) ──
ALTER TABLE Package_Pickup
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

DROP PROCEDURE IF EXISTS sp_apply_package_pickup_storage_rules $$

-- When Shipment is updated: sync office arrival, then apply late fees + disposal (same logic as daily EVENT).
DROP TRIGGER IF EXISTS trg_shipment_au_sync_pickup_arrival $$
CREATE TRIGGER trg_shipment_au_sync_pickup_arrival
AFTER UPDATE ON Shipment
FOR EACH ROW
BEGIN
  DECLARE v_at_office INT;
  DECLARE v_disposed INT;

  IF NOT (NEW.Status_Code <=> OLD.Status_Code) THEN
    SELECT Status_Code INTO v_at_office
    FROM Status_Code
    WHERE Status_Name = 'At Office'
    LIMIT 1;

    IF v_at_office IS NOT NULL AND NEW.Status_Code = v_at_office THEN
      UPDATE Package_Pickup pp
      INNER JOIN Shipment_Package sp
        ON sp.Tracking_Number = pp.Tracking_Number AND sp.Shipment_ID = NEW.Shipment_ID
      SET pp.Arrival_Time = COALESCE(NEW.Arrival_Time_Stamp, pp.Arrival_Time, NOW());
    END IF;
  END IF;

  SELECT Status_Code INTO v_disposed
  FROM Status_Code
  WHERE Status_Name = 'Disposed'
  LIMIT 1;

  UPDATE Package_Pickup pp
  INNER JOIN Shipment_Package sp ON sp.Tracking_Number = pp.Tracking_Number
  INNER JOIN Shipment sh ON sh.Shipment_ID = sp.Shipment_ID
  INNER JOIN Status_Code sc ON sc.Status_Code = sh.Status_Code AND sc.Status_Name = 'At Office'
  SET pp.Late_Fee_Amount = CASE
    WHEN pp.Is_picked_Up <> '0' THEN pp.Late_Fee_Amount
    WHEN pp.Arrival_Time IS NULL THEN pp.Late_Fee_Amount
    WHEN DATEDIFF(CURDATE(), DATE(pp.Arrival_Time)) > 20 THEN 20.00
    WHEN DATEDIFF(CURDATE(), DATE(pp.Arrival_Time)) > 10 THEN 10.00
    ELSE 0.00
  END
  WHERE pp.Is_picked_Up = '0'
    AND pp.Arrival_Time IS NOT NULL;

  IF v_disposed IS NOT NULL THEN
    UPDATE Shipment sh
    INNER JOIN Shipment_Package sp ON sp.Shipment_ID = sh.Shipment_ID
    INNER JOIN Package_Pickup pp ON pp.Tracking_Number = sp.Tracking_Number
    INNER JOIN Status_Code sc ON sc.Status_Code = sh.Status_Code AND sc.Status_Name = 'At Office'
    SET sh.Status_Code = v_disposed
    WHERE pp.Is_picked_Up = '0'
      AND pp.Arrival_Time IS NOT NULL
      AND DATEDIFF(CURDATE(), DATE(pp.Arrival_Time)) >= 30;
  END IF;
END $$

-- Optional: same on INSERT when shipment is created already "At Office"
DROP TRIGGER IF EXISTS trg_shipment_ai_sync_pickup_arrival $$
CREATE TRIGGER trg_shipment_ai_sync_pickup_arrival
AFTER INSERT ON Shipment
FOR EACH ROW
BEGIN
  DECLARE v_at_office INT;

  SELECT Status_Code INTO v_at_office
  FROM Status_Code
  WHERE Status_Name = 'At Office'
  LIMIT 1;

  IF v_at_office IS NOT NULL AND NEW.Status_Code = v_at_office THEN
    UPDATE Package_Pickup pp
    INNER JOIN Shipment_Package sp
      ON sp.Tracking_Number = pp.Tracking_Number AND sp.Shipment_ID = NEW.Shipment_ID
    SET pp.Arrival_Time = COALESCE(NEW.Arrival_Time_Stamp, pp.Arrival_Time, NOW());
  END IF;
END $$

-- When marked picked up, set Pickup_Time if the app forgot to.
DROP TRIGGER IF EXISTS trg_package_pickup_bu_pickup_time $$
CREATE TRIGGER trg_package_pickup_bu_pickup_time
BEFORE UPDATE ON Package_Pickup
FOR EACH ROW
BEGIN
  IF NEW.Is_picked_Up = '1' AND OLD.Is_picked_Up = '0' AND NEW.Pickup_Time IS NULL THEN
    SET NEW.Pickup_Time = NOW();
  END IF;
END $$

-- Nightly run: same fee/disposal body as trg_shipment_au_sync_pickup_arrival (MySQL cannot CALL a trigger).
DROP EVENT IF EXISTS evt_daily_package_pickup_storage $$
CREATE EVENT evt_daily_package_pickup_storage
ON SCHEDULE EVERY 1 DAY
STARTS (TIMESTAMP(CURRENT_DATE) + INTERVAL 1 DAY)
DO
BEGIN
  DECLARE v_disposed INT;

  SELECT Status_Code INTO v_disposed
  FROM Status_Code
  WHERE Status_Name = 'Disposed'
  LIMIT 1;

  UPDATE Package_Pickup pp
  INNER JOIN Shipment_Package sp ON sp.Tracking_Number = pp.Tracking_Number
  INNER JOIN Shipment sh ON sh.Shipment_ID = sp.Shipment_ID
  INNER JOIN Status_Code sc ON sc.Status_Code = sh.Status_Code AND sc.Status_Name = 'At Office'
  SET pp.Late_Fee_Amount = CASE
    WHEN pp.Is_picked_Up <> '0' THEN pp.Late_Fee_Amount
    WHEN pp.Arrival_Time IS NULL THEN pp.Late_Fee_Amount
    WHEN DATEDIFF(CURDATE(), DATE(pp.Arrival_Time)) > 20 THEN 20.00
    WHEN DATEDIFF(CURDATE(), DATE(pp.Arrival_Time)) > 10 THEN 10.00
    ELSE 0.00
  END
  WHERE pp.Is_picked_Up = '0'
    AND pp.Arrival_Time IS NOT NULL;

  IF v_disposed IS NOT NULL THEN
    UPDATE Shipment sh
    INNER JOIN Shipment_Package sp ON sp.Shipment_ID = sh.Shipment_ID
    INNER JOIN Package_Pickup pp ON pp.Tracking_Number = sp.Tracking_Number
    INNER JOIN Status_Code sc ON sc.Status_Code = sh.Status_Code AND sc.Status_Name = 'At Office'
    SET sh.Status_Code = v_disposed
    WHERE pp.Is_picked_Up = '0'
      AND pp.Arrival_Time IS NOT NULL
      AND DATEDIFF(CURDATE(), DATE(pp.Arrival_Time)) >= 30;
  END IF;
END $$

DELIMITER ;
