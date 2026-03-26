// js/pages/home.js

function Home() {
  return (
    <Layout buttonLabel="Login" buttonHref="/login">

     {/* ── PAGE TITLE ── */}
      <h2>Welcome to Post Office 8</h2>
      <p>Please select how you are logging in.</p>

    {/* ── NAVIGATION BUTTONS ── 
    
    TEMPORARY: Using to test other pages directing. Will be routed through login once set up*/}
      <div className="button-group">
        <button
          className="btn"
          onClick={() => window.location.href = '/customer_home'}
        >
          Customer
        </button>
        <button
          className="btn"
          onClick={() => window.location.href = '/employee_home'}
        >
          Employee
        </button>
      </div>

    </Layout>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<Home />)