// js/pages/home.js

function Home() {
  return (
    <Layout buttonLabel="Login" buttonHref="/login">

      <h2>Welcome to Post Office 8</h2>
      <p>Please select how you are logging in.</p>

      <div className="button-group">
        <button
          className="login-btn"
          onClick={() => window.location.href = '/customer-home'}
        >
          Customer
        </button>
      </div>

    </Layout>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<Home />)

// function Header({ buttonLabel = "Login", buttonHref = "/login" }) {
//   return (
//     <header className="header">
//       <div className="header-inner">
//         <div className="logo">
//           <span className="logo-mark">✦</span>
//           Post Office 8
//         </div>
//         <button
//           className="login-btn"
//           onClick={() => window.location.href = buttonHref}
//         >
//           {buttonLabel}
//         </button>
//       </div>
//     </header>
//   )
// }

// function Home() {
//   return (
//     <div className="layout">

//       {/* ── HEADER ── */}
//       <Header buttonLabel="Login" buttonHref="/login" />

//       {/* ── MAIN ── */}
//       <main className="main">
//         <h2>Welcome to Post Office 8</h2>
//         <p>Please select how you are logging in.</p>

//         <div className="button-group">
//           <button
//             className="login-btn"
//             onClick={() => window.location.href = '/customer-home'}
//           >
//             Customer
//           </button>
//         </div>
//       </main>

//       {/* ── FOOTER ── */}
//       <footer className="footer">
//         <div className="footer-inner">
//           <span className="footer-logo">Post Office 8</span>
//         </div>
//       </footer>

//     </div>
//   )
// }

// ReactDOM.createRoot(document.getElementById('root')).render(<Home />)