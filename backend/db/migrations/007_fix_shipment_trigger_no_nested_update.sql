-- Fix: no nested UPDATE on shipment inside AFTER UPDATE ON shipment (1442).
-- Matches 006 trigger body (arrival + per-shipment late fees; disposal stays in EVENT).
-- mysql -u root -p your_database < backend/db/migrations/007_fix_shipment_trigger_no_nested_update.sql

USE post_office_8;

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
      UPDATE Package_Pickup pp
      INNER JOIN Shipment_Package sp ON sp.Tracking_Number = pp.Tracking_Number
      SET pp.Arrival_Time = COALESCE(NEW.Arrival_Time_Stamp, pp.Arrival_Time, NOW())
      WHERE sp.Shipment_ID = NEW.Shipment_ID;
    END IF;
  END IF;

  IF v_at_office IS NOT NULL AND NEW.Status_Code = v_at_office THEN
    UPDATE Package_Pickup pp
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
