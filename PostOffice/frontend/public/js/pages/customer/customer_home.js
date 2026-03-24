// js/pages/customer/customer_home.js

function CustomerHome() {
  return (
    <Layout buttonLabel = "Logout" buttonHref = "/">
      
      {/* ── PAGE TITLE ── */}
      <h2>Welcome to Post Office 8</h2>
      <p>What would you like to do today?</p>

      {/* ── NAVIGATION BUTTONS ── */}
      <div className="button-group">

        <button
          className="btn"
          onClick={() => window.location.href = '/packages'}
        >
          My Packages
        </button>

        <button
          className="btn"
          onClick={() => window.location.href = '/package_tacking'}
        >
           Track Package
        </button>

        <button
          className="btn"
          onClick={() => window.location.href = '/Store'}
        >
          Store
        </button>

        <button
          className="btn"
          onClick={() => window.location.href = '/submit_ticket'}
        >
          Submit Support Ticket
        </button>

         <button
          className="btn"
          onClick={() => window.location.href = '/customer_profile'}
        >
          Profile
        </button>

      </div>

    </Layout>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<CustomerHome />)