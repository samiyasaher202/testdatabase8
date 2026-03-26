const express = require('express')
const cors    = require('cors')
const mysql   = require('mysql2/promise')
const bcrypt  = require('bcryptjs')
const jwt     = require('jsonwebtoken')
require('dotenv').config()

const packagesDB  = require('./db/packages')
const inventoryDB = require('./db/inventory')

const app = express()
app.use(cors())
app.use(express.json())

// ── DB pool ───────────────────────────────────────────────────────────────
const pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  port:               process.env.DB_PORT     || 3306,
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || '',
  database:           process.env.DB_NAME     || 'post_office_8',
  waitForConnections: true,
  connectionLimit:    10,
})

pool.getConnection()
  .then(c => { console.log('✅ MySQL connected'); c.release() })
  .catch(e => console.error('❌ MySQL connection failed:', e.message))

// ── Auth middleware ───────────────────────────────────────────────────────
const authenticate = (req, res, next) => {
  const token = (req.headers['authorization'] || '').split(' ')[1]
  if (!token) return res.status(401).json({ message: 'No token provided' })
  jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, decoded) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' })
    req.user = decoded
    next()
  })
}

// ════════════════════════════════════════════════════════════════════════════
//  AUTH ROUTES
// ════════════════════════════════════════════════════════════════════════════

// Employee Login (EXISTING)
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password)
    return res.status(400).json({ message: 'Email and password required' })

  try {
    const [rows] = await pool.query(
      `SELECT e.*, r.Role_Name, d.Department_Name
       FROM Employee e
       JOIN Role r       ON e.Role_ID       = r.Role_ID
       JOIN Department d ON e.Department_ID = d.Department_ID
       WHERE e.Email_Address = ?`,
      [email]
    )
    if (!rows.length)
      return res.status(401).json({ message: 'Invalid credentials' })

    const emp = rows[0]
    const valid = await bcrypt.compare(password, emp.Password_Hash)
    if (!valid)
      return res.status(401).json({ message: 'Invalid credentials' })

    const token = jwt.sign(
      { employee_id: emp.Employee_ID, email: emp.Email_Address, type: 'employee' },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    )

    const { Password_Hash, ...safe } = emp
    res.json({ message: 'Login successful', token, user: safe })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

// Customer Login (NEW)
app.post('/api/auth/customer-login', async (req, res) => {
  const { customerId, password } = req.body
  if (!customerId || !password)
    return res.status(400).json({ message: 'Customer ID and password required' })

  try {
    const [rows] = await pool.query(
      `SELECT * FROM Customer WHERE Customer_ID = ?`,
      [customerId]
    )
    if (!rows.length)
      return res.status(401).json({ message: 'Invalid credentials' })

    const customer = rows[0]
    const valid = await bcrypt.compare(password, customer.Password_Hash)
    if (!valid)
      return res.status(401).json({ message: 'Invalid credentials' })

    const token = jwt.sign(
      { customer_id: customer.Customer_ID, type: 'customer' },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    )

    const { Password_Hash, ...safe } = customer
    res.json({ message: 'Login successful', token, user: safe })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

// Register (EXISTING)
app.post('/api/auth/register', async (req, res) => {
  const { first_name, middle_name = '', last_name, email, password,
          post_office_id, role_id, department_id,
          birth_day, birth_month, birth_year, sex, salary } = req.body

  if (!first_name || !last_name || !email || !password)
    return res.status(400).json({ message: 'Missing required fields' })

  try {
    const [exists] = await pool.query(
      'SELECT Employee_ID FROM Employee WHERE Email_Address = ?', [email]
    )
    if (exists.length)
      return res.status(400).json({ message: 'Email already registered' })

    const hash = await bcrypt.hash(password, 10)
    const [result] = await pool.query(
      `INSERT INTO Employee
         (Post_Office_ID, Role_ID, Department_ID, First_Name, Middle_Name, Last_Name,
          Birth_Day, Birth_Month, Birth_Year, Password_Hash, Email_Address,
          Phone_Number, Sex, Salary, Hours_Worked)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,0)`,
      [post_office_id || 1, role_id || 1, department_id || 1,
       first_name, middle_name, last_name,
       birth_day || 1, birth_month || 1, birth_year || 2000,
       hash, email, null, sex || 'M', salary || 0]
    )

    const token = jwt.sign(
      { employee_id: result.insertId, email, type: 'employee' },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    )
    res.status(201).json({ message: 'Registered successfully', token, employee_id: result.insertId })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

// Get profile (EXISTING)
app.get('/api/auth/profile', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT e.Employee_ID, e.First_Name, e.Middle_Name, e.Last_Name,
              e.Email_Address, e.Phone_Number, e.Salary, e.Hours_Worked,
              r.Role_Name, d.Department_Name, po.City AS Office_City
       FROM Employee e
       JOIN Role r         ON e.Role_ID        = r.Role_ID
       JOIN Department d   ON e.Department_ID  = d.Department_ID
       JOIN Post_Office po ON e.Post_Office_ID = po.Post_Office_ID
       WHERE e.Employee_ID = ?`,
      [req.user.employee_id]
    )
    if (!rows.length)
      return res.status(404).json({ message: 'Employee not found' })
    res.json({ user: rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

// ════════════════════════════════════════════════════════════════════════════
//  PACKAGES ROUTES
// ══════════════════════════════════════════��═════════════════════════════════

app.get('/api/packages', async (req, res) => {
  packagesDB.getAllPackages(pool, (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' })
    res.json(results)
  })
})

// ══════════════════════════════════════════════════════════════════════════
//  INVENTORY ROUTES
// ════════════════════════════════════════════════════════════════════════════

app.get('/api/inventory', async (req, res) => {
  inventoryDB.getAllInventory(pool, (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' })
    res.json(results)
  })
})

// ── Start ─────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`))
