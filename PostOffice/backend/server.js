
const http = require('http')
const mysql = require('mysql2')
const path = require('path')
const fs = require('fs')

// ── MYSQL CONNECTION ──
const db = mysql.createPool({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'Rzv#gf+T8crMV',
  database: 'post_office_8',
  waitForConnections: true,
  connectionLimit: 10
})

db.getConnection((err, connection) => {
  if (err) {
    console.error('MySQL connection failed:', err.message)
  } else {
    console.log('Connected to MySQL!')
    connection.release()
  }
})

// ── HELPERS ──
function getContentType(filePath) {
  if (filePath.endsWith('.html')) return 'text/html'
  if (filePath.endsWith('.css'))  return 'text/css'
  if (filePath.endsWith('.js'))   return 'application/javascript'
  return 'text/plain'
}

function sendFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return }
    res.writeHead(200, { 'Content-Type': getContentType(filePath) })
    res.end(data)
  })
}

function sendJSON(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  })
  res.end(JSON.stringify(data))
}

function getBody(req) {
  return new Promise((resolve) => {
    let body = ''
    req.on('data', chunk => body += chunk)
    req.on('end', () => resolve(JSON.parse(body || '{}')))
  })
}

// ── SERVER ──
const server = http.createServer(async (req, res) => {
  console.log(req.method, req.url)  // ← shows every request in terminal
  const url = req.url
  const method = req.method

  // ── PAGE ROUTES ──
  if (method === 'GET' && url === '/') {
    return sendFile(res, path.join(__dirname, '../frontend/public/html/home.html'))
  }
  if (method === 'GET' && url === '/customer_home') {
    return sendFile(res, path.join(__dirname, '../frontend/public/html/customer/customer_home.html'))
  }
  if (method === 'GET' && url === '/employee_home') {
    return sendFile(res, path.join(__dirname, '../frontend/public/html/employee/employee_home.html'))
  }

  // ── STATIC FILES ──
  if (method === 'GET' && url.startsWith('/css/')) {
    return sendFile(res, path.join(__dirname, '../frontend/public', url))
  }
  if (method === 'GET' && url.startsWith('/js/')) {
    return sendFile(res, path.join(__dirname, '../frontend/public', url))
  }

  // ── 404 ──
  res.writeHead(404)
  res.end('Page not found')
})

server.listen(3000, () => console.log('Server running on http://localhost:3000'))