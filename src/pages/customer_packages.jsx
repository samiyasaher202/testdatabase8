import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './css/home.css'
import './css/customer_home.css'
import './css/inventory.css'
import skyline from '../assets/houston-skyline.jpeg'
import { authFetch } from '../authFetch'

function getStatusBadgeClass(status) {
  const s = (status || '').toLowerCase()
  if (s.includes('lost')) return 'status-delayed'
  if (s.includes('deliver')) return 'status-delivered'
  if (s.includes('transit') || s.includes('shipping')) return 'status-transit'
  if (s.includes('pending') || s.includes('processing')) return 'status-pending'
  if (s.includes('delay') || s.includes('exception')) return 'status-delayed'
  return 'status-default'
}

export default function CustomerPackages() {
  const navigate = useNavigate()
  const [rows, setRows] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    ;(async () => {
      try {
        const [resPkg, resAlerts] = await Promise.all([
          authFetch('/api/customer/my-packages'),
          authFetch('/api/customer/my-package-alerts'),
        ])

        if (resPkg.status === 401 || resAlerts.status === 401) {
          navigate('/login')
          return
        }

        if (!resPkg.ok) {
          const t = await resPkg.text().catch(() => '')
          throw new Error(t || 'Failed to load packages')
        }

        const data = await resPkg.json().catch(() => [])
        if (!cancelled) setRows(Array.isArray(data) ? data : [])

        if (resAlerts.ok) {
          const a = await resAlerts.json().catch(() => ({}))
          if (!cancelled) setAlerts(Array.isArray(a.alerts) ? a.alerts : [])
        } else {
          if (!cancelled) setAlerts([])
        }
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Could not load data')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [navigate])

  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('userType')
    navigate('/')
  }

  return (
    <div className="customer-home inventory-page">
      <header className="site-header">
        <div className="header-inner">
          <Link className="logo" to="/">
            National Postal Service
          </Link>
          <nav className="top-nav">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                navigate('/customer_home')
              }}
            >
              Customer Home
            </a>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                navigate('/price_calculator')
              }}
            >
              Calculator
            </a>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                navigate('/customer_profile')
              }}
            >
              Profile
            </a>
            <a href="#" onClick={handleLogout}>
              Logout
            </a>
          </nav>
        </div>
      </header>

      <main>
        <div className="inventory-hero">
          <img src={skyline} alt="" />
        </div>

        <div className="inventory-inner">
          <h2>My packages</h2>

          {error && (
            <div className="inventory-error">
              <span>{error}</span>
              <button
                type="button"
                onClick={() => setError(null)}
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
          )}

          {!loading && alerts.length > 0 && (
            <div
              className="customer-alerts-panel"
              role="region"
              aria-label="Package notifications"
            >
              <h3>Important package notices</h3>
              <ul>
                {alerts.map((a) => (
                  <li key={a.Alert_ID}>
                    <code>{a.Tracking_Number}</code>
                    {' — '}
                    {a.Message_Text}
                    {a.Created_At && (
                      <span className="customer-alert-meta">
                        {new Date(a.Created_At).toLocaleString()}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {loading ? (
            <p className="inventory-state-msg">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="inventory-state-msg">No packages yet.</p>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Tracking #</th>
                    <th>Role</th>
                    <th>Type</th>
                    <th>Weight</th>
                    <th>Zone</th>
                    <th>Price</th>
                    <th>Days at post office</th>
                    <th>Late fee</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => (
                    <tr key={p.Tracking_Number}>
                      <td>
                        <code>{p.Tracking_Number}</code>
                      </td>
                      <td>{p.role || '—'}</td>
                      <td>{p.Package_Type_Code}</td>
                      <td>{p.Weight} lbs</td>
                      <td>{p.Zone}</td>
                      <td>${parseFloat(p.Price || 0).toFixed(2)}</td>
                      <td>
                        {p.Days_At_Post_Office != null
                          ? `${p.Days_At_Post_Office} day${
                              p.Days_At_Post_Office === 1 ? '' : 's'
                            }`
                          : '—'}
                      </td>
                      <td>
                        {p.Late_Fee_Due != null
                          ? `$${parseFloat(p.Late_Fee_Due).toFixed(2)}`
                          : '—'}
                      </td>
                      <td>
                        <span
                          className={`status-badge ${getStatusBadgeClass(
                            p.Status_Name
                          )}`}
                        >
                          {p.Status_Name || '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <span>© {new Date().getFullYear()} National Postal Service</span>
        </div>
      </footer>
    </div>
  )
}