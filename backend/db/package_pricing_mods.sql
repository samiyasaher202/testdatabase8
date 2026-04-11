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

ALTER TABLE payment
ADD COLUMN Employee_ID INT,
ADD CONSTRAINT fk_Employee_ID
FOREIGN KEY (Employee_ID) REFERENCES employee(Employee_ID);

ALTER TABLE package
ADD COLUMN Payment_ID INT NULL,
ADD CONSTRAINT fk_package_payment 
  FOREIGN KEY (Payment_ID) REFERENCES payment(Payment_ID);

-- other alterations that I have made to clean up the database
ALTER TABLE support_ticket
ADD CONSTRAINT chk_ticket_status
CHECK (Ticket_Status_Code IN (0, 1, 2));

CREATE TABLE ticket_issue_type (
    Type_ID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL
);
INSERT INTO ticket_issue_type (Name) VALUES
('failed transaction'),
('payment issue'),
('delivery issue'),
('other');

ALTER TABLE support_ticket 
MODIFY COLUMN Issue_Type INT NOT NULL;

ALTER TABLE support_ticket 
ADD CONSTRAINT fk_issue_type 
FOREIGN KEY (Issue_Type) 
REFERENCES ticket_issue_type(Type_ID);

Alter table customer drop birth_day;
Alter table customer drop birth_month;
Alter table customer drop birth_year;

alter table employee drop Birth_Day;
alter table employee drop Birth_Month;
alter table employee drop Birth_Year;
alter table employee add Birthday Date null constraint ch_date_after check(Birthday >= '1900-01-01');


-- adding Date_Created and Date_Updated to all the tables since TA told me to
ALTER TABLE customer
  ADD COLUMN Date_Created DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN Date_Updated DATETIME ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE delivery
  ADD COLUMN Date_Created DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN Date_Updated DATETIME ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE department
  ADD COLUMN Date_Created DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN Date_Updated DATETIME ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE employee
  ADD COLUMN Date_Created DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN Date_Updated DATETIME ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE excess_fee
  ADD COLUMN Date_Created DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN Date_Updated DATETIME ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE package_excess_fee
  ADD COLUMN Date_Created DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN Date_Updated DATETIME ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE package_pricing
  ADD COLUMN Date_Created DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN Date_Updated DATETIME ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE package_type
  ADD COLUMN Date_Created DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN Date_Updated DATETIME ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE payment
  ADD COLUMN Date_Created DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN Date_Updated DATETIME ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE post_office
  ADD COLUMN Date_Created DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN Date_Updated DATETIME ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE product
  ADD COLUMN Date_Created DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN Date_Updated DATETIME ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE role
  ADD COLUMN Date_Created DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN Date_Updated DATETIME ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE shipment
  ADD COLUMN Date_Created DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN Date_Updated DATETIME ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE shipment_package
  ADD COLUMN Date_Created DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN Date_Updated DATETIME ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE status_code
  ADD COLUMN Date_Created DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN Date_Updated DATETIME ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE store
  ADD COLUMN Date_Created DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN Date_Updated DATETIME ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE support_ticket
  ADD COLUMN Date_Created DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN Date_Updated DATETIME ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE ticket_issue_type
  ADD COLUMN Date_Created DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN Date_Updated DATETIME ON UPDATE CURRENT_TIMESTAMP;

--seed data to test weekly report things
  INSERT INTO support_ticket 
(User_ID, Package_ID, Assigned_Employee_ID, Issue_Type, Description, Resolution_Note, Ticket_Status_Code, Date_Created, Date_Updated)
VALUES
(10, 'TRK0000001', 8,  1, 'Package not delivered on expected date.',   NULL, 0, '2026-03-18 08:30:00', NULL),
(5,  'TRK0000002', 10, 2, 'Package arrived visibly damaged.',          NULL, 1, '2026-03-19 09:15:00', NULL),
(11, 'TRK0000003', 12, 3, 'Incorrect item received in shipment.',      NULL, 1, '2026-03-20 10:00:00', NULL),
(7,  'TRK0000004', 4,  4, 'Tracking number not updating in system.',   'updated number', 2, '2026-03-21 11:45:00', NULL),
(12, 'TRK0000005', 5,  1, 'Package stuck in transit over a week.',     'found pacakage', 2, '2026-03-22 08:00:00', NULL),

(11, 'TRK0000006', 6,  2, 'Item missing from delivered package.',      NULL, 0, '2026-03-25 09:30:00', NULL),
(1,  'TRK0000007', 7,  3, 'Package delivered to wrong address.',       NULL, 1, '2026-03-26 10:00:00', NULL),
(4,  'TRK0000008', 1,  4, 'Unable to update delivery address online.', 'assisted customer', 2, '2026-03-27 13:00:00', NULL),
(2,  'TRK0000009', 2,  1, 'No delivery attempt made by courier.',      'refuned customer', 2, '2026-03-28 14:30:00', NULL),
(9,  'TRK0000010', 3,  2, 'Package shows delivered but not received.', 'assisted customer', 2, '2026-03-29 15:00:00', NULL);

ALTER TABLE package 
ADD COLUMN Payment_ID INT, 
ADD FOREIGN KEY (Payment_ID) REFERENCES payment(Payment_ID);
ALTER TABLE payment 
ADD COLUMN Employee_ID INT,
ADD FOREIGN KEY (Employee_ID) REFERENCES Employee(Employee_ID);

-- 4/11 adding bobs discord modifys onto github,
ALTER TABLE package_excess_fee MODIFY Fee_Type_Code VARCHAR(50) NOT NULL;
ALTER TABLE package_excess_fee ADD FOREIGN KEY (Fee_Type_Code) REFERENCES excess_fee(Fee_Type_Code);

-- 4/11 fixing duplicate date_creates and deleted credit_debit_information
ALTER TABLE payment DROP COLUMN Date_Created;
ALTER TABLE payment RENAME column payment_date TO date_created;
 ALTER TABLE payment DROP COLUMN credit_debit_information;

 -- correcting the fact that shipment_package will never be updated;
 ALTER TABLE shipment_package DROP COLUMN date_updated;