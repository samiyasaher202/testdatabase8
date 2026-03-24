// js/layouts/customer_layout.js

function CustomerLayout({ children }) {
  return (
    <div className="layout">

      {/* ── CUSTOMER HEADER ── */}
      <header className="header">
        <div className="header-inner">

          <a href="/" className="logo">
            <span className="logo-mark">✦</span>
            Post Office 8
          </a>

          <nav className="customer-nav">
            <button className="nav-btn" onClick={() => window.location.href = '/customer-packages'}>
              My Packages
            </button>
            <button className="nav-btn" onClick={() => window.location.href = '/customer-support'}>
              Support Ticket
            </button>
            <button className="nav-btn profile" onClick={() => window.location.href = '/customer-profile'}>
              Profile
            </button>
          </nav>

        </div>
      </header>

      {/* ── PAGE CONTENT ── */}
      <main className="main">
        {children}
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