// js/layouts/layout.js

function Layout({ children, buttonLabel = "Login", buttonHref = "/login", width = "default" }) {
  return (
    <div className="layout">

      {/* ── HEADER ── */}
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-mark">✦</span>
            Post Office 8
          </div>
          <button
            className="login-btn"
            onClick={() => window.location.href = buttonHref}
          >
            {buttonLabel}
          </button>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main className={`main main--${width}`}>
        {children}
      </main>

      {/* ── FOOTER ── */}
      <footer className="footer">
        <div className="footer-inner">
          <span className="footer-logo">Post Office 8</span>
        </div>
      </footer>

    </div>
  )
}