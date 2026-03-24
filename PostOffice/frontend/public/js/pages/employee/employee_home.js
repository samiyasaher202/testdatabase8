// js/pages/employee/employee_home.js

function EmployeeHome() {
  return (
    <Layout buttonLabel = "Logout" buttonHref = "/">

      {/* ── PAGE TITLE ── */}
      <h2>Welcome to Post Office 8</h2>
      <p>What would you like to do today?</p>
      

      {/* ── NAVIGATION BUTTONS ── */}
      <div className="button-group">

        <button
          className="btn"
          onClick={() => window.location.href = '/Profile'}
        >
          Profile
        </button>

        <button
          className="btn"
          onClick={() => window.location.href = '/Store'}
        >
          Stock
        </button>

        <button
          className="btn"
          onClick={() => window.location.href = '/support_tickets'}
        >
          Support Tickets
        </button>

         <button
          className="btn"
          onClick={() => window.location.href = '/packages'}
        >
          Packages
        </button>

        <button
          className="btn"
          onClick={() => window.location.href = '/package_tracking'}
        >
          Package Lookup
        </button>

        <button
          className="btn"
          onClick={() => window.location.href = '/package_history'}
        >
          Package History
        </button>

        <button
          className="btn"
          onClick={() => window.location.href = '/ship_package'}
        >
          Ship Package
        </button>

         <button
          className="btn"
          onClick={() => window.location.href = '/customers'}
        >
          Customers
        </button>

      </div>

    </Layout>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<EmployeeHome />)