// js/pages/customer/customer_home.js

function CustomerHome() {
  return (
    <Layout buttonLabel = "Logout" buttonHref = "/">
      {/* <Header buttonLabel="Logout" buttonHref="/" /> */}
      {/* ── PAGE TITLE ── */}
      <h2>Welcome to Post Office 8</h2>
      <p>What would you like to do today?</p>

      {/* ── NAVIGATION BUTTONS ── */}
      <div className="button-group">

        <button
          className="btn btn-a"
          onClick={() => window.location.href = '/Track my package'}
        >
          My Packages
        </button>

        <button
          className="btn btn-a"
          onClick={() => window.location.href = '/Store'}
        >
          Support Ticket
        </button>

        <button
          className="btn btn-a"
          onClick={() => window.location.href = '/submit a ticket'}
        >
          Profile
        </button>

         <button
          className="btn btn-a"
          onClick={() => window.location.href = '/customer-profile'}
        >
          Profile
        </button>

      </div>

    </Layout>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<CustomerHome />)