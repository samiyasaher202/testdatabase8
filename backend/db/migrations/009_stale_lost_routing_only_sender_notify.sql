-- =============================================================================
-- Patch: stale LOST uses only shipment_routing arrival/departure; sender alert only
-- =============================================================================
-- Apply if you already ran 008_stale_shipment_lost_event.sql before this change.
-- New installs: 008 already contains this logic; you can skip this file.
-- =============================================================================

DROP PROCEDURE IF EXISTS sp_mark_stale_packages_lost;

DELIMITER $$

CREATE PROCEDURE sp_mark_stale_packages_lost ()
proc: BEGIN
  DECLARE v_lost INT DEFAULT NULL;

  SELECT Status_Code INTO v_lost
  FROM status_code
  WHERE LOWER(TRIM(Status_Name)) = 'lost'
  LIMIT 1;

  IF v_lost IS NULL THEN
    LEAVE proc;
  END IF;

  DROP TEMPORARY TABLE IF EXISTS _stale_pkg;
  CREATE TEMPORARY TABLE _stale_pkg (
    Tracking_Number VARCHAR(20) NOT NULL PRIMARY KEY
  ) ENGINE=InnoDB;

  INSERT INTO _stale_pkg (Tracking_Number)
  SELECT DISTINCT sp.Tracking_Number
  FROM shipment_package sp
  INNER JOIN shipment s ON s.Shipment_ID = sp.Shipment_ID
  INNER JOIN delivery d ON d.Tracking_Number = sp.Tracking_Number
  INNER JOIN status_code scd ON scd.Status_Code = d.Delivery_Status_Code
  WHERE LOWER(TRIM(scd.Status_Name)) NOT IN (
    'delivered', 'lost', 'returned', 'picked up', 'disposed'
  )
    AND EXISTS (
      SELECT 1
      FROM shipment_routing_event e0
      WHERE e0.Shipment_ID = s.Shipment_ID
        AND e0.Event_Type IN ('arrival', 'departure')
    )
    AND (
      SELECT MAX(e.Event_Time)
      FROM shipment_routing_event e
      WHERE e.Shipment_ID = s.Shipment_ID
        AND e.Event_Type IN ('arrival', 'departure')
    ) < DATE_SUB(NOW(), INTERVAL 14 DAY);

  UPDATE delivery d
  INNER JOIN _stale_pkg st ON st.Tracking_Number = d.Tracking_Number
  SET d.Delivery_Status_Code = v_lost
  WHERE NOT (d.Delivery_Status_Code <=> v_lost);

  UPDATE shipment s
  INNER JOIN shipment_package sp ON sp.Shipment_ID = s.Shipment_ID
  INNER JOIN _stale_pkg st ON st.Tracking_Number = sp.Tracking_Number
  SET s.Status_Code = v_lost
  WHERE NOT (s.Status_Code <=> v_lost);

  DROP TEMPORARY TABLE IF EXISTS _stale_pkg;
END$$

DELIMITER ;

DROP TRIGGER IF EXISTS tr_delivery_au_notify_package_lost;

DELIMITER $$

CREATE TRIGGER tr_delivery_au_notify_package_lost
AFTER UPDATE ON delivery
FOR EACH ROW
BEGIN
  DECLARE v_is_lost INT DEFAULT 0;

  IF NOT (NEW.Delivery_Status_Code <=> OLD.Delivery_Status_Code) THEN
    SELECT COUNT(*) INTO v_is_lost
    FROM status_code sc
    WHERE sc.Status_Code = NEW.Delivery_Status_Code
      AND LOWER(TRIM(sc.Status_Name)) = 'lost';

    IF v_is_lost = 1 THEN
      INSERT IGNORE INTO customer_package_alert (
        Customer_ID, Tracking_Number, Email_Address, Alert_Reason, Message_Text
      )
      SELECT
        p.Sender_ID,
        p.Tracking_Number,
        cs.Email_Address,
        'package_marked_lost',
        CONCAT(
          'National Postal Service: Package ',
          p.Tracking_Number,
          ' has been marked LOST because the last arrival or departure scan ',
          'in shipment routing is more than 14 days old. You may file a claim or contact support.'
        )
      FROM package p
      INNER JOIN customer cs ON cs.Customer_ID = p.Sender_ID
      WHERE p.Tracking_Number = NEW.Tracking_Number
        AND p.Sender_ID IS NOT NULL
        AND cs.Email_Address IS NOT NULL
        AND TRIM(cs.Email_Address) <> '';
    END IF;
  END IF;
END$$

DELIMITER ;
