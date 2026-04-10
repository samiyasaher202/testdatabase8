-- Turn on MySQL Event Scheduler so evt_daily_package_pickup_storage runs.
-- Requires a user with SYSTEM_VARIABLES_ADMIN (MySQL 8+) or SUPER (older).
-- Create the event/procedure: run 006 (and 007), then 010 so the event calls sp_daily_package_pickup_storage.
-- mysql -u root -p your_database < backend/db/migrations/008_enable_event_scheduler.sql

SET GLOBAL event_scheduler = ON;

-- Ensure the pickup event is active (skip if you have not run 006 yet).
ALTER EVENT evt_daily_package_pickup_storage ENABLE;
