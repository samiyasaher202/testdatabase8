-- Package pickup records (package held at a post office for recipient).
-- mysql -u root -p your_database < backend/db/migrations/005_create_package_pickup.sql

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
