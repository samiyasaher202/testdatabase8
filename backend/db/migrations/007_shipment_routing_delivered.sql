-- =============================================================================
-- Add "delivered" routing events (recipient address, no post office)
-- =============================================================================
-- Run after shipment_routing_schema.sql on existing databases.
-- Enables automatic timeline rows when package status → Delivered.
-- =============================================================================

ALTER TABLE shipment_routing_event
  ADD COLUMN Location_Description VARCHAR(512) NULL DEFAULT NULL
    COMMENT 'Recipient address (or label) when Event_Type is delivered'
  AFTER Event_Time;

ALTER TABLE shipment_routing_event
  DROP FOREIGN KEY fk_sre_post_office;

ALTER TABLE shipment_routing_event
  MODIFY COLUMN Post_Office_ID INT NULL;

ALTER TABLE shipment_routing_event
  ADD CONSTRAINT fk_sre_post_office
    FOREIGN KEY (Post_Office_ID) REFERENCES post_office (Post_Office_ID)
    ON UPDATE CASCADE;

ALTER TABLE shipment_routing_event
  MODIFY COLUMN Event_Type ENUM('arrival', 'departure', 'delivered') NOT NULL;
