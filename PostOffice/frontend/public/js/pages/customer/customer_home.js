// js/pages/customer/customer_home.js

function CustomerHome() {
  return (
    <CustomerLayout>

      {/* ── PAGE TITLE ── */}
      <h2>Welcome to Post Office 8</h2>
      <p>What would you like to do today?</p>

      {/* ── NAVIGATION BUTTONS ── */}
      <div className="button-group">

        <button
          className="btn btn-a"
          onClick={() => window.location.href = '/customer-packages'}
        >
          My Packages
        </button>

        <button
          className="btn btn-b"
          onClick={() => window.location.href = '/customer-support'}
        >
          Support Ticket
        </button>

        <button
          className="btn btn-c"
          onClick={() => window.location.href = '/customer-profile'}
        >
          Profile
        </button>

      </div>

    </CustomerLayout>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<CustomerHome />)