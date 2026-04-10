-- Nightly procedure + event: late fees + 30-day disposal (delivery + shipment).
-- Apply to the DB your app uses, e.g.:
--   mysql -u root -p post_officedb < backend/db/migrations/010_package_pickup_disposal_procedure_and_event.sql
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
