-- Links each payment to the employee who processed it (e.g. add-package flow).
-- mysql -u root -p your_database < backend/db/migrations/004_add_payment_employee_id.sql

ALTER TABLE payment
  ADD COLUMN Employee_ID INT NULL;

ALTER TABLE payment
  ADD CONSTRAINT fk_payment_employee
  FOREIGN KEY (Employee_ID) REFERENCES employee(Employee_ID);

-- Optional: set a placeholder for existing rows before making NOT NULL:
-- UPDATE payment SET Employee_ID = 1 WHERE Employee_ID IS NULL;
-- ALTER TABLE payment MODIFY COLUMN Employee_ID INT NOT NULL;
