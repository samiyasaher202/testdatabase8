CREATE TABLE Customer(

-- primary key
Customer_ID int auto_increment primary key,

-- Name attributes
First_Name varchar(30) not null,
Middle_Name varchar(30) null,
Last_Name varchar(30) not null,

-- Address attributes
Apt_Number varchar(10) null,
House_Number varchar(10) not null,
Street varchar(100) not null,
City varchar(100) not null,
State varchar(50) not null,
Zip_First3 char(3) not null,
Zip_Last2 char(2) not null,
Zip_Plus4 char(4) null,
Country varchar (50) not null default 'USA',

-- The Rest
Password_Hash varchar(255) not null,
Email_Address varchar(255) not null unique,
Phone_Number varchar(20) null
);

create table Employee(

-- primary key
Employee_ID int auto_increment primary key,

-- foreign key
Post_Office_ID int not null,
Supervisor_ID int null,
role_ID int not null,
Department_ID int not null,

-- name attributes
First_Name varchar(30) not null,
Middle_Name varchar(30) not null,
Last_Name varchar(30) not null,

-- birthday attributes
Birth_Day tinyint not null check (Birth_Day between 1 and 31),
Birth_Month tinyint not null check (Birth_Month between 1 and 12),
Birth_Year year not null,

-- other attributes
Sex char(1) not null,
Salary decimal(10,2) not null,
Hours_Worked decimal(6,2) not null default 0.00,

foreign key (Post_Office_ID) references Post_Office(Post_Office_ID),
foreign key (Supervisor_ID) references Employee(Employee_ID),
foreign key (Role_ID) references Role(Role_ID),
foreign key (Department_ID) references Department(Department_ID)
);

create table Package(

-- primary key
Tracking_Number varchar(10) primary key,

-- foreign key
Sender_ID int not null,
Recipient_ID int null,

-- Dimension attributes
Dim_X decimal(8,2) not null,
Dim_Y decimal(8,2) not null,
Dim_Z decimal(8,2) not null,
Date_Created datetime not null default current_timestamp,
Date_Updated datetime null,

-- Other Attributes
Package_Type_Code tinyint not null,
Weight decimal(6,2) not null check (Weight <= 70),
Zone tinyint not null check (Zone between 1 and 9),
Oversize boolean not null default 0,
Requires_Signature boolean not null default 0,
Price decimal(8,2) not null default 0.00,
Created_At datetime not null default current_timestamp,

foreign key (Sender_ID) references Customer(Customer_ID),
foreign key (Recipient_ID) references customer(Customer_ID),
foreign key (Package_Type_Code) references Package_Type(Package_Type_Code)
);

create table Shipment(

-- primary key
Shipment_ID int auto_increment primary key,

-- foreign key
Status_Code int not null,
Employee_ID int not null,

-- from address attributes
From_Apt_Number varchar(10) null,
From_House_Number varchar(10) not null,
From_Street varchar(100) not null,
From_City varchar(100) not null,
From_State varchar(50) not null,
From_Zip_First3 char(3) not null,
From_Zip_Last2 char(2) not null,
From_Zip_Plus4 char(4) null,
From_Country varchar (50) not null default 'USA',

-- to address attributes
To_Apt_Number varchar(10) null,
To_House_Number varchar(10) not null,
To_Street varchar(100) not null,
To_City varchar(100) not null,
To_State varchar(50) not null,
To_Zip_First3 char(3) not null,
To_Zip_Last2 char(2) not null,
To_Zip_Plus4 char(4) null,
To_Country varchar (50) not null default 'USA',

-- other attributes
Departure_Time_Stamp datetime null,
Arrival_Time_Stamp datetime null,


foreign key (Status_Code) references Status_Code(Status_Code),
foreign key (Employee_ID) references Employee(Employee_ID)
);

create table Package_Excess_Fee(
Tracking_Number varchar(10) not null,
Fee_Type_Code tinyint not null,

-- primary key
primary key(Tracking_Number, Fee_Type_Code),

foreign key (Tracking_Number) references Package(Tracking_Number),
foreign key (Fee_Type_Code) references Excess_Fee_Type(Fee_Type_Code)
);

create table Shipment_Package(

-- linking attributes
Shipment_ID int not null,
Tracking_Number varchar(10) not null,

-- primary key
Primary key (Shipment_ID, Tracking_Number),

foreign key (Shipment_ID) references Shipment(Shipment_ID),
foreign key (Tracking_Number) references Package(Tracking_Number)
);

