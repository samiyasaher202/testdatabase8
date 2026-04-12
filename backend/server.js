const path = require('path')
const http = require('http')
const mysql = require('mysql2/promise')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
require('dotenv').config({ path: path.join(__dirname, '.env') })

const packagesDB    = require('./db/packages')
const inventoryDB   = require('./db/inventory')
const customerDB    = require('./db/customers')
const packageTrackDB = require('./db/package_track')
const employeeDB    = require('./db/employees')
const priceDB       = require('./db/package_type')
const packagePickupStorageJob = require('./db/package_pickup_storage_job')

// ── DB pool ───────────────────────────────────────────────────────────────
const pool = mysql.createPool({
  host:               process.env.MYSQLHOST||'localhost',
  port:               process.env.MYSQLPORT||'3306',
  user:               process.env.MYSQLUSER||'root',
  password:           process.env.MYSQLPASSWORD||'MBobanza#2205',
  database:           process.env.MYSQL_DATABASE||'post_officedb',
  waitForConnections: true,
  connectionLimit:    10,
})

pool.getConnection()
  .then(c => { console.log('✅ MySQL connected'); c.release() })
  .catch(e => console.error('❌ MySQL connection failed:', e))

if (process.env.DISABLE_PACKAGE_PICKUP_JOB !== '1' && process.env.DISABLE_PACKAGE_PICKUP_JOB !== 'true') {
  const jobMs = Number(process.env.PACKAGE_PICKUP_JOB_MS)
  const runOnStartEnv = process.env.PACKAGE_PICKUP_JOB_RUN_ON_START
  packagePickupStorageJob.startPackagePickupStorageJob(pool, {
    intervalMs: Number.isFinite(jobMs) && jobMs > 0 ? jobMs : undefined,
    // Default: run once at startup so 30-day disposal applies without waiting for the first 24h tick.
    runOnStart: runOnStartEnv !== '0' && runOnStartEnv !== 'false',
  })
}

// ── Helpers ───────────────────────────────────────────────────────────────

function parseCookies(req) {
  const list = {}
  const rc = req.headers.cookie
  if (rc) rc.split(';').forEach(cookie => {
    const parts = cookie.split('=')
    list[parts[0].trim()] = decodeURIComponent((parts[1] || '').trim())
  })
  return list
}

function getBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', chunk => { data += chunk })
    req.on('end', () => {
      if (!data) return resolve({})
      try { resolve(JSON.parse(data)) } catch { resolve({}) }
    })
    req.on('error', reject)
  })
}

function send(res, status, body) {
  const json = JSON.stringify(body)
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(json),
  })
  res.end(json)
}

function setCORSHeaders(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

// Match a URL path against a pattern like '/api/packages/:id/tracking'
// Returns { matched: true, params: { id: '...' } } or { matched: false }
function matchPath(pattern, urlPath) {
  const patternParts = pattern.split('/')
  const urlParts = urlPath.split('/')
  if (patternParts.length !== urlParts.length) return { matched: false }
  const params = {}
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      params[patternParts[i].slice(1)] = decodeURIComponent(urlParts[i])
    } else if (patternParts[i] !== urlParts[i]) {
      return { matched: false }
    }
  }
  return { matched: true, params }
}

function getQueryParams(urlString) {
  const u = new URL(urlString, 'http://localhost')
  const params = {}
  u.searchParams.forEach((v, k) => { params[k] = v })
  return params
}

// ── Auth helpers ──────────────────────────────────────────────────────────

function authenticate(req, res) {
  const token = (req.headers['authorization'] || '').split(' ')[1]
  if (!token) { send(res, 401, { message: 'No token provided' }); return null }
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'secret')
  } catch {
    send(res, 403, { message: 'Invalid or expired token' }); return null
  }
}

function requireEmployee(user, res) {
  if (user?.type !== 'employee' || user?.employee_id == null) {
    send(res, 403, { message: 'Employee access required' }); return false
  }
  return true
}

function requireAdmin(user, res) {
  if (![4, 5].includes(user?.role_id)) {
    send(res, 403, { message: 'Access denied. Manager/Admin role required.' }); return false
  }
  return true
}

function requireRole5Admin(user, res) {
  const roleId = Number(user?.role_id)
  if (user?.type !== 'employee' || !Number.isFinite(roleId) || roleId !== 5) {
    send(res, 403, { message: 'Access denied. Admin role required.' }); return false
  }
  return true
}

// ── Business logic helpers ────────────────────────────────────────────────

function normalizePackageTypeName(raw) {
  const t = String(raw || '').toLowerCase().trim()
  if (t === 'oversized') return 'oversize'
  if (t === 'express') return 'express'
  if (t === 'general shipping') return 'general shipping'
  if (t === 'oversize') return 'oversize'
  return String(raw || '').trim()
}

const TYPE_NAME_TO_CODE = {
  express: 'EXP',
  'general shipping': 'GEN',
  oversize: 'OVR',
}

function toMysqlDateTime(value) {
  if (value == null || value === '') return null
  const s = String(value).trim().replace('T', ' ')
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(s)) return `${s}:00`
  return s
}

/** mysql2 Date or string → 'YYYY-MM-DD HH:MM:SS' for SQL parameters. */
function dateToMysqlDateTime(value) {
  if (value == null) return null
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const pad = (n) => String(n).padStart(2, '0')
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())} ${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`
  }
  return toMysqlDateTime(value)
}

/** Form value wins if present; otherwise use shipment.Arrival_Time_Stamp (set when status → At Office). */
function resolveArrivalForPickup(shipmentArrivalStamp, bodyArrivalTime) {
  return toMysqlDateTime(bodyArrivalTime) || dateToMysqlDateTime(shipmentArrivalStamp) || null
}

function isAtOfficeStatusName(name) {
  const raw = String(name || '').trim().toLowerCase()
  const spaced = raw.replace(/_/g, ' ').replace(/-/g, ' ').replace(/\s+/g, ' ').trim()
  const underscored = spaced.replace(/\s+/g, '_')
  return spaced === 'at office' || underscored === 'at_office'
}

function getPricePromise(pool, excessFeeTypeName, packageTypeName, weight, zone) {
  return new Promise((resolve, reject) => {
    const w = Number(weight)
    const z = Number(zone)
    priceDB.getPrice(pool, excessFeeTypeName || null, packageTypeName, w, z, (err, results) => {
      if (err) return reject(err)
      if (!results?.length) {
        const e = new Error('No matching price for weight, zone, and package type')
        e.status = 400
        return reject(e)
      }
      resolve(Number(results[0].Tot_Price))
    })
  })
}

async function nextTrackingNumber(conn) {
  const [rows] = await conn.query(
    `SELECT Tracking_Number FROM package WHERE Tracking_Number LIKE 'TRK%' ORDER BY Tracking_Number DESC LIMIT 1`
  )
  let n = 1
  if (rows.length) {
    const m = /^TRK(\d+)$/i.exec(rows[0].Tracking_Number)
    if (m) n = parseInt(m[1], 10) + 1
  }
  return `TRK${String(n).padStart(7, '0')}`.slice(0, 10)
}

// ── Router ────────────────────────────────────────────────────────────────

async function router(req, res) {
  setCORSHeaders(req, res)

  // Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  const urlObj = new URL(req.url, 'http://localhost')
  const pathname = urlObj.pathname
  const method = req.method
  const query = getQueryParams(req.url)

  // ── GET /api/health ──────────────────────────────────────────────────────
  if (method === 'GET' && pathname === '/api/health') {
    return send(res, 200, { ok: true, service: 'postoffice-api', has_price: true })
  }

  // ── POST /api/auth/login ─────────────────────────────────────────────────
  if (method === 'POST' && pathname === '/api/auth/login') {
    const { email, password } = await getBody(req)
    if (!email || !password) return send(res, 400, { message: 'Email and password required' })
    try {
      const [rows] = await pool.query(
        `SELECT e.*, r.Role_Name, d.Department_Name
         FROM employee e
         JOIN role r       ON e.Role_ID       = r.Role_ID
         JOIN department d ON e.Department_ID = d.Department_ID
         WHERE e.Email_Address = ?`,
        [email]
      )
      if (!rows.length) return send(res, 401, { message: 'Invalid credentials' })
      const emp = rows[0]
      const valid = await bcrypt.compare(password, emp.Password_Hash)
      if (!valid) return send(res, 401, { message: 'Invalid credentials' })
      const token = jwt.sign(
        { employee_id: Number(emp.Employee_ID), email: emp.Email_Address, role_id: Number(emp.Role_ID), type: 'employee' },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '24h' }
      )
      const { Password_Hash, ...safe } = emp
      return send(res, 200, { message: 'Login successful', token, user: safe })
    } catch (err) {
      console.error(err)
      return send(res, 500, { message: 'Server error' })
    }
  }

  // ── POST /api/auth/customer-login ────────────────────────────────────────
  if (method === 'POST' && pathname === '/api/auth/customer-login') {
    console.log('got to api/auth/customer-login')
    const { email, password } = await getBody(req)
    if (!email || !password) return send(res, 400, { message: 'Email and password required' })
    try {
      const [rows] = await pool.query('SELECT * FROM customer WHERE Email_Address = ?', [email])
      if (!rows.length) return send(res, 401, { message: 'Invalid credentials' })
      const customer = rows[0]
      const valid = await bcrypt.compare(password, customer.Password_Hash)
      if (!valid) return send(res, 401, { message: 'Invalid credentials' })
      const token = jwt.sign(
        { customer_id: customer.Customer_ID, email: customer.Email_Address, type: 'customer' },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '24h' }
      )
      const { Password_Hash, ...safe } = customer
      return send(res, 200, { message: 'Login successful', token, user: safe })
    } catch (err) {
      console.error(err)
      return send(res, 500, { message: 'Server error' })
    }
  }

  // ── POST /api/customer/register ──────────────────────────────────────────
  if (method === 'POST' && pathname === '/api/customer/register') {
    const body = await getBody(req)
    try {
      const { customer_id, user } = await customerDB.registerCustomer(pool, body)
      const token = jwt.sign(
        { customer_id, email: user.Email_Address, type: 'customer' },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '24h' }
      )
      return send(res, 201, { message: 'Customer registered successfully', token, user })
    } catch (err) {
      if (err.status === 400 || err.code === 'VALIDATION' || err.code === 'DUPLICATE_EMAIL') {
        return send(res, err.status || 400, { message: err.message })
      }
      if (err.code === 'ER_DUP_ENTRY') return send(res, 400, { message: 'Email already registered' })
      console.error(err)
      return send(res, 500, { message: err.message || 'Server error' })
    }
  }

  // ── POST /api/auth/admin-register ────────────────────────────────────────
  if (method === 'POST' && pathname === '/api/auth/admin-register') {
    const user = authenticate(req, res); if (!user) return
    if (!requireAdmin(user, res)) return
    const { name, email, department, position, phoneNumber, workAddress, hireDate } = await getBody(req)
    if (!name || !email || !department || !position || !phoneNumber || !workAddress || !hireDate) {
      return send(res, 400, { message: 'Missing required fields' })
    }
    try {
      const [exists] = await pool.query('SELECT Employee_ID FROM employee WHERE Email_Address = ?', [email])
      if (exists.length) return send(res, 400, { message: 'Email already registered' })
      const tempPassword = Math.random().toString(36).slice(-10) + 'Temp1!'
      const hash = await bcrypt.hash(tempPassword, 10)
      const departmentMap = { 'Mail Sorting': 1, 'Customer Service': 2, 'Delivery': 3, 'Management': 4, 'Finance': 5, 'IT Support': 6 }
      const positionMap = { 'Clerk': 1, 'Supervisor': 2, 'Manager': 3, 'Director': 4, 'Staff': 5 }
      const department_id = departmentMap[department] || 1
      const role_id = positionMap[position] || 1
      const [firstName, ...lastNameParts] = name.split(' ')
      const lastName = lastNameParts.join(' ') || 'Employee'
      const [result] = await pool.query(
        `INSERT INTO employee (Post_Office_ID, Role_ID, Department_ID, First_Name, Last_Name, Password_Hash, Email_Address, Phone_Number, Sex, Salary, Hours_Worked)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        [1, role_id, department_id, firstName, lastName, hash, email, phoneNumber, 'M', 0, 0]
      )
      console.log(`[TODO] Send email to ${email} with temporary password: ${tempPassword}`)
      return send(res, 201, { message: 'Employee registered successfully', employee_id: result.insertId, email, note: 'Temporary password sent to employee email' })
    } catch (err) {
      console.error(err)
      return send(res, 500, { message: 'Server error', error: err.message })
    }
  }

  // ── GET /api/admin/employees ─────────────────────────────────────────────
  if (method === 'GET' && pathname === '/api/admin/employees') {
    const user = authenticate(req, res); if (!user) return
    if (!requireRole5Admin(user, res)) return
    try {
      const [rows] = await pool.query(
        `SELECT e.Employee_ID, po.Street AS Post_Office_Street, d.Department_Name, r.Role_Name,
                e.First_Name, e.Last_Name, e.Email_Address, e.Sex, e.Phone_Number, e.Is_Active
         FROM employee e
         JOIN post_office po ON e.Post_Office_ID = po.Post_Office_ID
         JOIN department d   ON e.Department_ID  = d.Department_ID
         JOIN role r         ON e.Role_ID        = r.Role_ID
         WHERE e.Is_Active IN ('1', 1)
         ORDER BY e.Last_Name, e.First_Name, e.Employee_ID`
      )
      return send(res, 200, { employees: rows })
    } catch (err) {
      console.error(err)
      return send(res, 500, { message: err.sqlMessage || err.message || 'Server error' })
    }
  }

  // ── PATCH /api/admin/employees/:employeeId/deactivate ────────────────────
  {
    const m = matchPath('/api/admin/employees/:employeeId/deactivate', pathname)
    if (method === 'PATCH' && m.matched) {
      const user = authenticate(req, res); if (!user) return
      if (!requireRole5Admin(user, res)) return
      const employeeId = Number(m.params.employeeId)
      if (!Number.isFinite(employeeId)) return send(res, 400, { message: 'Invalid employee id' })
      try {
        const [result] = await pool.query("UPDATE employee SET Is_Active = '0' WHERE Employee_ID = ?", [employeeId])
        if (!result.affectedRows) return send(res, 404, { message: 'Employee not found' })
        return send(res, 200, { ok: true })
      } catch (err) {
        console.error(err)
        return send(res, 500, { message: err.sqlMessage || err.message || 'Server error' })
      }
    }
  }

  // ── GET /api/auth/profile ────────────────────────────────────────────────
  if (method === 'GET' && pathname === '/api/auth/profile') {
    const user = authenticate(req, res); if (!user) return
    try {
      const [rows] = await pool.query(
        `SELECT e.Employee_ID, e.First_Name, e.Middle_Name, e.Last_Name,
                e.Email_Address, e.Phone_Number, e.Salary, e.Hours_Worked, e.Supervisor_ID,
                CONCAT(s.First_Name, ' ', s.Last_Name) AS Supervisor,
                r.Role_Name, d.Department_Name,
                po.City AS Office_City, po.State AS Office_State
         FROM employee e
         JOIN role r         ON e.Role_ID        = r.Role_ID
         JOIN department d   ON e.Department_ID  = d.Department_ID
         JOIN post_office po ON e.Post_Office_ID = po.Post_Office_ID
         LEFT JOIN employee s ON e.Supervisor_ID = s.Employee_ID
         WHERE e.Employee_ID = ?`,
        [user.employee_id]
      )
      if (!rows.length) return send(res, 404, { message: 'Employee not found' })
      return send(res, 200, { user: rows[0] })
    } catch (err) {
      console.error(err)
      return send(res, 500, { message: 'Server error' })
    }
  }

  // ── PUT /api/auth/profile ────────────────────────────────────────────────
  if (method === 'PUT' && pathname === '/api/auth/profile') {
    const user = authenticate(req, res); if (!user) return
    const { Email_Address, Phone_Number } = await getBody(req)
    try {
      await pool.query(
        'UPDATE employee SET Phone_Number = ?, Email_Address = ? WHERE Employee_ID = ?',
        [Phone_Number, Email_Address, user.employee_id]
      )
      const [rows] = await pool.query(
        `SELECT e.Employee_ID, e.First_Name, e.Middle_Name, e.Last_Name,
                e.Email_Address, e.Phone_Number, e.Salary, e.Hours_Worked, e.Supervisor_ID,
                CONCAT(s.First_Name, ' ', s.Last_Name) AS Supervisor,
                r.Role_Name, d.Department_Name,
                po.City AS Office_City, po.State AS Office_State
         FROM employee e
         JOIN role r         ON e.Role_ID        = r.Role_ID
         JOIN department d   ON e.Department_ID  = d.Department_ID
         JOIN post_office po ON e.Post_Office_ID = po.Post_Office_ID
         LEFT JOIN employee s ON e.Supervisor_ID = s.Employee_ID
         WHERE e.Employee_ID = ?`,
        [user.employee_id]
      )
      return send(res, 200, { message: 'Profile updated successfully', user: rows[0] })
    } catch (err) {
      console.error(err)
      return send(res, 500, { message: 'Server error' })
    }
  }

  // ── POST /api/auth/change-password ───────────────────────────────────────
  if (method === 'POST' && pathname === '/api/auth/change-password') {
    const user = authenticate(req, res); if (!user) return
    const { currentPassword, newPassword } = await getBody(req)
    if (!currentPassword || !newPassword) return send(res, 400, { message: 'Both passwords are required' })
    if (newPassword.length < 6) return send(res, 400, { message: 'New password must be at least 6 characters' })
    try {
      const [rows] = await pool.query('SELECT Password_Hash FROM employee WHERE Employee_ID = ?', [user.employee_id])
      if (!rows.length) return send(res, 404, { message: 'Employee not found' })
      const valid = await bcrypt.compare(currentPassword, rows[0].Password_Hash)
      if (!valid) return send(res, 401, { message: 'Current password is incorrect' })
      const newHash = await bcrypt.hash(newPassword, 10)
      await pool.query('UPDATE employee SET Password_Hash = ? WHERE Employee_ID = ?', [newHash, user.employee_id])
      return send(res, 200, { message: 'Password changed successfully' })
    } catch (err) {
      console.error(err)
      return send(res, 500, { message: 'Server error' })
    }
  }

  // ── GET /api/customer/profile ────────────────────────────────────────────
  if (method === 'GET' && pathname === '/api/customer/profile') {
    const user = authenticate(req, res); if (!user) return
    try {
      const [rows] = await pool.query(
        `SELECT Customer_ID, First_Name, Last_Name, Email_Address,
                Phone_Number, House_Number, Street, City, State,
                Zip_First3, Zip_Last2
         FROM customer WHERE Customer_ID = ?`,
        [user.customer_id]
      )
      if (!rows.length) return send(res, 404, { message: 'Customer not found' })
      return send(res, 200, { user: rows[0] })
    } catch (err) {
      console.error(err)
      return send(res, 500, { message: 'Server error' })
    }
  }

  // ── PUT /api/customer/profile ────────────────────────────────────────────
  if (method === 'PUT' && pathname === '/api/customer/profile') {
    const user = authenticate(req, res); if (!user) return
    const { Email_Address, Phone_Number, House_Number, Street, City, State, Zip_First3, Zip_Last2 } = await getBody(req)
    try {
      await pool.query(
        `UPDATE customer SET Email_Address=?, Phone_Number=?, House_Number=?, Street=?, City=?, State=?, Zip_First3=?, Zip_Last2=? WHERE Customer_ID=?`,
        [Email_Address, Phone_Number, House_Number, Street, City, State, Zip_First3, Zip_Last2, user.customer_id]
      )
      const [rows] = await pool.query(
        `SELECT Customer_ID, First_Name, Last_Name, Email_Address,
                Phone_Number, House_Number, Street, City, State,
                Zip_First3, Zip_Last2
         FROM customer WHERE Customer_ID = ?`,
        [user.customer_id]
      )
      return send(res, 200, { message: 'Profile updated successfully', user: rows[0] })
    } catch (err) {
      console.error(err)
      return send(res, 500, { message: 'Server error' })
    }
  }

  // ── GET /api/packages ────────────────────────────────────────────────────
  if (method === 'GET' && pathname === '/api/packages') {
    packagesDB.getAllPackages(pool, (err, results) => {
      if (err) return send(res, 500, { error: 'Database error' })
      send(res, 200, results)
    })
    return
  }

  // ── GET /api/packages/track/:trackingNumber ──────────────────────────────
  {
    const m = matchPath('/api/packages/track/:trackingNumber', pathname)
    if (method === 'GET' && m.matched) {
      const trackingNumber = m.params.trackingNumber.trim()
      if (!trackingNumber) return send(res, 400, { error: 'trackingNumber is required' })
      packagesDB.getPackageByTracking(pool, trackingNumber, (err, result) => {
        if (err) return send(res, 500, { error: 'Database error' })
        if (!result) return send(res, 404, { error: 'Package not found' })
        send(res, 200, result)
      })
      return
    }
  }

  // ── GET /qry_track_package ───────────────────────────────────────────────
  if (method === 'GET' && pathname === '/qry_track_package') {
    const trackingNumber = (query.tracking_number || query.trackingNumber || '').trim()
    if (!trackingNumber) return send(res, 400, { error: 'tracking_number query parameter is required' })
    packagesDB.getPackageByTracking(pool, trackingNumber, (err, result) => {
      if (err) return send(res, 500, { error: 'Database error' })
      if (!result) return send(res, 404, { error: 'Package not found' })
      send(res, 200, result)
    })
    return
  }

  // ── GET /api/price ───────────────────────────────────────────────────────
  if (method === 'GET' && pathname === '/api/price') {
    const { package_type, weight, zone, excess_fee, dim_x, dim_y, dim_z } = query
    const pt = normalizePackageTypeName(package_type)
    if (!pt || weight === undefined || weight === '' || zone === undefined || zone === '') {
      return send(res, 400, { error: 'package_type, weight, and zone are required' })
    }
    const w = Number(weight)
    const z = Number(zone)
    if (!Number.isFinite(w) || w <= 0 || w > 70) return send(res, 400, { error: 'Weight must be greater than 0 and at most 70 lbs' })
    if (!Number.isInteger(z) || z < 1 || z > 9) return send(res, 400, { error: 'Zone must be a whole number from 1 to 9' })
    try {
      const tot = await new Promise((resolve, reject) => {
        priceDB.getPrice(pool, excess_fee || null, pt, weight, zone, (err, results) => {
          if (err) return reject(err)
          if (!results?.length) {
            const e = new Error('No matching price for this weight, zone, and package type combination')
            e.status = 400
            return reject(e)
          }
          resolve(Number(results[0].Tot_Price))
        }, dim_x, dim_y, dim_z)
      })
      return send(res, 200, { Tot_Price: tot })
    } catch (err) {
      if (err.status === 400) return send(res, 400, { error: err.message })
      console.error(err)
      return send(res, 500, { error: err.message || 'Could not calculate price' })
    }
  }

  // ── GET /api/customer/my-packages ────────────────────────────────────────
  if (method === 'GET' && pathname === '/api/customer/my-packages') {
    const user = authenticate(req, res); if (!user) return
    if (user?.type !== 'customer' || user.customer_id == null) {
      return send(res, 403, { message: 'Customer access required' })
    }
    try {
      await packagePickupStorageJob.runNodeDisposalSweep(pool)
    } catch (e) {
      console.error('[my-packages] disposal sweep:', e.message || e)
    }
    packagesDB.getPackagesForCustomer(pool, user.customer_id, (err, results) => {
      if (err) { console.error(err); return send(res, 500, { error: 'Database error' }) }
      send(res, 200, results)
    })
    return
  }

  // ── POST /api/employee/packages ──────────────────────────────────────────
  if (method === 'POST' && pathname === '/api/employee/packages') {
    console.log('in api/employee/packages')
    const user = authenticate(req, res); if (!user) return
    if (!requireEmployee(user, res)) return
    const b = await getBody(req)
    const {
      sender_email, sender_first_name, sender_last_name,
      sender_house_number, sender_street, sender_city, sender_state, sender_zip_first3, sender_zip_last2,
      sender_apt_number, sender_country, sender_phone,
      recipient_email, recipient_first_name, recipient_last_name,
      recipient_house_number, recipient_street, recipient_city, recipient_state, recipient_zip_first3, recipient_zip_last2,
      recipient_apt_number, recipient_country, recipient_phone,
      package_type, weight, zone, excess_fee, dim_x, dim_y, dim_z,
    } = b

    const pt = normalizePackageTypeName(package_type)
    const typeCode = TYPE_NAME_TO_CODE[pt]
    if (!typeCode) return send(res, 400, { message: 'Invalid package_type' })

    const w = Number(weight)
    const z = Number(zone)
    if (Number.isNaN(w) || Number.isNaN(z)) return send(res, 400, { message: 'weight and zone must be numbers' })

    const dx = dim_x != null && dim_x !== '' ? Number(dim_x) : 12
    const dy = dim_y != null && dim_y !== '' ? Number(dim_y) : 10
    const dz = dim_z != null && dim_z !== '' ? Number(dim_z) : 8
    if (!(dx > 0 && dy > 0 && dz > 0)) return send(res, 400, { message: 'Dimensions must be positive numbers' })

    const excessName = excess_fee && String(excess_fee).trim() ? String(excess_fee).trim() : null
    const sigRequired = excessName === 'Signature Required'

    let priceAmount
    try {
      priceAmount = await getPricePromise(pool, excessName, pt, w, z)
    } catch (err) {
      return send(res, err.status === 400 ? 400 : 500, { message: err.message || 'Pricing failed' })
    }

    const senderEmail = (sender_email || '').trim().toLowerCase()
    if (!senderEmail || !sender_first_name?.trim() || !sender_last_name?.trim()) {
      return send(res, 400, { message: 'Sender email, first name, and last name are required' })
    }
    if (!sender_house_number || !sender_street || !sender_city || !sender_state || !sender_zip_first3 || !sender_zip_last2) {
      return send(res, 400, { message: 'Sender address fields are required' })
    }

    let recipientEmail = (recipient_email || '').trim().toLowerCase()
    if (!recipient_first_name?.trim() || !recipient_last_name?.trim()) {
      return send(res, 400, { message: 'Recipient first and last name are required' })
    }
    if (!recipient_house_number || !recipient_street || !recipient_city || !recipient_state || !recipient_zip_first3 || !recipient_zip_last2) {
      return send(res, 400, { message: 'Recipient address fields are required' })
    }
    if (!recipientEmail) {
      recipientEmail = `recipient.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@pkg.internal`
    }
    if (recipientEmail === senderEmail) return send(res, 400, { message: 'Sender and recipient must be different people (different emails)' })

    const conn = await pool.getConnection()
    try {
      await conn.beginTransaction()

      let senderInitialPassword = null
      let recipientInitialPassword = null

      let senderId = (await customerDB.getCustomerByEmail(conn, senderEmail))?.Customer_ID
      if (!senderId) {
        const created = await customerDB.createCustomerMinimal(conn, {
          first_name: sender_first_name, last_name: sender_last_name, email: senderEmail,
          house_number: sender_house_number, street: sender_street, city: sender_city, state: sender_state,
          zip_first3: sender_zip_first3, zip_last2: sender_zip_last2, apt_number: sender_apt_number,
          zip_plus4: b.sender_zip_plus4, country: sender_country, phone_number: sender_phone,
        })
        senderId = created.customerId
        senderInitialPassword = created.initialPassword
      }

      let recipientId = (await customerDB.getCustomerByEmail(conn, recipientEmail))?.Customer_ID
      if (!recipientId) {
        const created = await customerDB.createCustomerMinimal(conn, {
          first_name: recipient_first_name, last_name: recipient_last_name, email: recipientEmail,
          house_number: recipient_house_number, street: recipient_street, city: recipient_city, state: recipient_state,
          zip_first3: recipient_zip_first3, zip_last2: recipient_zip_last2, apt_number: recipient_apt_number,
          zip_plus4: b.recipient_zip_plus4, country: recipient_country, phone_number: recipient_phone,
        })
        recipientId = created.customerId
        recipientInitialPassword = created.initialPassword
      }

      if (senderId === recipientId) {
        await conn.rollback()
        return send(res, 400, { message: 'Sender and recipient must be different customers' })
      }

      const tracking = await nextTrackingNumber(conn)
      const oversize = typeCode === 'OVR' ? 1 : 0
      const actingEmployeeId = Number(user.employee_id)
      if (!Number.isFinite(actingEmployeeId)) {
        await conn.rollback()
        return send(res, 401, { message: 'Invalid employee session' })
      }

      const [empRows] = await conn.query(
        `SELECT s.Store_ID FROM employee e
         JOIN post_office p ON e.Post_Office_ID = p.Post_Office_ID
         JOIN store s ON s.Post_Office_ID = p.Post_Office_ID
         WHERE e.Employee_ID = ?`,
        [actingEmployeeId]
      )
      if (!empRows.length) {
        await conn.rollback()
        return send(res, 404, { error: 'Employee or store not found' })
      }
      const sid = empRows[0].Store_ID

      const [payRes] = await conn.query(
        `INSERT INTO payment (Customer_ID, Store_ID, Items, Payment_Type, Payment_Amount, Payment_Status, Employee_ID)
         VALUES (?,?,?,?,?,'completed',?)`,
        [senderId, sid, 1, 1, priceAmount, actingEmployeeId]
      )
      const payId = payRes.insertId
      await conn.query(
        `INSERT INTO package (Tracking_Number, Sender_ID, Recipient_ID, Dim_X, Dim_Y, Dim_Z,
          Package_Type_Code, Weight, Zone, Oversize, Requires_Signature, Price, Payment_ID)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [tracking, senderId, recipientId, dx, dy, dz, typeCode, w, z, oversize, sigRequired ? 1 : 0, priceAmount, payId]
      )

      const [[pending]] = await conn.query(`SELECT Status_Code FROM status_code WHERE Status_Name = 'Pending' LIMIT 1`)
      if (!pending) throw new Error('Missing Pending status in status_code')
      const pendingCode = pending.Status_Code

      await conn.query(
        `INSERT INTO delivery (Tracking_Number, Delivered_Date, Signature_Required, Signature_Received, Delivery_Status_Code, Delivered_By)
         VALUES (?,NULL,?,NULL,?,NULL)`,
        [tracking, sigRequired ? 1 : 0, pendingCode]
      )

      const [shipRes] = await conn.query(
        `INSERT INTO shipment (Status_Code, Employee_ID,
          From_Apt_Number, From_House_Number, From_Street, From_City, From_State, From_Zip_First3, From_Zip_Last2, From_Zip_Plus4, From_Country,
          To_Apt_Number, To_House_Number, To_Street, To_City, To_State, To_Zip_First3, To_Zip_Last2, To_Zip_Plus4, To_Country,
          Departure_Time_Stamp, Arrival_Time_Stamp)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NULL,NULL)`,
        [
          pendingCode, actingEmployeeId,
          sender_apt_number || null, String(sender_house_number).slice(0, 10), String(sender_street).slice(0, 100),
          String(sender_city).slice(0, 100), String(sender_state).slice(0, 50),
          String(sender_zip_first3).replace(/\D/g, '').slice(0, 3), String(sender_zip_last2).replace(/\D/g, '').slice(0, 2),
          b.sender_zip_plus4 ? String(b.sender_zip_plus4).replace(/\D/g, '').slice(0, 4) : null,
          (sender_country || 'USA').toString().slice(0, 50),
          recipient_apt_number || null, String(recipient_house_number).slice(0, 10), String(recipient_street).slice(0, 100),
          String(recipient_city).slice(0, 100), String(recipient_state).slice(0, 50),
          String(recipient_zip_first3).replace(/\D/g, '').slice(0, 3), String(recipient_zip_last2).replace(/\D/g, '').slice(0, 2),
          b.recipient_zip_plus4 ? String(b.recipient_zip_plus4).replace(/\D/g, '').slice(0, 4) : null,
          (recipient_country || 'USA').toString().slice(0, 50),
        ]
      )
      const shipmentId = shipRes.insertId
      await conn.query(`INSERT INTO shipment_package (Shipment_ID, Tracking_Number) VALUES (?,?)`, [shipmentId, tracking])

      await conn.commit()
      const newCustomerCredentials = {}
      if (senderInitialPassword) {
        newCustomerCredentials.sender = { email: senderEmail, initial_password: senderInitialPassword }
      }
      if (recipientInitialPassword) {
        newCustomerCredentials.recipient = { email: recipientEmail, initial_password: recipientInitialPassword }
      }
      return send(res, 201, {
        tracking_number: tracking,
        price: priceAmount,
        sender_id: senderId,
        recipient_id: recipientId,
        ...(Object.keys(newCustomerCredentials).length > 0 && { new_customer_credentials: newCustomerCredentials }),
      })
    } catch (err) {
      await conn.rollback()
      console.error(err)
      if (err.code === 'ER_DUP_ENTRY') return send(res, 400, { message: 'Duplicate email or tracking conflict; try again' })
      return send(res, 500, { message: err.message || 'Could not create package' })
    } finally {
      conn.release()
    }
  }

  // ── GET /api/employee/packages-at-office ───────────────────────────────────
  if (method === 'GET' && pathname === '/api/employee/packages-at-office') {
    const user = authenticate(req, res); if (!user) return
    if (!requireEmployee(user, res)) return
    try {
      await packagePickupStorageJob.runNodeDisposalSweep(pool)
    } catch (e) {
      console.error('[packages-at-office] disposal sweep:', e.message || e)
    }
    try {
      const [rows] = await pool.query(
        `SELECT
           p.Tracking_Number,
           p.Recipient_ID,
           CONCAT(cr.First_Name, ' ', cr.Last_Name) AS Recipient_Name,
           p.Weight,
           p.Package_Type_Code,
           d.Delivery_Status_Code,
           sc.Status_Name,
           pp.Arrival_Time AS Pickup_Arrival_Time,
           pp.Pickup_Time AS Customer_Pickup_Time,
           pp.Is_picked_Up AS Pickup_Is_Picked_Up,
           (SELECT sh.Arrival_Time_Stamp
              FROM shipment_package spx
              JOIN shipment sh ON sh.Shipment_ID = spx.Shipment_ID
             WHERE spx.Tracking_Number = p.Tracking_Number
             ORDER BY sh.Shipment_ID DESC
             LIMIT 1) AS Shipment_Arrival_Stamp
         FROM package p
         JOIN delivery d ON d.Tracking_Number = p.Tracking_Number
         JOIN status_code sc ON d.Delivery_Status_Code = sc.Status_Code
         LEFT JOIN customer cr ON p.Recipient_ID = cr.Customer_ID
         LEFT JOIN package_pickup pp ON pp.Tracking_Number = p.Tracking_Number
         WHERE LOWER(TRIM(sc.Status_Name)) = 'at office'
            OR LOWER(REPLACE(REPLACE(TRIM(sc.Status_Name), '-', '_'), ' ', '_')) = 'at_office'
         ORDER BY p.Date_Created DESC`
      )
      return send(res, 200, rows)
    } catch (err) {
      console.error(err)
      return send(res, 500, { message: err.sqlMessage || err.message || 'Database error' })
    }
  }

  // ── GET /api/employee/post-offices ─────────────────────────────────────────
  if (method === 'GET' && pathname === '/api/employee/post-offices') {
    const user = authenticate(req, res); if (!user) return
    if (!requireEmployee(user, res)) return
    try {
      const [rows] = await pool.query(
        `SELECT Post_Office_ID, Street, City, State,
                CONCAT(Street, ', ', City, ', ', State) AS Street_Label
         FROM post_office
         ORDER BY Street, City`
      )
      return send(res, 200, rows)
    } catch (err) {
      console.error(err)
      return send(res, 500, { message: err.sqlMessage || err.message || 'Database error' })
    }
  }

  // ── POST /api/employee/package-pickup-arrival (arrival only; not picked up yet) ─
  if (method === 'POST' && pathname === '/api/employee/package-pickup-arrival') {
    const user = authenticate(req, res); if (!user) return
    if (!requireEmployee(user, res)) return
    const body = await getBody(req)
    const { tracking_number, recipient_id, post_office_id, arrival_time } = body

    const tracking = String(tracking_number || '').trim()
    const rid = Number(recipient_id)
    const poid = Number(post_office_id)
    if (!tracking) return send(res, 400, { message: 'tracking_number is required' })
    if (!Number.isFinite(rid)) return send(res, 400, { message: 'recipient_id is required' })
    if (!Number.isFinite(poid)) return send(res, 400, { message: 'post_office_id is required' })

    const arrConn = await pool.getConnection()
    try {
      await arrConn.beginTransaction()

      const [[pkg]] = await arrConn.query(
        `SELECT p.Tracking_Number, p.Recipient_ID, sc.Status_Name
         FROM package p
         JOIN delivery d ON d.Tracking_Number = p.Tracking_Number
         JOIN status_code sc ON d.Delivery_Status_Code = sc.Status_Code
         WHERE p.Tracking_Number = ?`,
        [tracking]
      )
      if (!pkg) {
        await arrConn.rollback()
        return send(res, 404, { message: 'Package or delivery not found' })
      }
      if (!isAtOfficeStatusName(pkg.Status_Name)) {
        await arrConn.rollback()
        return send(res, 400, { message: 'Package is not in "At Office" status' })
      }
      if (Number(pkg.Recipient_ID) !== rid) {
        await arrConn.rollback()
        return send(res, 400, { message: 'Recipient_ID does not match this package' })
      }

      const [[shipRow]] = await arrConn.query(
        `SELECT sh.Arrival_Time_Stamp
         FROM shipment sh
         INNER JOIN shipment_package sp ON sp.Shipment_ID = sh.Shipment_ID
         WHERE sp.Tracking_Number = ?
         ORDER BY sh.Shipment_ID DESC
         LIMIT 1`,
        [tracking]
      )
      const effectiveArrival = resolveArrivalForPickup(shipRow?.Arrival_Time_Stamp, arrival_time)
      if (!effectiveArrival) {
        await arrConn.rollback()
        return send(res, 400, {
          message:
            'No arrival time: shipment has no Arrival_Time_Stamp yet (re-mark At Office or set arrival_time in the form)',
        })
      }

      const [[existing]] = await arrConn.query(
        `SELECT Is_picked_Up FROM package_pickup WHERE Tracking_Number = ?`,
        [tracking]
      )
      if (existing && String(existing.Is_picked_Up) === '1') {
        await arrConn.rollback()
        return send(res, 400, { message: 'Package is already marked picked up' })
      }

      await arrConn.query(
        `INSERT INTO package_pickup (Tracking_Number, Recipient_ID, Post_Office_ID, Arrival_Time, Pickup_Time, Is_picked_Up)
         VALUES (?, ?, ?, ?, NULL, '0')
         ON DUPLICATE KEY UPDATE
           Recipient_ID = IF(Is_picked_Up = '0', VALUES(Recipient_ID), Recipient_ID),
           Post_Office_ID = IF(Is_picked_Up = '0', VALUES(Post_Office_ID), Post_Office_ID),
           Arrival_Time = IF(Is_picked_Up = '0', VALUES(Arrival_Time), Arrival_Time)`,
        [tracking, rid, poid, effectiveArrival]
      )

      await arrConn.commit()
      return send(res, 201, { ok: true, tracking_number: tracking, Is_picked_Up: '0' })
    } catch (err) {
      await arrConn.rollback()
      console.error(err)
      if (err.code === 'ER_NO_SUCH_TABLE') {
        return send(res, 500, {
          message:
            'Table package_pickup is missing. Run backend/db/migrations/005_create_package_pickup.sql',
        })
      }
      return send(res, 500, { message: err.sqlMessage || err.message || 'Could not record arrival' })
    } finally {
      arrConn.release()
    }
  }

  // ── POST /api/employee/package-pickup ─────────────────────────────────────
  if (method === 'POST' && pathname === '/api/employee/package-pickup') {
    const user = authenticate(req, res); if (!user) return
    if (!requireEmployee(user, res)) return
    const body = await getBody(req)
    const {
      tracking_number,
      recipient_id,
      post_office_id,
      arrival_time,
      pickup_time,
    } = body

    const tracking = String(tracking_number || '').trim()
    const rid = Number(recipient_id)
    const poid = Number(post_office_id)
    const pickup = toMysqlDateTime(pickup_time)

    if (!tracking) return send(res, 400, { message: 'tracking_number is required' })
    if (!Number.isFinite(rid)) return send(res, 400, { message: 'recipient_id is required' })
    if (!Number.isFinite(poid)) return send(res, 400, { message: 'post_office_id is required' })
    if (!pickup) return send(res, 400, { message: 'pickup_time is required' })

    const pickupConn = await pool.getConnection()
    try {
      await pickupConn.beginTransaction()

      const [[pkg]] = await pickupConn.query(
        `SELECT p.Tracking_Number, p.Recipient_ID, sc.Status_Name
         FROM package p
         JOIN delivery d ON d.Tracking_Number = p.Tracking_Number
         JOIN status_code sc ON d.Delivery_Status_Code = sc.Status_Code
         WHERE p.Tracking_Number = ?`,
        [tracking]
      )
      if (!pkg) {
        await pickupConn.rollback()
        return send(res, 404, { message: 'Package or delivery not found' })
      }
      if (!isAtOfficeStatusName(pkg.Status_Name)) {
        await pickupConn.rollback()
        return send(res, 400, { message: 'Package is not in "At Office" status' })
      }
      if (Number(pkg.Recipient_ID) !== rid) {
        await pickupConn.rollback()
        return send(res, 400, { message: 'Recipient_ID does not match this package' })
      }

      const [[shipRow]] = await pickupConn.query(
        `SELECT sh.Arrival_Time_Stamp
         FROM shipment sh
         INNER JOIN shipment_package sp ON sp.Shipment_ID = sh.Shipment_ID
         WHERE sp.Tracking_Number = ?
         ORDER BY sh.Shipment_ID DESC
         LIMIT 1`,
        [tracking]
      )
      const effectiveArrival = resolveArrivalForPickup(shipRow?.Arrival_Time_Stamp, arrival_time)
      if (!effectiveArrival) {
        await pickupConn.rollback()
        return send(res, 400, {
          message:
            'No arrival time: shipment has no Arrival_Time_Stamp yet, or send arrival_time in the request body',
        })
      }

      const arrMs = new Date(String(effectiveArrival).replace(' ', 'T')).getTime()
      const pkuMs = new Date(String(pickup_time).replace(' ', 'T')).getTime()
      if (Number.isFinite(arrMs) && Number.isFinite(pkuMs) && pkuMs < arrMs) {
        await pickupConn.rollback()
        return send(res, 400, { message: 'Pickup time must be on or after arrival time' })
      }

      await pickupConn.query(
        `INSERT INTO package_pickup (Tracking_Number, Recipient_ID, Post_Office_ID, Arrival_Time, Pickup_Time, Is_picked_Up)
         VALUES (?, ?, ?, ?, ?, '1')
         ON DUPLICATE KEY UPDATE
           Recipient_ID = VALUES(Recipient_ID),
           Post_Office_ID = VALUES(Post_Office_ID),
           Arrival_Time = VALUES(Arrival_Time),
           Pickup_Time = VALUES(Pickup_Time),
           Is_picked_Up = '1'`,
        [tracking, rid, poid, effectiveArrival, pickup]
      )

      const [[pickedUp]] = await pickupConn.query(
        `SELECT Status_Code FROM status_code
         WHERE LOWER(TRIM(Status_Name)) = 'picked up'
         LIMIT 1`
      )
      if (pickedUp) {
        await pickupConn.query(`UPDATE delivery SET Delivery_Status_Code = ? WHERE Tracking_Number = ?`, [
          pickedUp.Status_Code,
          tracking,
        ])
        const [sp] = await pickupConn.query(
          `SELECT Shipment_ID FROM shipment_package WHERE Tracking_Number = ? LIMIT 1`,
          [tracking]
        )
        if (sp.length) {
          await pickupConn.query(`UPDATE shipment SET Status_Code = ? WHERE Shipment_ID = ?`, [
            pickedUp.Status_Code,
            sp[0].Shipment_ID,
          ])
        }
      }

      await pickupConn.commit()
      return send(res, 201, { ok: true, tracking_number: tracking, Is_picked_Up: '1' })
    } catch (err) {
      await pickupConn.rollback()
      console.error(err)
      if (err.code === 'ER_NO_SUCH_TABLE') {
        return send(res, 500, {
          message:
            'Table package_pickup is missing. Run backend/db/migrations/005_create_package_pickup.sql',
        })
      }
      return send(res, 500, { message: err.sqlMessage || err.message || 'Could not record pickup' })
    } finally {
      pickupConn.release()
    }
  }

  // ── GET /api/status-codes ────────────────────────────────────────────────
  if (method === 'GET' && pathname === '/api/status-codes') {
    const user = authenticate(req, res); if (!user) return
    if (!requireEmployee(user, res)) return
    try {
      const [rows] = await pool.query(`SELECT Status_Code, Status_Name, Is_Final_Status FROM status_code ORDER BY Status_Code ASC`)
      return send(res, 200, rows)
    } catch (err) {
      console.error(err)
      return send(res, 500, { message: 'Database error' })
    }
  }

  // ── POST /api/employee/package-pickup-sweep (late fees + 30-day disposal; same as nightly procedure) ──
  if (method === 'POST' && pathname === '/api/employee/package-pickup-sweep') {
    const user = authenticate(req, res); if (!user) return
    if (!requireEmployee(user, res)) return
    try {
      await packagePickupStorageJob.runDailyPackagePickupStorage(pool)
      return send(res, 200, { ok: true, message: 'Pickup storage sweep completed (procedure if present + Node disposal)' })
    } catch (err) {
      console.error(err)
      return send(res, 500, {
        message: err.sqlMessage || err.message || 'Sweep failed',
      })
    }
  }

  // ── PATCH /api/employee/packages/:trackingNumber/status ──────────────────
  {
    const m = matchPath('/api/employee/packages/:trackingNumber/status', pathname)
    if (method === 'PATCH' && m.matched) {
      const user = authenticate(req, res); if (!user) return
      if (!requireEmployee(user, res)) return
      const trackingNumber = m.params.trackingNumber.trim()
      const { status_code } = await getBody(req)
      if (!trackingNumber) return send(res, 400, { message: 'trackingNumber required' })
      if (status_code === undefined || status_code === null) return send(res, 400, { message: 'status_code is required' })
      const code = Number(status_code)
      if (Number.isNaN(code)) return send(res, 400, { message: 'status_code must be a number' })

      const conn = await pool.getConnection()
      try {
        await conn.beginTransaction()
        const [[d]] = await conn.query(`SELECT Delivery_ID FROM delivery WHERE Tracking_Number = ?`, [trackingNumber])
        if (!d) { await conn.rollback(); return send(res, 404, { message: 'Delivery record not found for this package' }) }
        await conn.query(`UPDATE delivery SET Delivery_Status_Code = ? WHERE Tracking_Number = ?`, [code, trackingNumber])
        const [sp] = await conn.query(`SELECT Shipment_ID FROM shipment_package WHERE Tracking_Number = ? LIMIT 1`, [trackingNumber])
        if (sp.length) {
          const [[scRow]] = await conn.query(`SELECT Status_Name FROM status_code WHERE Status_Code = ? LIMIT 1`, [code])
          const newStatusName = scRow?.Status_Name
          if (isAtOfficeStatusName(newStatusName)) {
            await conn.query(
              `UPDATE shipment SET Status_Code = ?, Arrival_Time_Stamp = COALESCE(Arrival_Time_Stamp, NOW()) WHERE Shipment_ID = ?`,
              [code, sp[0].Shipment_ID]
            )
          } else {
            await conn.query(`UPDATE shipment SET Status_Code = ? WHERE Shipment_ID = ?`, [code, sp[0].Shipment_ID])
          }
        }
        await conn.commit()
        return send(res, 200, { ok: true, tracking_number: trackingNumber, status_code: code })
      } catch (err) {
        await conn.rollback()
        console.error(err)
        return send(res, 500, { message: err.message || 'Update failed' })
      } finally {
        conn.release()
      }
    }
  }

  // ── GET /api/inventory ───────────────────────────────────────────────────
  if (method === 'GET' && pathname === '/api/inventory') {
    inventoryDB.getAllInventory(pool, (err, results) => {
      if (err) return send(res, 500, { error: 'Database error' })
      send(res, 200, results)
    })
    return
  }

  // ── POST /api/tickets ────────────────────────────────────────────────────
  if (method === 'POST' && pathname === '/api/tickets') {
    const { name, email, transactionId, category, description, submittedAt } = await getBody(req)
    if (!name || !email || !transactionId || !category || !description) {
      return send(res, 400, { message: 'Missing required fields' })
    }
    console.log('New support ticket:', { name, email, transactionId, category, description, submittedAt })
    return send(res, 201, { message: 'Ticket submitted successfully' })
  }

  // ── GET /api/customers ───────────────────────────────────────────────────
  if (method === 'GET' && pathname === '/api/customers') {
    customerDB.getAllCustomers(pool, (err, results) => {
      if (err) return send(res, 500, { error: err.message })
      send(res, 200, results)
    })
    return
  }

  // ── GET /api/customers/:id/packages ─────────────────────────────────────
  {
    const m = matchPath('/api/customers/:id/packages', pathname)
    if (method === 'GET' && m.matched) {
      customerDB.getCustomerPackages(pool, m.params.id, (err, results) => {
        if (err) return send(res, 500, { error: err.message })
        send(res, 200, results)
      })
      return
    }
  }

  // ── GET /api/packages/:tracking_number/tracking ───────────────────────────
  {
    const m = matchPath('/api/packages/:tracking_number/tracking', pathname)
    if (method === 'GET' && m.matched) {
      const tn = m.params.tracking_number
      packageTrackDB.getPackageTracking(pool, tn, (err, results) => {
        if (err) return send(res, 500, { error: 'Database error', details: err.message })
        send(res, 200, results)
      })
      return
    }
  }

  // ── GET /api/customer/lookup ─────────────────────────────────────────────
  if (method === 'GET' && pathname === '/api/customer/lookup') {
    const user = authenticate(req, res); if (!user) return
    if (!requireEmployee(user, res)) return
    const email = (query.email || '').trim().toLowerCase()
    if (!email) return send(res, 400, { message: 'Email is required' })
    try {
      const [rows] = await pool.query(
        `SELECT Customer_ID, First_Name, Last_Name, Email_Address,
                Phone_Number, House_Number, Street, Apt_Number,
                City, State, Zip_First3, Zip_Last2
         FROM customer WHERE Email_Address = ? LIMIT 1`,
        [email]
      )
      if (!rows.length) return send(res, 404, { message: 'Customer not found' })
      return send(res, 200, { customer: rows[0] })
    } catch (err) {
      console.error(err)
      return send(res, 500, { message: 'Server error' })
    }
  }

  // ── GET /api/employee/tickets_comp ───────────────────────────────────────
  if (method === 'GET' && pathname === '/api/employee/tickets_comp') {
    try {
      const results = await employeeDB.getEmployeesRatios(pool)
      return send(res, 200, results)
    } catch (err) {
      return send(res, 500, { error: err.message })
    }
  }

  // ── GET /api/employee/:employee_id/tickets ───────────────────────────────
  {
    const m = matchPath('/api/employee/:employee_id/tickets', pathname)
    if (method === 'GET' && m.matched) {
      try {
        const results = await employeeDB.getTicketsByEmployee(pool, m.params.employee_id)
        return send(res, 200, results)
      } catch (err) {
        return send(res, 500, { error: err.message })
      }
    }
  }

  // ── GET /api/employee/weeklyTickets ─────────────────────────────────────
  if (method === 'GET' && pathname === '/api/employee/weeklyTickets') {
    try {
      const results = await employeeDB.getWeeklyStatus(pool)
      return send(res, 200, results)
    } catch (err) {
      return send(res, 500, { error: err.message })
    }
  }

  // ── GET /api/employee/net-tickets ────────────────────────────────────────
  if (method === 'GET' && pathname === '/api/employee/net-tickets') {
    try {
      const results = await employeeDB.getNetAverage(pool)
      return send(res, 200, results)
    } catch (err) {
      return send(res, 500, { error: err.message })
    }
  }

  // ── GET /api/employee/week-net-tickets ───────────────────────────────────
  if (method === 'GET' && pathname === '/api/employee/week-net-tickets') {
    try {
      const results = await employeeDB.netTicketsWeek(pool)
      return send(res, 200, results)
    } catch (err) {
      return send(res, 500, { error: err.message })
    }
  }

  // ── GET /api/employee/tickets-by-issue ───────────────────────────────────
  if (method === 'GET' && pathname === '/api/employee/tickets-by-issue') {
    try {
      const results = await employeeDB.ticketByIssue(pool)
      return send(res, 200, results)
    } catch (err) {
      return send(res, 500, { error: err.message })
    }
  }

  // ── GET /api/report/payments ──────────────────────────────────────────────
  if (method === 'GET' && pathname === '/api/report/payments') {
    try {
      const { dateFrom, dateTo } = query
      let sql = `
        SELECT
          Payment_ID AS payment_id,
          Customer_ID AS customer_id,
          Payment_Amount AS amount,
          Payment_Type AS payment_method,
          Payment_Status AS payment_status,
          Payment_Date AS payment_date
        FROM payment
        WHERE 1=1
      `
      const params = []
      if (dateFrom) { sql += ` AND Payment_Date >= ?`; params.push(dateFrom) }
      if (dateTo) { sql += ` AND Payment_Date <= ?`; params.push(dateTo) }
      sql += ` ORDER BY Payment_Date DESC`
      const [rows] = await pool.query(sql, params)
      return send(res, 200, rows)
    } catch (err) {
      console.error(err)
      return send(res, 500, { error: err.message })
    }
  }

  // ── GET /api/report/excess-fees ───────────────────────────────────────────
  if (method === 'GET' && pathname === '/api/report/excess-fees') {
    try {
      const { search, dateFrom, dateTo, feeType } = query
      let sql = `
        SELECT
          pef.Tracking_Number AS package_id,
          ef.Type_Name AS fee_type,
          ef.Additional_Price AS amount,
          p.Date_Created AS applied_date
        FROM package_excess_fee pef
        JOIN excess_fee ef ON pef.Fee_Type_Code = ef.Fee_Type_Code
        JOIN package p ON pef.Tracking_Number = p.Tracking_Number
        WHERE 1=1
      `
      const params = []
      if (search) { sql += ` AND (ef.Type_Name LIKE ? OR pef.Tracking_Number LIKE ?)`; params.push(`%${search}%`, `%${search}%`) }
      if (dateFrom) { sql += ` AND p.Date_Created >= ?`; params.push(dateFrom) }
      if (dateTo) { sql += ` AND p.Date_Created <= ?`; params.push(dateTo) }
      if (feeType) { sql += ` AND ef.Type_Name = ?`; params.push(feeType) }
      sql += ` ORDER BY p.Date_Created DESC`
      const [rows] = await pool.query(sql, params)
      return send(res, 200, rows)
    } catch (err) {
      console.error(err)
      return send(res, 500, { error: err.message })
    }
  }

  // ── GET /api/report/revenue-by-month ─────────────────────────────────────
  if (method === 'GET' && pathname === '/api/report/revenue-by-month') {
    try {
      const [rows] = await pool.query(`
        SELECT 
          DATE_FORMAT(p.Date_Created, '%b %Y') AS month,
          DATE_FORMAT(p.Date_Created, '%Y-%m') AS sort_key,
          SUM(ef.Additional_Price) AS revenue
        FROM package_excess_fee pef
        JOIN excess_fee ef ON pef.Fee_Type_Code = ef.Fee_Type_Code
        JOIN package p ON pef.Tracking_Number = p.Tracking_Number
        GROUP BY month, sort_key
        ORDER BY sort_key ASC
        LIMIT 12
      `)
      return send(res, 200, rows)
    } catch (err) {
      console.error(err)
      return send(res, 500, { error: err.message })
    }
  }

  // ── POST /api/support-tickets ────────────────────────────────────────────
  if (method === 'POST' && pathname === '/api/support-tickets') {
    const { User_ID, Package_ID, Assigned_Employee_ID, Issue_Type, Description } = await getBody(req)
    if (!User_ID || !Package_ID || !Assigned_Employee_ID || Issue_Type === undefined || !Description) {
      return send(res, 400, { message: 'Missing required fields' })
    }
    try {
      await pool.query(
        `INSERT INTO support_ticket (User_ID, Package_ID, Assigned_Employee_ID, Issue_Type, Description, Ticket_Status_Code)
        VALUES (?, ?, ?, ?, ?, 0)`,
        [User_ID, Package_ID, Assigned_Employee_ID, Issue_Type, Description]
      )
      return send(res, 201, { message: 'Ticket submitted successfully' })
    } catch (err) {
      console.error('POST /api/support-tickets error:', err)
      return send(res, 500, { error: err.message || 'Failed to create ticket' })
    }
  }

  if (method === 'GET' && pathname === '/api/employees') {
    try {
      const [rows] = await pool.query(
        `SELECT Employee_ID, First_Name, Last_Name FROM employee WHERE Is_Active = 1`
      )
      return send(res, 200, rows)
    } catch (err) {
      return send(res, 500, { error: err.message })
    }
  }

  // ── GET /api/report/fee-breakdown ────────────────────────────────────────
  if (method === 'GET' && pathname === '/api/report/fee-breakdown') {
    try {
      const { search, dateFrom, dateTo, feeType } = query
      let sql = `
        SELECT 
          ef.Type_Name AS fee_type,
          COUNT(*) AS times_applied,
          SUM(ef.Additional_Price) AS total_revenue,
          AVG(ef.Additional_Price) AS avg_fee
        FROM package_excess_fee pef
        JOIN excess_fee ef ON pef.Fee_Type_Code = ef.Fee_Type_Code
        JOIN package p ON pef.Tracking_Number = p.Tracking_Number
        WHERE 1=1
      `
      const params = []
      if (search) { sql += ` AND (ef.Type_Name LIKE ? OR pef.Tracking_Number LIKE ?)`; params.push(`%${search}%`, `%${search}%`) }
      if (dateFrom) { sql += ` AND p.Date_Created >= ?`; params.push(dateFrom) }
      if (dateTo) { sql += ` AND p.Date_Created <= ?`; params.push(dateTo) }
      if (feeType) { sql += ` AND ef.Type_Name = ?`; params.push(feeType) }
      sql += ` GROUP BY ef.Fee_Type_Code, ef.Type_Name ORDER BY total_revenue DESC`
      const [rows] = await pool.query(sql, params)
      return send(res, 200, rows)
    } catch (err) {
      console.error(err)
      return send(res, 500, { error: err.message })
    }
  }

  // ── GET /api/report/packages ──────────────────────────────────────────────
  if (method === 'GET' && pathname === '/api/report/packages') {
    try {
      const { search, dateFrom, dateTo } = query
      let sql = `
        SELECT 
          p.Tracking_Number AS package_id,
          p.Package_Type_Code AS package_type,
          p.Weight AS weight,
          p.Price AS price,
          p.Zone AS zone,
          p.Date_Created AS created_at,
          CONCAT(s.First_Name, ' ', s.Last_Name) AS sender_name,
          CONCAT(r.First_Name, ' ', r.Last_Name) AS recipient_name
        FROM package p
        JOIN customer s ON p.Sender_ID = s.Customer_ID
        JOIN customer r ON p.Recipient_ID = r.Customer_ID
        WHERE 1=1
      `
      const params = []
      if (search) { sql += ` AND (p.Tracking_Number LIKE ?)`; params.push(`%${search}%`) }
      if (dateFrom) { sql += ` AND p.Date_Created >= ?`; params.push(dateFrom) }
      if (dateTo) { sql += ` AND p.Date_Created <= ?`; params.push(dateTo) }
      sql += ` ORDER BY p.Date_Created DESC`
      const [rows] = await pool.query(sql, params)
      return send(res, 200, rows)
    } catch (err) {
      console.error(err)
      return send(res, 500, { error: err.message })
    }
  }

  // ── GET /api/report/payments ──────────────────────────────────────────────
  if (method === 'GET' && pathname === '/api/report/payments') {
    try {
      const { dateFrom, dateTo } = query
      let sql = `
        SELECT
          Payment_ID AS payment_id,
          Customer_ID AS customer_id,
          Payment_Amount AS amount,
          Payment_Type AS payment_method,
          Payment_Status AS payment_status,
          Payment_Date AS payment_date
        FROM payment
        WHERE 1=1
      `
      const params = []
      if (dateFrom) { sql += ` AND Payment_Date >= ?`; params.push(dateFrom) }
      if (dateTo) { sql += ` AND Payment_Date <= ?`; params.push(dateTo) }
      sql += ` ORDER BY Payment_Date DESC`
      const [rows] = await pool.query(sql, params)
      return send(res, 200, rows)
    } catch (err) {
      console.error(err)
      return send(res, 500, { error: err.message })
    }
  }

  // ── GET /api/report/excess-fees ───────────────────────────────────────────
  if (method === 'GET' && pathname === '/api/report/excess-fees') {
    try {
      const { search, dateFrom, dateTo, feeType } = query
      let sql = `
        SELECT
          pef.Tracking_Number AS package_id,
          ef.Type_Name AS fee_type,
          ef.Additional_Price AS amount,
          p.Date_Created AS applied_date
        FROM package_excess_fee pef
        JOIN excess_fee ef ON pef.Fee_Type_Code = ef.Fee_Type_Code
        JOIN package p ON pef.Tracking_Number = p.Tracking_Number
        WHERE 1=1
      `
      const params = []
      if (search) { sql += ` AND (ef.Type_Name LIKE ? OR pef.Tracking_Number LIKE ?)`; params.push(`%${search}%`, `%${search}%`) }
      if (dateFrom) { sql += ` AND p.Date_Created >= ?`; params.push(dateFrom) }
      if (dateTo) { sql += ` AND p.Date_Created <= ?`; params.push(dateTo) }
      if (feeType) { sql += ` AND ef.Type_Name = ?`; params.push(feeType) }
      sql += ` ORDER BY p.Date_Created DESC`
      const [rows] = await pool.query(sql, params)
      return send(res, 200, rows)
    } catch (err) {
      console.error(err)
      return send(res, 500, { error: err.message })
    }
  }

  // ── GET /api/report/revenue-by-month ─────────────────────────────────────
  if (method === 'GET' && pathname === '/api/report/revenue-by-month') {
    try {
      const [rows] = await pool.query(`
        SELECT 
          DATE_FORMAT(p.Date_Created, '%b %Y') AS month,
          DATE_FORMAT(p.Date_Created, '%Y-%m') AS sort_key,
          SUM(ef.Additional_Price) AS revenue
        FROM package_excess_fee pef
        JOIN excess_fee ef ON pef.Fee_Type_Code = ef.Fee_Type_Code
        JOIN package p ON pef.Tracking_Number = p.Tracking_Number
        GROUP BY month, sort_key
        ORDER BY sort_key ASC
        LIMIT 12
      `)
      return send(res, 200, rows)
    } catch (err) {
      console.error(err)
      return send(res, 500, { error: err.message })
    }
  }

    // ── 404 ──────────────────────────────────────────────────────────────────
    send(res, 404, { error: 'Not found' })
  }

// ── Start server ──────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000
console.log('[api] admin routes: GET /api/admin/employees, PATCH /api/admin/employees/:employeeId/deactivate')
http.createServer(router).listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`))
console.log("Connecting to Database:", process.env.MYSQL_DATABASE)

