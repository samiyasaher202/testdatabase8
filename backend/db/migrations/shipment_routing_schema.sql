-- =============================================================================
-- SHIPMENT ROUTING — schema changes (single file)
-- =============================================================================
-- Purpose:
--   Employees log each time a package (on a shipment leg) *arrives at* or
--   *departs from* a post office. Each row in `shipment` is one leg (unique
--   Shipment_ID) from origin toward the destination; `shipment_package` links
--   a tracking number to that leg. This table stores the fine-grained timeline.
--
-- Related tables used by the app:
--   shipment              — leg metadata (from/to addresses, status, timestamps)
--   shipment_package      — (Shipment_ID, Tracking_Number)
--   post_office           — which facility the scan happened at
--   employee              — who logged the event (optional FK)
--
-- Apply on an existing database:
--   mysql -u root -p YOUR_DB < backend/db/shipment_routing_schema.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Table: shipment_routing_event
-- One row per scan: arrival or departure at a post office for a given shipment leg.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shipment_routing_event (
  Event_ID INT NOT NULL AUTO_INCREMENT,
  Shipment_ID INT NOT NULL,
  Post_Office_ID INT NULL,
  Event_Type ENUM('arrival', 'departure', 'delivered') NOT NULL,
  Event_Time DATETIME NOT NULL,
  Location_Description VARCHAR(512) NULL DEFAULT NULL COMMENT 'Recipient address when Event_Type is delivered',
  Logged_By_Employee_ID INT NULL,
  PRIMARY KEY (Event_ID),
  KEY idx_sre_shipment_time (Shipment_ID, Event_Time),
  CONSTRAINT fk_sre_shipment
    FOREIGN KEY (Shipment_ID) REFERENCES shipment (Shipment_ID)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_sre_post_office
    FOREIGN KEY (Post_Office_ID) REFERENCES post_office (Post_Office_ID)
    ON UPDATE CASCADE,
  CONSTRAINT fk_sre_employee
    FOREIGN KEY (Logged_By_Employee_ID) REFERENCES employee (Employee_ID)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- End of shipment_routing_schema.sql
