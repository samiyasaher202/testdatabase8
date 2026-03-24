// js/pages/home.js



function Home() {
  return (
    <div className="layout">

      {/* ── HEADER ── */}
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-mark">✦</span>
            Post Office 8
          </div>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main className="main" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>

        <h2>Welcome to Post Office 8</h2>
        <p>Please select how you are logging in</p>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>

          {/* ── Customer button only ── */}
          <button
            className="login-btn"
            onClick={() => window.location.href = '/customer-home'}
          >
            Customer
          </button>

        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer className="footer">
        <div className="footer-inner">
          <span className="footer-logo">Post Office 8</span>
          <span className="footer-copy">© 2026 — All rights reserved</span>
        </div>
      </footer>

    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<Home />)