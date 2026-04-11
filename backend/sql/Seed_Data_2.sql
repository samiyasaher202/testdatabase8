-- ============================================================
--  ADDITIONAL SEED DATA — 50 more packages
--  Run AFTER Seed_Data_Complete.sql
--  Adds 10 more customers + 50 packages + shipments + deliveries
-- ============================================================

-- ── ADDITIONAL CUSTOMERS (IDs 11-20) ─────────────────────────────────────
INSERT INTO Customer (First_Name, Middle_Name, Last_Name, House_Number, Street, City, State, Zip_First3, Zip_Last2, Password_Hash, Email_Address, Phone_Number, Birth_Day, Birth_Month, Birth_Year, Sex) VALUES
('Anthony', 'B', 'Rivera',   '220', 'Pecan St',     'Houston',     'TX', '770', '12', '$2a$10$YMEEetp9.9d4dZcqfaTzeuhVO.v/KeHPKhBtswEYLI2F8dsd2EoTy', 'anthony.rivera@email.com',   '713-555-2001', 10, 5,  1989, 'M'),
('Kimberly',NULL, 'Carter',  '445', 'Magnolia Ave',  'Dallas',      'TX', '752', '06', '$2a$10$YMEEetp9.9d4dZcqfaTzeuhVO.v/KeHPKhBtswEYLI2F8dsd2EoTy', 'kimberly.carter@email.com',  '214-555-2002', 17, 8,  1993, 'F'),
('Daniel',  'R', 'Mitchell', '678', 'Cypress Rd',    'Austin',      'TX', '733', '08', '$2a$10$YMEEetp9.9d4dZcqfaTzeuhVO.v/KeHPKhBtswEYLI2F8dsd2EoTy', 'daniel.mitchell@email.com',  '512-555-2003', 25, 2,  1987, 'M'),
('Jessica', 'L', 'Perez',    '891', 'Lavender Ln',   'San Antonio', 'TX', '782', '10', '$2a$10$YMEEetp9.9d4dZcqfaTzeuhVO.v/KeHPKhBtswEYLI2F8dsd2EoTy', 'jessica.perez@email.com',    '210-555-2004',  3, 11, 1991, 'F'),
('Matthew', 'K', 'Roberts',  '102', 'Sycamore Blvd', 'Lubbock',     'TX', '794', '12', '$2a$10$YMEEetp9.9d4dZcqfaTzeuhVO.v/KeHPKhBtswEYLI2F8dsd2EoTy', 'matthew.roberts@email.com',  '806-555-2005', 19, 4,  1985, 'M'),
('Amanda',  NULL,'Sanders',  '334', 'Rosewood Dr',   'Houston',     'TX', '770', '14', '$2a$10$YMEEetp9.9d4dZcqfaTzeuhVO.v/KeHPKhBtswEYLI2F8dsd2EoTy', 'amanda.sanders@email.com',   '713-555-2006', 28, 7,  1994, 'F'),
('Kevin',   'J', 'Price',    '556', 'Bluebonnet Way', 'Dallas',     'TX', '752', '08', '$2a$10$YMEEetp9.9d4dZcqfaTzeuhVO.v/KeHPKhBtswEYLI2F8dsd2EoTy', 'kevin.price@email.com',      '214-555-2007', 14, 1,  1990, 'M'),
('Sarah',   'M', 'Hughes',   '789', 'Juniper St',    'Austin',      'TX', '733', '10', '$2a$10$YMEEetp9.9d4dZcqfaTzeuhVO.v/KeHPKhBtswEYLI2F8dsd2EoTy', 'sarah.hughes@email.com',     '512-555-2008',  7, 9,  1988, 'F'),
('Brian',   'T', 'Foster',   '901', 'Mesquite Rd',   'San Antonio', 'TX', '782', '11', '$2a$10$YMEEetp9.9d4dZcqfaTzeuhVO.v/KeHPKhBtswEYLI2F8dsd2EoTy', 'brian.foster@email.com',     '210-555-2009', 22, 3,  1986, 'M'),
('Nicole',  'A', 'Butler',   '123', 'Cottonwood Ct', 'Lubbock',     'TX', '794', '13', '$2a$10$YMEEetp9.9d4dZcqfaTzeuhVO.v/KeHPKhBtswEYLI2F8dsd2EoTy', 'nicole.butler@email.com',    '806-555-2010', 11, 6,  1992, 'F');

-- ── ADDITIONAL PACKAGES (TRK0000016 - TRK0000065) ────────────────────────
INSERT INTO Package (Tracking_Number, Sender_ID, Recipient_ID, Dim_X, Dim_Y, Dim_Z, Package_Type_Code, Weight, Zone, Oversize, Requires_Signature, Price) VALUES
('TRK0000016',  1, 11,  10.00,  8.00,  6.00, 'GEN',  2.50, 2, 0, 0,  10.00),
('TRK0000017', 11,  2,  12.00, 10.00,  8.00, 'EXP',  0.75, 3, 0, 0,  13.00),
('TRK0000018',  2, 12,  18.00, 14.00, 10.00, 'GEN',  8.00, 4, 0, 0,  16.00),
('TRK0000019', 12,  3,   6.00,  4.00,  3.00, 'EXP',  0.50, 1, 0, 0,   9.00),
('TRK0000020',  3, 13,  24.00, 18.00, 12.00, 'OVR', 20.00, 5, 1, 0,  52.00),
('TRK0000021', 13,  4,   8.00,  6.00,  4.00, 'GEN',  1.80, 2, 0, 0,   5.25),
('TRK0000022',  4, 14,  12.00, 10.00,  8.00, 'EXP',  3.20, 4, 0, 1,  24.00),
('TRK0000023', 14,  5,  30.00, 24.00, 18.00, 'OVR', 38.00, 6, 1, 0,  80.00),
('TRK0000024',  5, 15,  10.00,  8.00,  6.00, 'GEN',  4.50, 3, 0, 0,  11.00),
('TRK0000025', 15,  6,  14.00, 10.00,  8.00, 'EXP',  2.80, 5, 0, 0,  26.00),
('TRK0000026',  6, 16,   8.00,  6.00,  4.00, 'GEN',  0.90, 1, 0, 0,   4.50),
('TRK0000027', 16,  7,  18.00, 14.00, 10.00, 'OVR', 18.00, 3, 1, 0,  42.00),
('TRK0000028',  7, 17,  12.00, 10.00,  8.00, 'GEN',  6.20, 4, 0, 0,  16.00),
('TRK0000029', 17,  8,   6.00,  4.00,  3.00, 'EXP',  0.60, 2, 0, 0,  11.00),
('TRK0000030',  8, 18,  24.00, 18.00, 12.00, 'OVR', 28.00, 7, 1, 1,  61.00),
('TRK0000031', 18,  9,  10.00,  8.00,  6.00, 'GEN',  3.10, 2, 0, 0,  10.00),
('TRK0000032',  9, 19,  12.00, 10.00,  8.00, 'EXP',  1.40, 3, 0, 0,  22.00),
('TRK0000033', 19, 10,  18.00, 14.00, 10.00, 'GEN',  9.50, 5, 0, 0,  19.00),
('TRK0000034', 10, 20,   8.00,  6.00,  4.00, 'EXP',  0.80, 4, 0, 0,  15.00),
('TRK0000035', 20,  1,  30.00, 24.00, 18.00, 'OVR', 42.00, 8, 1, 1,  88.00),
('TRK0000036', 11,  3,  10.00,  8.00,  6.00, 'GEN',  2.00, 1, 0, 0,   9.00),
('TRK0000037', 12,  4,  12.00, 10.00,  8.00, 'EXP',  4.50, 6, 0, 0,  28.00),
('TRK0000038', 13,  5,  18.00, 14.00, 10.00, 'GEN',  7.80, 3, 0, 0,  14.00),
('TRK0000039', 14,  6,   6.00,  4.00,  3.00, 'EXP',  0.40, 2, 0, 0,  11.00),
('TRK0000040', 15,  7,  24.00, 18.00, 12.00, 'OVR', 25.00, 4, 1, 0,  46.00),
('TRK0000041', 16,  8,  10.00,  8.00,  6.00, 'GEN',  3.80, 5, 0, 0,  13.00),
('TRK0000042', 17,  9,  12.00, 10.00,  8.00, 'EXP',  2.10, 7, 0, 1,  30.00),
('TRK0000043', 18, 10,  18.00, 14.00, 10.00, 'OVR', 32.00, 9, 1, 0,  74.00),
('TRK0000044', 19, 11,  10.00,  8.00,  6.00, 'GEN',  5.50, 2, 0, 0,  13.00),
('TRK0000045', 20, 12,  12.00, 10.00,  8.00, 'EXP',  1.90, 3, 0, 0,  22.00),
('TRK0000046',  1, 13,   8.00,  6.00,  4.00, 'GEN',  0.70, 1, 0, 0,   4.50),
('TRK0000047',  2, 14,  24.00, 18.00, 12.00, 'OVR', 22.00, 5, 1, 1,  52.00),
('TRK0000048',  3, 15,  10.00,  8.00,  6.00, 'GEN',  4.20, 4, 0, 0,  12.00),
('TRK0000049',  4, 16,  12.00, 10.00,  8.00, 'EXP',  3.60, 6, 0, 0,  28.00),
('TRK0000050',  5, 17,  18.00, 14.00, 10.00, 'GEN', 11.00, 7, 0, 0,  25.00),
('TRK0000051',  6, 18,  10.00,  8.00,  6.00, 'EXP',  0.90, 2, 0, 0,  20.00),
('TRK0000052',  7, 19,  30.00, 24.00, 18.00, 'OVR', 55.00, 3, 1, 0,  66.00),
('TRK0000053',  8, 20,  12.00, 10.00,  8.00, 'GEN',  6.80, 5, 0, 1,  19.00),
('TRK0000054',  9, 11,   6.00,  4.00,  3.00, 'EXP',  1.20, 4, 0, 0,  24.00),
('TRK0000055', 10, 12,  18.00, 14.00, 10.00, 'OVR', 17.00, 8, 1, 0,  68.00),
('TRK0000056', 11, 13,  10.00,  8.00,  6.00, 'GEN',  2.90, 2, 0, 0,  10.00),
('TRK0000057', 12, 14,  12.00, 10.00,  8.00, 'EXP',  4.80, 9, 0, 1,  34.00),
('TRK0000058', 13, 15,  24.00, 18.00, 12.00, 'OVR', 30.00, 6, 1, 0,  56.00),
('TRK0000059', 14, 16,  10.00,  8.00,  6.00, 'GEN',  1.50, 1, 0, 0,   9.00),
('TRK0000060', 15, 17,  12.00, 10.00,  8.00, 'EXP',  2.40, 3, 0, 0,  22.00),
('TRK0000061', 16, 18,  18.00, 14.00, 10.00, 'GEN', 13.00, 7, 0, 0,  25.00),
('TRK0000062', 17, 19,   8.00,  6.00,  4.00, 'EXP',  0.70, 5, 0, 0,  16.50),
('TRK0000063', 18, 20,  30.00, 24.00, 18.00, 'OVR', 48.00, 4, 1, 1,  70.00),
('TRK0000064', 19,  1,  10.00,  8.00,  6.00, 'GEN',  3.40, 2, 0, 0,  10.00),
('TRK0000065', 20,  2,  12.00, 10.00,  8.00, 'EXP',  1.10, 6, 0, 0,  18.00);

-- ── STATUS CODES REFERENCE ────────────────────────────────────────────────
-- 1=Pending, 2=In Transit, 3=Out for Delivery, 4=Delivered, 5=Delayed, 6=Returned, 7=Lost

-- ── ADDITIONAL SHIPMENTS ──────────────────────────────────────────────────
-- Spread across all clerks and drivers (Employee IDs: 8=Ashley, 9=Joshua, 10=Megan, 11=Tyler, 12=Lauren)
INSERT INTO Shipment (Status_Code, Employee_ID, From_House_Number, From_Street, From_City, From_State, From_Zip_First3, From_Zip_Last2, To_House_Number, To_Street, To_City, To_State, To_Zip_First3, To_Zip_Last2, Departure_Time_Stamp, Arrival_Time_Stamp) VALUES
-- Ashley Hall (8) - Houston
(4,  8, '112', 'Oak St',      'Houston',     'TX', '770', '02', '220', 'Pecan St',      'Houston',     'TX', '770', '12', '2024-05-10 08:00:00', '2024-05-11 14:00:00'),
(4,  8, '234', 'Elm Ave',     'Houston',     'TX', '770', '03', '445', 'Magnolia Ave',  'Dallas',      'TX', '752', '06', '2024-06-15 09:00:00', '2024-06-17 11:00:00'),
(2,  8, '321', 'Cedar Blvd',  'Austin',      'TX', '733', '06', '678', 'Cypress Rd',    'Austin',      'TX', '733', '08', '2024-07-20 08:30:00', NULL),
(4,  8, '567', 'Pine Rd',     'Dallas',      'TX', '752', '04', '891', 'Lavender Ln',   'San Antonio', 'TX', '782', '10', '2024-08-05 07:00:00', '2024-08-07 15:00:00'),
(3,  8, '777', 'Walnut St',   'San Antonio', 'TX', '782', '08', '102', 'Sycamore Blvd', 'Lubbock',     'TX', '794', '12', '2024-09-12 08:00:00', NULL),
-- Joshua Young (9) - Houston
(4,  9, '890', 'Maple Dr',    'Dallas',      'TX', '752', '05', '334', 'Rosewood Dr',   'Houston',     'TX', '770', '14', '2024-05-18 06:30:00', '2024-05-20 13:00:00'),
(4,  9, '654', 'Birch Ln',    'Austin',      'TX', '733', '07', '556', 'Bluebonnet Way','Dallas',      'TX', '752', '08', '2024-06-22 08:00:00', '2024-06-24 16:00:00'),
(2,  9, '999', 'Willow Way',  'Lubbock',     'TX', '794', '10', '789', 'Juniper St',    'Austin',      'TX', '733', '10', '2024-07-30 09:00:00', NULL),
(4,  9, '101', 'Aspen Ct',    'Lubbock',     'TX', '794', '11', '901', 'Mesquite Rd',   'San Antonio', 'TX', '782', '11', '2024-08-14 07:30:00', '2024-08-16 12:00:00'),
(4,  9, '220', 'Pecan St',    'Houston',     'TX', '770', '12', '123', 'Cottonwood Ct', 'Lubbock',     'TX', '794', '13', '2024-09-25 08:00:00', '2024-09-28 14:00:00'),
-- Megan Allen (10) - Dallas
(4, 10, '445', 'Magnolia Ave', 'Dallas',     'TX', '752', '06', '112', 'Oak St',        'Houston',     'TX', '770', '02', '2024-05-05 08:00:00', '2024-05-07 11:00:00'),
(4, 10, '678', 'Cypress Rd',   'Austin',     'TX', '733', '08', '234', 'Elm Ave',       'Houston',     'TX', '770', '03', '2024-06-10 09:30:00', '2024-06-12 15:00:00'),
(5, 10, '891', 'Lavender Ln',  'San Antonio','TX', '782', '10', '567', 'Pine Rd',       'Dallas',      'TX', '752', '04', '2024-07-08 08:00:00', NULL),
(4, 10, '102', 'Sycamore Blvd','Lubbock',    'TX', '794', '12', '890', 'Maple Dr',      'Dallas',      'TX', '752', '05', '2024-08-20 07:00:00', '2024-08-22 13:00:00'),
(2, 10, '334', 'Rosewood Dr',  'Houston',    'TX', '770', '14', '654', 'Birch Ln',      'Austin',      'TX', '733', '07', '2024-10-01 09:00:00', NULL),
-- Tyler Scott (11) - Dallas
(4, 11, '556', 'Bluebonnet Way','Dallas',    'TX', '752', '08', '999', 'Willow Way',    'Lubbock',     'TX', '794', '10', '2024-05-22 08:00:00', '2024-05-25 14:00:00'),
(4, 11, '789', 'Juniper St',    'Austin',    'TX', '733', '10', '101', 'Aspen Ct',      'Lubbock',     'TX', '794', '11', '2024-06-28 09:00:00', '2024-06-30 16:00:00'),
(4, 11, '901', 'Mesquite Rd',   'San Antonio','TX','782', '11', '220', 'Pecan St',      'Houston',     'TX', '770', '12', '2024-07-15 08:30:00', '2024-07-17 12:00:00'),
(2, 11, '123', 'Cottonwood Ct', 'Lubbock',   'TX', '794', '13', '445', 'Magnolia Ave',  'Dallas',      'TX', '752', '06', '2024-09-05 07:00:00', NULL),
(3, 11, '112', 'Oak St',        'Houston',   'TX', '770', '02', '678', 'Cypress Rd',    'Austin',      'TX', '733', '08', '2024-10-15 08:00:00', NULL),
-- Lauren Adams (12) - Austin
(4, 12, '234', 'Elm Ave',      'Houston',    'TX', '770', '03', '891', 'Lavender Ln',   'San Antonio', 'TX', '782', '10', '2024-05-30 08:00:00', '2024-06-01 15:00:00'),
(4, 12, '567', 'Pine Rd',      'Dallas',     'TX', '752', '04', '102', 'Sycamore Blvd', 'Lubbock',     'TX', '794', '12', '2024-07-04 09:00:00', '2024-07-07 11:00:00'),
(4, 12, '890', 'Maple Dr',     'Dallas',     'TX', '752', '05', '334', 'Rosewood Dr',   'Houston',     'TX', '770', '14', '2024-08-28 08:00:00', '2024-08-30 14:00:00'),
(5, 12, '654', 'Birch Ln',     'Austin',     'TX', '733', '07', '556', 'Bluebonnet Way','Dallas',      'TX', '752', '08', '2024-09-18 07:30:00', NULL),
(2, 12, '777', 'Walnut St',    'San Antonio','TX', '782', '08', '789', 'Juniper St',    'Austin',      'TX', '733', '10', '2024-10-22 09:00:00', NULL);

-- ── SHIPMENT_PACKAGE (linking new packages to new shipments) ──────────────
-- Shipments 9-33 (new ones start after existing 8)
INSERT INTO Shipment_Package (Shipment_ID, Tracking_Number) VALUES
-- Ashley Hall shipments (9-13)
(9,  'TRK0000016'), (9,  'TRK0000017'),
(10, 'TRK0000018'), (10, 'TRK0000019'),
(11, 'TRK0000020'), (11, 'TRK0000021'),
(12, 'TRK0000022'), (12, 'TRK0000023'),
(13, 'TRK0000024'),
-- Joshua Young shipments (14-18)
(14, 'TRK0000025'), (14, 'TRK0000026'),
(15, 'TRK0000027'), (15, 'TRK0000028'),
(16, 'TRK0000029'), (16, 'TRK0000030'),
(17, 'TRK0000031'), (17, 'TRK0000032'),
(18, 'TRK0000033'), (18, 'TRK0000034'),
-- Megan Allen shipments (19-23)
(19, 'TRK0000035'), (19, 'TRK0000036'),
(20, 'TRK0000037'), (20, 'TRK0000038'),
(21, 'TRK0000039'), (21, 'TRK0000040'),
(22, 'TRK0000041'), (22, 'TRK0000042'),
(23, 'TRK0000043'),
-- Tyler Scott shipments (24-28)
(24, 'TRK0000044'), (24, 'TRK0000045'),
(25, 'TRK0000046'), (25, 'TRK0000047'),
(26, 'TRK0000048'), (26, 'TRK0000049'),
(27, 'TRK0000050'), (27, 'TRK0000051'),
(28, 'TRK0000052'),
-- Lauren Adams shipments (29-33)
(29, 'TRK0000053'), (29, 'TRK0000054'),
(30, 'TRK0000055'), (30, 'TRK0000056'),
(31, 'TRK0000057'), (31, 'TRK0000058'),
(32, 'TRK0000059'), (32, 'TRK0000060'),
(33, 'TRK0000061'), (33, 'TRK0000062'),
(33, 'TRK0000063'), (33, 'TRK0000064'),
(33, 'TRK0000065');

-- ── DELIVERIES for new packages ───────────────────────────────────────────
INSERT INTO Delivery (Tracking_Number, Delivered_Date, Signature_Required, Signature_Received, Delivery_Status_Code, Delivered_By) VALUES
('TRK0000016', '2024-05-11 14:00:00', 0, NULL, 4,  8),
('TRK0000017', '2024-05-11 15:00:00', 0, NULL, 4,  8),
('TRK0000018', '2024-06-17 11:00:00', 0, NULL, 4,  8),
('TRK0000019', '2024-06-17 12:00:00', 0, NULL, 4,  8),
('TRK0000020', NULL,                  0, NULL, 2,  8),
('TRK0000021', NULL,                  0, NULL, 2,  8),
('TRK0000022', '2024-08-07 15:00:00', 1, 'J.Rivera',  4,  8),
('TRK0000023', '2024-08-07 16:00:00', 0, NULL, 4,  8),
('TRK0000024', NULL,                  0, NULL, 3,  8),
('TRK0000025', '2024-05-20 13:00:00', 0, NULL, 4,  9),
('TRK0000026', '2024-05-20 14:00:00', 0, NULL, 4,  9),
('TRK0000027', '2024-06-24 16:00:00', 0, NULL, 4,  9),
('TRK0000028', '2024-06-24 17:00:00', 0, NULL, 4,  9),
('TRK0000029', NULL,                  0, NULL, 2,  9),
('TRK0000030', NULL,                  1, NULL, 2,  9),
('TRK0000031', '2024-08-16 12:00:00', 0, NULL, 4,  9),
('TRK0000032', '2024-08-16 13:00:00', 0, NULL, 4,  9),
('TRK0000033', '2024-09-28 14:00:00', 0, NULL, 4,  9),
('TRK0000034', '2024-09-28 15:00:00', 0, NULL, 4,  9),
('TRK0000035', '2024-05-07 11:00:00', 0, NULL, 4, 10),
('TRK0000036', '2024-05-07 12:00:00', 0, NULL, 4, 10),
('TRK0000037', '2024-06-12 15:00:00', 0, NULL, 4, 10),
('TRK0000038', '2024-06-12 16:00:00', 0, NULL, 4, 10),
('TRK0000039', NULL,                  0, NULL, 5, 10),
('TRK0000040', NULL,                  0, NULL, 5, 10),
('TRK0000041', '2024-08-22 13:00:00', 0, NULL, 4, 10),
('TRK0000042', '2024-08-22 14:00:00', 1, 'S.Hughes',  4, 10),
('TRK0000043', NULL,                  0, NULL, 2, 10),
('TRK0000044', '2024-05-25 14:00:00', 0, NULL, 4, 11),
('TRK0000045', '2024-05-25 15:00:00', 0, NULL, 4, 11),
('TRK0000046', '2024-06-30 16:00:00', 0, NULL, 4, 11),
('TRK0000047', '2024-06-30 17:00:00', 1, 'D.Mitchell', 4, 11),
('TRK0000048', '2024-07-17 12:00:00', 0, NULL, 4, 11),
('TRK0000049', '2024-07-17 13:00:00', 0, NULL, 4, 11),
('TRK0000050', NULL,                  0, NULL, 2, 11),
('TRK0000051', NULL,                  0, NULL, 3, 11),
('TRK0000052', NULL,                  0, NULL, 2, 12),
('TRK0000053', '2024-06-01 15:00:00', 1, 'B.Foster',  4, 12),
('TRK0000054', '2024-06-01 16:00:00', 0, NULL, 4, 12),
('TRK0000055', '2024-07-07 11:00:00', 0, NULL, 4, 12),
('TRK0000056', '2024-07-07 12:00:00', 0, NULL, 4, 12),
('TRK0000057', '2024-08-30 14:00:00', 1, 'N.Butler',  4, 12),
('TRK0000058', '2024-08-30 15:00:00', 0, NULL, 4, 12),
('TRK0000059', NULL,                  0, NULL, 5, 12),
('TRK0000060', NULL,                  0, NULL, 2, 12),
('TRK0000061', NULL,                  0, NULL, 2, 12),
('TRK0000062', NULL,                  0, NULL, 3, 12),
('TRK0000063', NULL,                  1, NULL, 2, 12),
('TRK0000064', NULL,                  0, NULL, 2, 12),
('TRK0000065', NULL,                  0, NULL, 2, 12);

-- ── ADDITIONAL PAYMENTS ───────────────────────────────────────────────────
INSERT INTO Payment (Customer_ID, Store_ID, Items, Payment_Type, Payment_Amount, Payment_Status, Employee_ID) VALUES
(1,  1, 2, 1, 23.00,  'completed',  8),
(11, 1, 1, 2, 13.00,  'completed',  8),
(2,  1, 3, 1, 36.00,  'completed',  8),
(12, 2, 1, 2,  9.00,  'completed',  8),
(3,  2, 2, 1, 52.00,  'completed',  8),
(4,  1, 2, 1, 85.00,  'completed',  9),
(13, 2, 1, 2,  5.25,  'completed',  9),
(5,  2, 3, 1, 49.00,  'completed',  9),
(14, 3, 1, 2, 26.00,  'completed',  9),
(6,  3, 2, 1,  4.50,  'completed',  9),
(15, 3, 2, 1, 49.00,  'completed',  9),
(16, 4, 1, 2, 42.00,  'completed', 10),
(7,  4, 3, 1, 16.00,  'completed', 10),
(17, 4, 1, 2, 11.00,  'completed', 10),
(8,  5, 2, 1, 61.00,  'completed', 10),
(18, 5, 1, 2, 10.00,  'completed', 10),
(9,  5, 2, 1, 22.00,  'completed', 10),
(19, 1, 1, 1, 19.00,  'completed', 10),
(10, 2, 1, 2, 15.00,  'completed', 10),
(20, 3, 2, 1, 88.00,  'completed', 11),
(11, 4, 1, 2,  9.00,  'completed', 11),
(12, 5, 2, 1, 56.00,  'completed', 11),
(13, 1, 1, 1, 12.00,  'completed', 11),
(14, 2, 1, 2, 22.00,  'completed', 11),
(15, 3, 2, 1, 25.00,  'completed', 11),
(16, 4, 1, 2, 16.50,  'completed', 12),
(17, 5, 2, 1, 70.00,  'completed', 12),
(18, 1, 1, 2, 10.00,  'completed', 12),
(19, 2, 1, 1, 22.00,  'completed', 12),
(20, 3, 2, 1, 25.00,  'completed', 12);


INSERT INTO Employee (Post_Office_ID, Supervisor_ID, Role_ID, Department_ID, First_Name, Middle_Name, Last_Name, Birth_Day, Birth_Month, Birth_Year, Password_Hash, Email_Address, Phone_Number, Sex, Salary) VALUES
(4, 13, 1, 1, 'Marcus',   'D', 'Bell',     16, 4,  1994, '$2a$10$kdMky0yh3FVqVBzXATNM/uYAd6L9WtXKnSrrV66P1ucpb/zyDvM0q', 'marcus.bell@postoffice8.com',     '210-500-3001', 'M', 37000.00),
(4, 13, 2, 2, 'Diana',    'K', 'Cruz',      9, 7,  1991, '$2a$10$kdMky0yh3FVqVBzXATNM/uYAd6L9WtXKnSrrV66P1ucpb/zyDvM0q', 'diana.cruz@postoffice8.com',      '210-500-3002', 'F', 39500.00),
(5, 14, 1, 1, 'Ethan',    'R', 'Coleman',  23, 11, 1989, '$2a$10$kdMky0yh3FVqVBzXATNM/uYAd6L9WtXKnSrrV66P1ucpb/zyDvM0q', 'ethan.coleman@postoffice8.com',   '806-500-3003', 'M', 37500.00),
(5, 14, 2, 2, 'Brittany', 'S', 'Simmons',   2, 3,  1996, '$2a$10$kdMky0yh3FVqVBzXATNM/uYAd6L9WtXKnSrrV66P1ucpb/zyDvM0q', 'brittany.simmons@postoffice8.com','806-500-3004', 'F', 40000.00);

-- New Employee IDs: Marcus Bell=15, Diana Cruz=16, Ethan Coleman=17, Brittany Simmons=18

-- ── NEW PACKAGES FOR SAN ANTONIO & LUBBOCK ───────────────────────────────
INSERT INTO Package (Tracking_Number, Sender_ID, Recipient_ID, Dim_X, Dim_Y, Dim_Z, Package_Type_Code, Weight, Zone, Oversize, Requires_Signature, Price) VALUES
-- San Antonio packages
('TRK0000066',  7, 11,  10.00,  8.00,  6.00, 'GEN',  3.20, 3, 0, 0,  11.00),
('TRK0000067',  8, 12,  12.00, 10.00,  8.00, 'EXP',  1.50, 4, 0, 0,  24.00),
('TRK0000068', 14,  1,  18.00, 14.00, 10.00, 'GEN',  8.50, 5, 0, 0,  19.00),
('TRK0000069',  3, 14,  24.00, 18.00, 12.00, 'OVR', 22.00, 6, 1, 1,  56.00),
('TRK0000070', 11,  8,  10.00,  8.00,  6.00, 'EXP',  0.80, 2, 0, 0,  20.00),
('TRK0000071',  7, 15,  12.00, 10.00,  8.00, 'GEN',  5.00, 3, 0, 0,  14.00),
('TRK0000072', 14, 20,  18.00, 14.00, 10.00, 'EXP',  3.80, 5, 0, 0,  33.00),
-- Lubbock packages
('TRK0000073',  9, 13,  10.00,  8.00,  6.00, 'GEN',  2.10, 2, 0, 0,  10.00),
('TRK0000074', 10, 14,  12.00, 10.00,  8.00, 'EXP',  4.20, 4, 0, 1,  30.00),
('TRK0000075', 15,  2,  18.00, 14.00, 10.00, 'GEN',  9.00, 6, 0, 0,  22.00),
('TRK0000076',  5, 15,  24.00, 18.00, 12.00, 'OVR', 28.00, 7, 1, 0,  85.00),
('TRK0000077', 20,  9,  10.00,  8.00,  6.00, 'EXP',  1.20, 3, 0, 0,  22.00),
('TRK0000078', 10, 16,  12.00, 10.00,  8.00, 'GEN',  6.50, 4, 0, 0,  16.00),
('TRK0000079', 15,  3,  18.00, 14.00, 10.00, 'EXP',  2.90, 5, 0, 0,  33.00),
-- Lost packages (Status 7)
('TRK0000080',  1,  6,  10.00,  8.00,  6.00, 'GEN',  3.50, 4, 0, 0,  12.00),
('TRK0000081',  3,  8,  12.00, 10.00,  8.00, 'EXP',  1.80, 6, 0, 0,  28.00),
('TRK0000082', 12,  5,  18.00, 14.00, 10.00, 'OVR', 20.00, 8, 1, 0,  68.00),
-- Returned packages (Status 6)
('TRK0000083',  2,  7,  10.00,  8.00,  6.00, 'GEN',  2.20, 3, 0, 0,  11.00),
('TRK0000084',  4,  9,  12.00, 10.00,  8.00, 'EXP',  3.10, 5, 0, 1,  26.00),
('TRK0000085', 16,  4,  18.00, 14.00, 10.00, 'GEN',  7.80, 7, 0, 0,  25.00);

-- ── SHIPMENTS ─────────────────────────────────────────────────────────────
-- Shipments 34+ (after existing 33)
INSERT INTO Shipment (Status_Code, Employee_ID, From_House_Number, From_Street, From_City, From_State, From_Zip_First3, From_Zip_Last2, To_House_Number, To_Street, To_City, To_State, To_Zip_First3, To_Zip_Last2, Departure_Time_Stamp, Arrival_Time_Stamp) VALUES
-- Marcus Bell (15) - San Antonio clerk
(4, 15, '888', 'Spruce Ave',   'San Antonio', 'TX', '782', '09', '220', 'Pecan St',     'Houston',     'TX', '770', '12', '2024-06-05 08:00:00', '2024-06-07 14:00:00'),
(4, 15, '777', 'Walnut St',    'San Antonio', 'TX', '782', '08', '445', 'Magnolia Ave', 'Dallas',      'TX', '752', '06', '2024-07-12 09:00:00', '2024-07-14 15:00:00'),
(4, 15, '891', 'Lavender Ln',  'San Antonio', 'TX', '782', '10', '678', 'Cypress Rd',   'Austin',      'TX', '733', '08', '2024-08-18 08:00:00', '2024-08-19 12:00:00'),
(2, 15, '400', 'Broadway St',  'San Antonio', 'TX', '782', '01', '334', 'Rosewood Dr',  'Houston',     'TX', '770', '14', '2024-09-22 07:30:00', NULL),
-- Diana Cruz (16) - San Antonio driver
(4, 16, '654', 'Birch Ln',     'Austin',      'TX', '733', '07', '891', 'Lavender Ln',  'San Antonio', 'TX', '782', '10', '2024-06-20 08:00:00', '2024-06-22 16:00:00'),
(4, 16, '556', 'Bluebonnet Way','Dallas',     'TX', '752', '08', '777', 'Walnut St',    'San Antonio', 'TX', '782', '08', '2024-07-28 09:00:00', '2024-07-30 13:00:00'),
(2, 16, '112', 'Oak St',       'Houston',     'TX', '770', '02', '888', 'Spruce Ave',   'San Antonio', 'TX', '782', '09', '2024-10-05 08:00:00', NULL),
-- Ethan Coleman (17) - Lubbock clerk
(4, 17, '101', 'Aspen Ct',     'Lubbock',     'TX', '794', '11', '112', 'Oak St',       'Houston',     'TX', '770', '02', '2024-05-15 07:00:00', '2024-05-18 11:00:00'),
(4, 17, '999', 'Willow Way',   'Lubbock',     'TX', '794', '10', '567', 'Pine Rd',      'Dallas',      'TX', '752', '04', '2024-07-01 08:00:00', '2024-07-04 14:00:00'),
(4, 17, '500', 'Lubbock Ave',  'Lubbock',     'TX', '794', '01', '890', 'Maple Dr',     'Dallas',      'TX', '752', '05', '2024-08-10 09:00:00', '2024-08-13 15:00:00'),
(2, 17, '123', 'Cottonwood Ct','Lubbock',     'TX', '794', '13', '654', 'Birch Ln',     'Austin',      'TX', '733', '07', '2024-10-12 08:00:00', NULL),
-- Brittany Simmons (18) - Lubbock driver
(4, 18, '789', 'Juniper St',   'Austin',      'TX', '733', '10', '101', 'Aspen Ct',     'Lubbock',     'TX', '794', '11', '2024-06-08 08:00:00', '2024-06-11 12:00:00'),
(4, 18, '901', 'Mesquite Rd',  'San Antonio', 'TX', '782', '11', '999', 'Willow Way',   'Lubbock',     'TX', '794', '10', '2024-07-22 09:00:00', '2024-07-25 16:00:00'),
(2, 18, '234', 'Elm Ave',      'Houston',     'TX', '770', '03', '500', 'Lubbock Ave',  'Lubbock',     'TX', '794', '01', '2024-09-30 08:00:00', NULL),
-- Lost/Returned shipments (employee 9 Joshua handles these)
(7,  9, '321', 'Cedar Blvd',   'Austin',      'TX', '733', '06', '777', 'Walnut St',    'San Antonio', 'TX', '782', '08', '2024-04-10 08:00:00', NULL),
(7, 11, '654', 'Birch Ln',     'Austin',      'TX', '733', '07', '999', 'Willow Way',   'Lubbock',     'TX', '794', '10', '2024-05-02 09:00:00', NULL),
(7, 10, '112', 'Oak St',       'Houston',     'TX', '770', '02', '890', 'Maple Dr',     'Dallas',      'TX', '752', '05', '2024-06-14 08:00:00', NULL),
(6,  8, '567', 'Pine Rd',      'Dallas',      'TX', '752', '04', '234', 'Elm Ave',      'Houston',     'TX', '770', '03', '2024-04-20 08:00:00', NULL),
(6, 12, '890', 'Maple Dr',     'Dallas',      'TX', '752', '05', '321', 'Cedar Blvd',   'Austin',      'TX', '733', '06', '2024-07-08 09:00:00', NULL),
(6, 15, '777', 'Walnut St',    'San Antonio', 'TX', '782', '08', '101', 'Aspen Ct',     'Lubbock',     'TX', '794', '11', '2024-08-25 08:00:00', NULL);

-- ── SHIPMENT_PACKAGE ──────────────────────────────────────────────────────
-- Shipments 34-53
INSERT INTO Shipment_Package (Shipment_ID, Tracking_Number) VALUES
-- Marcus Bell (34-37)
(34, 'TRK0000066'), (34, 'TRK0000067'),
(35, 'TRK0000068'), (35, 'TRK0000069'),
(36, 'TRK0000070'), (36, 'TRK0000071'),
(37, 'TRK0000072'),
-- Diana Cruz (38-40)
(38, 'TRK0000066'), -- note: shared route, different packages
(39, 'TRK0000067'),
(40, 'TRK0000068'),
-- Ethan Coleman (41-44)
(41, 'TRK0000073'), (41, 'TRK0000074'),
(42, 'TRK0000075'), (42, 'TRK0000076'),
(43, 'TRK0000077'), (43, 'TRK0000078'),
(44, 'TRK0000079'),
-- Brittany Simmons (45-47)
(45, 'TRK0000073'),
(46, 'TRK0000074'),
(47, 'TRK0000075'),
-- Lost (48-50)
(48, 'TRK0000080'),
(49, 'TRK0000081'),
(50, 'TRK0000082'),
-- Returned (51-53)
(51, 'TRK0000083'),
(52, 'TRK0000084'),
(53, 'TRK0000085');

-- ── DELIVERIES ────────────────────────────────────────────────────────────
INSERT INTO Delivery (Tracking_Number, Delivered_Date, Signature_Required, Signature_Received, Delivery_Status_Code, Delivered_By) VALUES
-- San Antonio deliveries
('TRK0000066', '2024-06-07 14:00:00', 0, NULL,        4, 15),
('TRK0000067', '2024-06-07 15:00:00', 0, NULL,        4, 15),
('TRK0000068', '2024-07-14 15:00:00', 0, NULL,        4, 15),
('TRK0000069', '2024-08-19 12:00:00', 1, 'J.Perez',   4, 15),
('TRK0000070', NULL,                  0, NULL,        2, 16),
('TRK0000071', '2024-06-22 16:00:00', 0, NULL,        4, 16),
('TRK0000072', '2024-07-30 13:00:00', 0, NULL,        4, 16),
-- Lubbock deliveries
('TRK0000073', '2024-05-18 11:00:00', 0, NULL,        4, 17),
('TRK0000074', '2024-05-18 12:00:00', 1, 'M.Roberts', 4, 17),
('TRK0000075', '2024-07-04 14:00:00', 0, NULL,        4, 17),
('TRK0000076', '2024-08-13 15:00:00', 0, NULL,        4, 18),
('TRK0000077', '2024-06-11 12:00:00', 0, NULL,        4, 18),
('TRK0000078', '2024-07-25 16:00:00', 0, NULL,        4, 18),
('TRK0000079', NULL,                  0, NULL,        2, 18),
-- Lost packages
('TRK0000080', NULL, 0, NULL, 7,  9),
('TRK0000081', NULL, 0, NULL, 7, 11),
('TRK0000082', NULL, 0, NULL, 7, 10),
-- Returned packages
('TRK0000083', NULL, 0, NULL, 6,  8),
('TRK0000084', NULL, 1, NULL, 6, 12),
('TRK0000085', NULL, 0, NULL, 6, 15);

-- ── PAYMENTS ─────────────────────────────────────────────────────────────
INSERT INTO Payment (Customer_ID, Store_ID, Items, Payment_Type, Payment_Amount, Payment_Status, Employee_ID) VALUES
-- San Antonio payments
(7,  4, 2, 1, 35.00, 'completed', 15),
(8,  4, 1, 2, 24.00, 'completed', 15),
(14, 4, 2, 1, 75.00, 'completed', 15),
(11, 4, 1, 2, 20.00, 'completed', 16),
(3,  4, 2, 1, 53.00, 'completed', 16),
(7,  4, 1, 1, 47.00, 'completed', 16),
-- Lubbock payments
(9,  5, 2, 1, 40.00, 'completed', 17),
(10, 5, 1, 2, 30.00, 'completed', 17),
(15, 5, 2, 1, 107.00,'completed', 17),
(20, 5, 1, 2, 22.00, 'completed', 18),
(5,  5, 2, 1, 55.00, 'completed', 18),
(10, 5, 1, 1, 33.00, 'completed', 18);
