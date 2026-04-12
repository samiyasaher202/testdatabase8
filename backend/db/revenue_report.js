//All queries related to the Revenue Report Admin page


function getFeeBreakdown(pool, { search, dateFrom, dateTo, feeType } = {}, callback) {
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

  pool.query(sql, params)
    .then(([results]) => callback(null, results))
    .catch(err => callback(err, null))
}

function getReportPackages(pool, { search, dateFrom, dateTo } = {}, callback) {
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

  pool.query(sql, params)
    .then(([results]) => callback(null, results))
    .catch(err => callback(err, null))
}

function getReportPayments(pool, { dateFrom, dateTo } = {}, callback) {
  let sql = `
    SELECT
      Payment_ID AS payment_id,
      Customer_ID AS customer_id,
      Payment_Amount AS amount,
      Payment_Type AS payment_method,
      Payment_Status AS payment_status,
      Date_Created AS payment_date
    FROM payment
    WHERE 1=1
  `
  const params = []
  if (dateFrom) { sql += ` AND Date_Created >= ?`; params.push(dateFrom) }
  if (dateTo) { sql += ` AND Date_Created <= ?`; params.push(dateTo) }
  sql += ` ORDER BY Date_Created DESC`

  pool.query(sql, params)
    .then(([results]) => callback(null, results))
    .catch(err => callback(err, null))
}

function getExcessFees(pool, { search, dateFrom, dateTo, feeType } = {}, callback) {
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

  pool.query(sql, params)
    .then(([results]) => callback(null, results))
    .catch(err => callback(err, null))
}

function getRevenueByMonth(pool, callback) {
  pool.query(`
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
    .then(([results]) => callback(null, results))
    .catch(err => callback(err, null))
}

module.exports = {
  getFeeBreakdown,
  getReportPackages,
  getReportPayments,
  getExcessFees,
  getRevenueByMonth,
}