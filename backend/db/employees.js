//want employee First and Last name, id, and Role, 
// from support ticket sum up every support ticket resolved by employee, and support tickets still unresolved by employee
// from payment sum up total tickets completed, and total price sold out

async function getEmployeesRatios(pool){
    console.log("getEmployeesRatios called");
    const employeeQ =
        `SELECT
            CONCAT(
            e.First_Name, ' ',
            IF(e.Middle_Name IS NOT NULL, CONCAT(e.Middle_Name, ' '), ''),
            e.Last_Name) AS E_Full_Name,      
            e.Employee_ID,
            r.Role_Name,
            d.Department_Name,
            e.Hours_Worked,
            CONCAT(
             m.First_Name, ' ',
            IF(m.Middle_Name IS NOT NULL, CONCAT(m.Middle_Name, ' '), ''),
            m.Last_Name) AS M_Full_Name


        From employee e
        LEFT JOIN employee m ON m.Employee_ID = e.Supervisor_ID
        JOIN role r ON r.Role_ID = e.Role_ID
        JOIN department d ON d.Department_ID = e.Department_ID
        `;

        const ticketQ =
        `SELECT
            s.Ticket_Status_Code,
            COUNT(*) AS Ticket_Count
         FROM support_ticket s
        WHERE s.Assigned_Employee_ID = ?
        GROUP BY s.Ticket_Status_Code`;
        const [employeeResults] = await pool.query(employeeQ);
    
        const ans = await Promise.all(employeeResults.map(async (emp) => {
            const [ticketResults] = await pool.query(ticketQ, [emp.Employee_ID]);
            const ticketCounts = ticketResults.reduce((acc, row) => {
                acc[row.Ticket_Status_Code] = row.Ticket_Count;
                    return acc;
            }, {});
            return { ...emp, Ticket_Counts: ticketCounts };  
        }));

    return ans;
}
async function getTicketsByEmployee(pool,employeeId){
    console.log("get Tickets by employee called");
    const [results] = await pool.query(
        `SELECT
        s.Ticket_ID,
        s.User_ID,
        s.Package_ID,
        s.Issue_Type,
        If(s.Resolution_Note IS NOT NULL, s.Resolution_Note, '') AS Resolution_Note,
        s.Ticket_Status_Code

        FROM support_ticket s
        WHERE s.Assigned_Employee_Id = ?`,
        [employeeId]
        
    );
    return results;
}

module.exports = {getEmployeesRatios,getTicketsByEmployee}