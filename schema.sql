-- ============================================================
--  POST OFFICE 8 — SCHEMA
--  Create tables BEFORE running Seed_Data.sql
-- ============================================================

USE post_office_8;

-- ── 1. POST OFFICES ──────────────────────────────────────────────────────
CREATE TABLE Post_Office (
  Post_Office_ID INT AUTO_INCREMENT PRIMARY KEY,
  House_Number VARCHAR(10),
  Street VARCHAR(100),
  City VARCHAR(50),
  State VARCHAR(2),
  Zip_First3 VARCHAR(3),
  Zip_Last2 VARCHAR(2),
  Country VARCHAR(3),
  Phone_Number VARCHAR(15),
  Sun_Start_Time TIME,
  Sun_Finish_Time TIME,
  Mon_Start_Time TIME,
  Mon_Finish_Time TIME,
  Tue_Start_Time TIME,
  Tue_Finish_Time TIME,
  Wed_Start_Time TIME,
  Wed_Finish_Time TIME,
  Thu_Start_Time TIME,
  Thu_Finish_Time TIME,
  Fri_Start_Time TIME,
  Fri_Finish_Time TIME,
  Sat_Start_Time TIME,
  Sat_Finish_Time TIME
);

-- ── 2. STORES ────────────────────────────────────────────────────────────
CREATE TABLE Store (
  Store_ID INT AUTO_INCREMENT PRIMARY KEY,
  Post_Office_ID INT,
  FOREIGN KEY (Post_Office_ID) REFERENCES Post_Office(Post_Office_ID)
);

-- ── 3. PRODUCTS ──────────────────────────────────────────────────────────
CREATE TABLE Product (
  Universal_Product_Code VARCHAR(20) PRIMARY KEY,
  Store_ID INT,
  Product_name VARCHAR(100),
  Price DECIMAL(10,2),
  Quantity INT,
  FOREIGN KEY (Store_ID) REFERENCES Store(Store_ID)
);

-- ── 4. CUSTOMERS ─────────────────────────────────────────────────────────
CREATE TABLE Customer (
  Customer_ID INT AUTO_INCREMENT PRIMARY KEY,
  First_Name VARCHAR(50),
  Middle_Name VARCHAR(50),
  Last_Name VARCHAR(50),
  House_Number VARCHAR(10),
  Street VARCHAR(100),
  City VARCHAR(50),
  State VARCHAR(2),
  Zip_First3 VARCHAR(3),
  Zip_Last2 VARCHAR(2),
  Apt_Number VARCHAR(10),
  Zip_Plus4 VARCHAR(4),
  Password_Hash VARCHAR(255),
  Email_Address VARCHAR(100) UNIQUE,
  Phone_Number VARCHAR(15),
  Country VARCHAR(3)
);

-- ── 5. ROLES ─────────────────────────────────────────────────────────────
CREATE TABLE Role (
  Role_ID INT AUTO_INCREMENT PRIMARY KEY,
  Role_Name VARCHAR(50),
  Role_Description TEXT,
  Access_Level INT
);

-- ── 6. DEPARTMENTS ───────────────────────────────────────────────────────
CREATE TABLE Department (
  Department_ID INT AUTO_INCREMENT PRIMARY KEY,
  Department_Name VARCHAR(100)
);

-- ── 7. EMPLOYEES ─────────────────────────────────────────────────────────
CREATE TABLE Employee (
  Employee_ID INT AUTO_INCREMENT PRIMARY KEY,
  Post_Office_ID INT,
  Supervisor_ID INT,
  Role_ID INT,
  Department_ID INT,
  First_Name VARCHAR(50),
  Middle_Name VARCHAR(50),
  Last_Name VARCHAR(50),
  Birth_Day INT,
  Birth_Month INT,
  Birth_Year INT,
  Password_Hash VARCHAR(255),
  Email_Address VARCHAR(100) UNIQUE,
  Phone_Number VARCHAR(15),
  Sex CHAR(1),
  Salary DECIMAL(10,2),
  Hours_Worked DECIMAL(5,2) DEFAULT 0,
  Is_Active ENUM('1','0') NOT NULL DEFAULT '1',
  FOREIGN KEY (Post_Office_ID) REFERENCES Post_Office(Post_Office_ID),
  FOREIGN KEY (Supervisor_ID) REFERENCES Employee(Employee_ID),
  FOREIGN KEY (Role_ID) REFERENCES Role(Role_ID),
  FOREIGN KEY (Department_ID) REFERENCES Department(Department_ID)
);

-- ── 8. PACKAGE TYPES ─────────────────────────────────────────────────────
CREATE TABLE Package_Type (
  Package_Type_Code VARCHAR(3) PRIMARY KEY,
  Description TEXT,
  Type_Name VARCHAR(50)
);

-- ── 9. EXCESS FEES ───────────────────────────────────────────────────────
CREATE TABLE Excess_Fee (
  Fee_Type_Code VARCHAR(10) PRIMARY KEY,
  Description TEXT,
  Type_Name VARCHAR(50),
  Additional_Price DECIMAL(10,2)
);

-- ── 10. PACKAGES ─────────────────────────────────────────────────────────
CREATE TABLE Package (
  Tracking_Number VARCHAR(20) PRIMARY KEY,
  Sender_ID INT,
  Recipient_ID INT,
  Dim_X DECIMAL(5,2),
  Dim_Y DECIMAL(5,2),
  Dim_Z DECIMAL(5,2),
  Package_Type_Code VARCHAR(3),
  Weight DECIMAL(5,2),
  Zone INT,
  Oversize TINYINT(1),
  Requires_Signature TINYINT(1),
  Price DECIMAL(10,2),
  Date_Created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  Date_Updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (Sender_ID) REFERENCES Customer(Customer_ID),
  FOREIGN KEY (Recipient_ID) REFERENCES Customer(Customer_ID),
  FOREIGN KEY (Package_Type_Code) REFERENCES Package_Type(Package_Type_Code)
);

-- ── 11. STATUS CODES ─────────────────────────────────────────────────────
CREATE TABLE Status_Code (
  Status_Code INT PRIMARY KEY,
  Status_Name VARCHAR(50),
  Is_Final_Status TINYINT(1)
);

-- ── 12. SHIPMENTS ────────────────────────────────────────────────────────
CREATE TABLE Shipment (
  Shipment_ID INT AUTO_INCREMENT PRIMARY KEY,
  Status_Code INT,
  Employee_ID INT,
  From_House_Number VARCHAR(10),
  From_Street VARCHAR(100),
  From_City VARCHAR(50),
  From_State VARCHAR(2),
  From_Zip_First3 VARCHAR(3),
  From_Zip_Last2 VARCHAR(2),
  To_House_Number VARCHAR(10),
  To_Street VARCHAR(100),
  To_City VARCHAR(50),
  To_State VARCHAR(2),
  To_Zip_First3 VARCHAR(3),
  To_Zip_Last2 VARCHAR(2),
  Departure_Time_Stamp DATETIME,
  Arrival_Time_Stamp DATETIME,
  FOREIGN KEY (Status_Code) REFERENCES Status_Code(Status_Code),
  FOREIGN KEY (Employee_ID) REFERENCES Employee(Employee_ID)
);

-- ── 13. SHIPMENT_PACKAGE ─────────────────────────────────────────────────
CREATE TABLE Shipment_Package (
  Shipment_ID INT,
  Tracking_Number VARCHAR(20),
  PRIMARY KEY (Shipment_ID, Tracking_Number),
  FOREIGN KEY (Shipment_ID) REFERENCES Shipment(Shipment_ID),
  FOREIGN KEY (Tracking_Number) REFERENCES Package(Tracking_Number)
);

-- ── 14. DELIVERIES ───────────────────────────────────────────────────────
CREATE TABLE Delivery (
  Tracking_Number VARCHAR(20) PRIMARY KEY,
  Delivered_Date DATETIME,
  Signature_Required TINYINT(1),
  Signature_Received VARCHAR(255),
  Delivery_Status_Code INT,
  Delivered_By INT,
  FOREIGN KEY (Tracking_Number) REFERENCES Package(Tracking_Number),
  FOREIGN KEY (Delivery_Status_Code) REFERENCES Status_Code(Status_Code),
  FOREIGN KEY (Delivered_By) REFERENCES Employee(Employee_ID)
);

-- ── 14b. PACKAGE PICKUP (held at post office for recipient) ─────────────
CREATE TABLE Package_Pickup (
  Tracking_Number VARCHAR(20) NOT NULL PRIMARY KEY,
  Recipient_ID INT NOT NULL,
  Post_Office_ID INT NOT NULL,
  Arrival_Time DATETIME NULL,
  Pickup_Time DATETIME NULL,
  Is_picked_Up ENUM('1','0') NOT NULL DEFAULT '0',
  FOREIGN KEY (Tracking_Number) REFERENCES Package(Tracking_Number),
  FOREIGN KEY (Recipient_ID) REFERENCES Customer(Customer_ID),
  FOREIGN KEY (Post_Office_ID) REFERENCES Post_Office(Post_Office_ID)
);

-- ── 15. SUPPORT TICKETS ──────────────────────────────────────────────────
CREATE TABLE Support_Ticket (
  Ticket_ID INT AUTO_INCREMENT PRIMARY KEY,
  User_ID INT,
  Package_ID VARCHAR(20),
  Assigned_Employee_ID INT,
  Issue_Type INT,
  Description TEXT,
  Resolution_Note TEXT,
  Ticket_Status_Code INT,
  Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  Updated_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (User_ID) REFERENCES Customer(Customer_ID),
  FOREIGN KEY (Package_ID) REFERENCES Package(Tracking_Number),
  FOREIGN KEY (Assigned_Employee_ID) REFERENCES Employee(Employee_ID)
);

-- ── 16. PAYMENTS ─────────────────────────────────────────────────────────
CREATE TABLE Payment (
  Payment_ID INT AUTO_INCREMENT PRIMARY KEY,
  Customer_ID INT,
  Store_ID INT,
  Items INT,
  Payment_Type INT,
  Payment_Amount DECIMAL(10,2),
  Payment_Status VARCHAR(20),
  Payment_Date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  Employee_ID INT NOT NULL,
  FOREIGN KEY (Customer_ID) REFERENCES Customer(Customer_ID),
  FOREIGN KEY (Store_ID) REFERENCES Store(Store_ID),
  FOREIGN KEY (Employee_ID) REFERENCES Employee(Employee_ID)
);

-- ── 17. PACKAGE PRICING ──────────────────────────────────────────────────
CREATE TABLE package_pricing (
  Pricing_ID INT AUTO_INCREMENT PRIMARY KEY,
  Package_Type_Code VARCHAR(3),
  Min_Weight DECIMAL(5,2),
  Max_Weight DECIMAL(5,2),
  Zone INT,
  Price DECIMAL(10,2),
  FOREIGN KEY (Package_Type_Code) REFERENCES Package_Type(Package_Type_Code)
);