ALTER TABLE package_excess_fee MODIFY Fee_Type_Code VARCHAR(50) NOT NULL;
ALTER TABLE package_excess_fee ADD FOREIGN KEY (Fee_Type_Code) REFERENCES excess_fee(Fee_Type_Code);
