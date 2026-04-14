//want employee First and Last name, id, and Role, 
// from support ticket sum up every support ticket resolved by employee, and support tickets still unresolved by employee
// from payment sum up total tickets completed, and total price sold out

/** mysql2 row keys may be Is_Active, is_active, Emp_Is_Active (alias), etc. */
function getRawEmployeeIsActive(row) {
  if (!row || typeof row !== 'object') return undefined
  return (
    row.Is_Active ??
    row.Emp_Is_Active ??
    row.emp_is_active ??
    row.is_active ??
    row.is_Active ??
    row.IS_ACTIVE
  )
}

/**
 * Coerce DB/driver Is_Active to 0 | 1 for JSON.
 * Unknown / odd values default to 1 (active) so rows are not all pushed to "past".
 */
function normalizeEmployeeIsActiveForApi(v) {
  if (v == null) return 1
  if (typeof Buffer !== 'undefined' && typeof Buffer.isBuffer === 'function' && Buffer.isBuffer(v)) {
    if (v.length === 1) {
      const b = v[0]
      if (b === 1 || b === 0x31) return 1
      if (b === 0 || b === 0x30) return 0
    }
    const s = v.toString('utf8').replace(/^\uFEFF/, '').trim().toLowerCase()
    if (s === '1' || s === 'true' || s === 'yes' || s === 'active' || s === 'y') return 1
    if (s === '0' || s === 'false' || s === 'no' || s === 'inactive' || s === 'n' || s === '') return 0
    const n = Number(s)
    if (n === 1) return 1
    if (n === 0) return 0
    return 1
  }
  if (typeof v === 'boolean') return v ? 1 : 0
  if (typeof v === 'bigint') return v === 1n ? 1 : 0
  if (typeof v === 'number' && Number.isFinite(v)) {
    if (v === 1) return 1
    if (v === 0) return 0
    return 1
  }
  const s = String(v).replace(/^\uFEFF/, '').trim().toLowerCase()
  if (s === '1' || s === 'true' || s === 'yes' || s === 'active' || s === 'y') return 1
  if (s === '0' || s === 'false' || s === 'no' || s === 'inactive' || s === 'n' || s === '') return 0
  const n = Number(s)
  if (n === 1) return 1
  if (n === 0) return 0
  return 1
}

async function getEmployeesRatios(pool) {
  const employeeQBase = `
        SELECT
            CONCAT(
            e.First_Name, ' ',
            IF(e.Middle_Name IS NOT NULL, CONCAT(e.Middle_Name, ' '), ''),
            e.Last_Name) AS E_Full_Name,
            e.Employee_ID,
            e.Is_Active,
            r.Role_Name,
            d.Department_Name,
            e.Hours_Worked,
            CONCAT(
             m.First_Name, ' ',
            IF(m.Middle_Name IS NOT NULL, CONCAT(m.Middle_Name, ' '), ''),
            m.Last_Name) AS M_Full_Name
        FROM employee e
        LEFT JOIN employee m ON m.Employee_ID = e.Supervisor_ID
        JOIN role r ON r.Role_ID = e.Role_ID
        JOIN department d ON d.Department_ID = e.Department_ID
        WHERE r.Role_ID != 2
        `

  const ticketQ = `
        SELECT
            s.Ticket_Status_Code,
            COUNT(*) AS Ticket_Count
         FROM support_ticket s
        WHERE s.Assigned_Employee_ID = ?
        GROUP BY s.Ticket_Status_Code`

  async function withTickets(rows) {
    return Promise.all(
      rows.map(async (emp) => {
        const [ticketResults] = await pool.query(ticketQ, [emp.Employee_ID])
        const ticketCounts = ticketResults.reduce((acc, row) => {
          acc[row.Ticket_Status_Code] = row.Ticket_Count
          return acc
        }, {})
        return { ...emp, Ticket_Counts: ticketCounts }
      })
    )
  }

  const [employeeResults] = await pool.query(employeeQBase)
  const withCounts = await withTickets(employeeResults)

  const current = []
  const past = []
  for (const emp of withCounts) {
    const n = normalizeEmployeeIsActiveForApi(getRawEmployeeIsActive(emp))
    const row = { ...emp, Is_Active: n }
    if (n === 1) current.push(row)
    else past.push(row)
  }

  return { current, past }
}

async function getTicketsByEmployee(pool,employeeId){
    // console.log("get Tickets by employee called");
    const [results] = await pool.query(
        `SELECT
        s.Ticket_ID,
        s.User_ID,
        s.Package_ID,
        t.Name,
        s.Issue_Type,
        
        s.Date_Created,
        s.Date_Updated,
        s.Ticket_Status_Code,
        If(s.Resolution_Note IS NOT NULL, s.Resolution_Note, '') AS Resolution_Note
        

        FROM support_ticket s
        JOIN ticket_issue_type t ON t.Type_Id = s.Issue_Type
        WHERE s.Assigned_Employee_Id = ?
        ORDER BY s.Date_Created DESC`,
        [employeeId]
        
    );
    return results;
}

async function getNetAverage(pool){
    const[results] = await pool.query(
        `SELECT
            SUM(IF(s.Ticket_Status_Code = 2, 1, 0))/ COUNT(DISTINCT WEEK(s.Date_Updated)) as complete,
            SUM(IF(s.Ticket_Status_Code = 0 OR s.Ticket_Status_Code = 1, 1, 0))/COUNT(DISTINCT WEEK(s.Date_Updated)) AS incomplete
        FROM support_ticket s;
            `
    )
    return results;
}
async function getWeeklyStatus(pool){
    const [results] = await pool.query(
        `SELECT
            YEARWEEK(CASE 
                WHEN s.Ticket_Status_Code = 0 THEN s.Date_Created
                ELSE s.Date_Updated
                END) AS week,
            SUM(IF(s.Ticket_Status_Code = 2, 1, 0)) as Resolved_Sum,
            SUM(IF(s.Ticket_Status_Code = 1, 1, 0)) as Pending_Sum,
            SUM(IF(s.Ticket_Status_Code = 0, 1, 0)) as Unresolved_Sum
        FROM support_ticket s
        GROUP BY(YEARWEEK(CASE 
                WHEN s.Ticket_Status_Code = 0 THEN s.Date_Created
                ELSE s.Date_Updated
                END))
        ORDER BY(YEARWEEK(CASE 
                WHEN s.Ticket_Status_Code = 0 THEN s.Date_Created
                ELSE s.Date_Updated
                END));
        `
    )
    return results;
 }

 async function netTicketsWeek(pool){
    const[results] = await pool.query(
        `SELECT
            SUM(IF(s.Ticket_Status_Code = 2, 1, 0)) as complete,
            SUM(IF(s.Ticket_Status_Code IN (0, 1), 1, 0)) AS incomplete
        FROM support_ticket s
        WHERE 
            WEEK(
                CASE 
                    WHEN s.Ticket_Status_Code = 0 THEN s.Date_Created
                    ELSE s.Date_Updated
                END
            ) = WEEK(CURDATE()); 
        `
    )
    return results;
 }

 async function ticketByIssue(pool) {
  const [results] = await pool.query(`
    SELECT
      t.Name,
      COUNT(*) AS total
    FROM support_ticket s
    JOIN ticket_issue_type t ON t.Type_ID = s.Issue_Type
    WHERE s.Date_Created >= CURDATE() - INTERVAL 30 DAY
    GROUP BY t.Name;
  `);
  const formatted = [
    results.reduce((acc, row) => {
      acc[row.Name] = row.total;
      return acc;
    }, {})
  ];

  return formatted;
}
module.exports = {
  getEmployeesRatios,
  getTicketsByEmployee,
  getNetAverage,
  getWeeklyStatus,
  netTicketsWeek,
  ticketByIssue,
  normalizeEmployeeIsActiveForApi,
  getRawEmployeeIsActive,
}