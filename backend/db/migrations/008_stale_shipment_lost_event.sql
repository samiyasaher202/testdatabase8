-- =============================================================================
-- Stale shipment → mark package LOST + notify sender only
-- =============================================================================
-- MySQL cannot fire a trigger "14 days later". This migration provides:
--   1) Table `customer_package_alert` — notification outbox (app or job sends email)
--   2) Procedure `sp_mark_stale_packages_lost` — packages on a leg that has at least
--      one shipment_routing_event (arrival or departure) whose *latest* such
--      Event_Time is older than 14 days; delivery not already final
--   3) Event `ev_mark_stale_packages_lost` — runs the procedure daily
--   4) Trigger `tr_delivery_au_notify_package_lost` — when delivery becomes Lost,
--      inserts one alert row for the sender only
--
-- Enable scheduler (required for the EVENT; may need SUPER or appropriate privilege):
--   SET GLOBAL event_scheduler = ON;
--   SHOW VARIABLES LIKE 'event_scheduler';
--
-- App also runs the same procedure on a timer (see backend/db/stale_shipment_lost_job.js)
-- and POST /api/employee/stale-shipment-lost-sweep so LOST + trigger work without event_scheduler.
--
-- Stale = strictly more than 14 full days: MAX(arrival/departure Event_Time) < NOW() - INTERVAL 14 DAY
-- (e.g. last scan Mar 30 → not eligible until after ~Apr 14). `delivered` routing rows do not count.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Outbox: workers read unsent rows and email Customer.Email_Address
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customer_package_alert (
  Alert_ID INT NOT NULL AUTO_INCREMENT,
  Customer_ID INT NOT NULL,
  Tracking_Number VARCHAR(20) NOT NULL,
  Email_Address VARCHAR(100) NOT NULL,
  Alert_Reason VARCHAR(64) NOT NULL DEFAULT 'package_marked_lost',
  Message_Text VARCHAR(512) NOT NULL,
  Created_At DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  Processed_At DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (Alert_ID),
  UNIQUE KEY uq_customer_tracking_reason (Customer_ID, Tracking_Number, Alert_Reason),
  KEY idx_alert_unprocessed (Processed_At, Created_At),
  CONSTRAINT fk_cpa_customer FOREIGN KEY (Customer_ID) REFERENCES customer (Customer_ID)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_cpa_package FOREIGN KEY (Tracking_Number) REFERENCES package (Tracking_Number)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------------------------
-- Procedure: mark LOST when latest arrival/departure in shipment_routing_event
--            is older than 14 days (routing scans only; no shipment table times)
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- Daily job (adjust schedule as needed)
-- -----------------------------------------------------------------------------
DROP EVENT IF EXISTS ev_mark_stale_packages_lost;

CREATE EVENT ev_mark_stale_packages_lost
ON SCHEDULE EVERY 1 DAY
STARTS (TIMESTAMP(CURRENT_DATE) + INTERVAL 1 DAY + INTERVAL 3 HOUR)
ON COMPLETION PRESERVE
ENABLE
COMMENT 'Marks packages lost 14+ days after last shipment_routing arrival/departure'
DO CALL sp_mark_stale_packages_lost();

-- -----------------------------------------------------------------------------
-- Trigger: when delivery row changes TO Lost, queue notice for sender only
-- (Fires for procedure updates and manual employee updates.)
-- -----------------------------------------------------------------------------
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

-- End 008_stale_shipment_lost_event.sql
