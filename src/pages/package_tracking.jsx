import { useState, useEffect, useMemo } from 'react'
import { mergeRoutingWithDeliveredMilestone } from '../utils/deliveryMilestone'
import { Link, useNavigate } from 'react-router-dom'
import './css/home.css'
import './css/package_tracking.css'

// Prefer using VITE_API_URL if set; otherwise, in dev, use same-origin `/api` for Vite proxy; fallback to localhost in prod.
const API_BASE =
  import.meta.env.VITE_API_URL != null && String(import.meta.env.VITE_API_URL).trim() !== ''
    ? String(import.meta.env.VITE_API_URL).replace(/\/$/, '')
    : import.meta.env.DEV
      ? ''
      : 'http://localhost:5000'

export default function PackageTracking() {
  const navigate = useNavigate()
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem('token'))
  const [trackingNumber, setTrackingNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [results, setResults] = useState(null)
  const [packageData, setPackageData] = useState(null)
  const [routingEvents, setRoutingEvents] = useState([])
  const [routingNote, setRoutingNote] = useState(null)

  useEffect(() => {
    const onStorage = () => setLoggedIn(!!localStorage.getItem('token'))
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const handleLogout = (e) => {
    e.preventDefault()
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('userType')
    setLoggedIn(false)
    navigate('/')
  }

  const handleSearch = async () => {
    if (!trackingNumber.trim()) {
      setError('Please enter a tracking number')
      return
    }

    setLoading(true)
    setError(null)
    setResults(null)
    setPackageData(null)
    setRoutingEvents([])
    setRoutingNote(null)

    const id = encodeURIComponent(trackingNumber.trim())
    try {
      // const res = await fetch(`${API_BASE}/api/packages/track/${id}`)
      const res = await fetch(`${API_BASE}/api/packages/${id}/tracking`)
      const raw = await res.text()
      const contentType = res.headers.get('content-type') || ''
      let data = {}
      if (raw && contentType.includes('application/json')) {
        try {
          data = JSON.parse(raw)
        } catch {
          data = {}
        }
      }
      if (!res.ok) {
        throw new Error(data.error || data.message || raw || 'Failed to fetch tracking info')
      }

      const list = Array.isArray(data) ? data : [data]
      setResults(list)
      const pkgPayload =
        (Array.isArray(data)
          ? data.find((r) => r && r.Instance_Type === 'Delivery') ||
            data.find((r) => r && typeof r === 'object') ||
            data[0]
          : data) || null
      setPackageData(pkgPayload)

      try {
        const r2 = await fetch(`${API_BASE}/api/packages/track/${id}/routing-events`)
        const raw2 = await r2.text()
        let d2 = {}
        try {
          if (raw2) d2 = JSON.parse(raw2)
        } catch {
          d2 = {}
        }
        if (r2.ok && Array.isArray(d2.events)) {
          setRoutingEvents(d2.events)
          setRoutingNote(null)
        } else {
          setRoutingEvents([])
          setRoutingNote(d2.error || d2.message || null)
        }
      } catch {
        setRoutingEvents([])
        setRoutingNote('Routing timeline could not be loaded.')
      }
    } catch (err) {
      setError(err.message || 'Could not load tracking information')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch()
  }

  const displayRoutingEvents = useMemo(
    () => mergeRoutingWithDeliveredMilestone(routingEvents, packageData),
    [routingEvents, packageData]
  )

  function getStatusBadgeClass(status) {
    const s = (status || '').toLowerCase()
    if (s.includes('deliver')) return 'status-delivered'
    if (s.includes('transit') || s.includes('shipping')) return 'status-transit'
    if (s.includes('pending') || s.includes('processing')) return 'status-pending'
    if (s.includes('delay') || s.includes('exception')) return 'status-delayed'
    return 'status-default'
  }

  function statusBadge(status) {
    return (
      <span className={`status-badge ${getStatusBadgeClass(status)}`}>
        {status || 'Unknown'}
      </span>
    )
  }

  const shipments = (results || []).filter((r) => r?.Instance_Type === 'Shipment')
  const delivery = (results || []).find((r) => r?.Instance_Type === 'Delivery')
  return (
    <div className="tracking-page">
      <header className="site-header">
        <div className="header-inner">
          <Link className="logo" to="/">
            National Postal Service
          </Link>
          <nav className="top-nav">
            {loggedIn ? (
              <>
                {localStorage.getItem('userType') === 'customer' && (
                  <>
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
                  </>
                )}
                {localStorage.getItem('userType') === 'employee' && (
                  <>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        navigate('/employee_home')
                      }}
                    >
                      Employee Home
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
                    <span className="nav-current" aria-current="page">
                      Track a Package
                    </span>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        navigate('/profile')
                      }}
                    >
                      Profile
                    </a>
                  </>
                )}
                <a href="#" onClick={handleLogout}>
                  Logout
                </a>
              </>
            ) : (
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  navigate('/login')
                }}
              >
                Login
              </a>
            )}
          </nav>
        </div>
      </header>

      <main>
        <div className="tracking-hero">
          <img
            src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1600&q=80"
            alt=""
          />
        </div>

        <div className="tracking-content">
          <h2>Package tracking</h2>
          <p className="tracking-subtitle">
            Enter your tracking number to see status and delivery information.
          </p>

          <div className="tracking-search-card">
            <div className="tracking-controls">
              <input
                type="text"
                className="tracking-input"
                placeholder="Enter tracking number"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                type="button"
                className="tracking-track-btn"
                onClick={handleSearch}
                disabled={loading}
              >
                {loading ? 'Looking up…' : 'Track'}
              </button>
            </div>
          </div>

          {error && (
            <div className="tracking-error-banner">
              <span>{error}</span>
              {/* <button onClick={() => setError(null)}>✕</button> */}
              <button type="button" onClick={() => setError(null)} aria-label="Dismiss">
                ×
              </button>
            </div>
          )}

          {loading && <p className="state-msg">Looking up tracking number...</p>}

          {/* No results */}
          {results && results.length === 0 && (
            <p className="state-msg">
              No tracking information found for <code>{trackingNumber}</code>.
            </p>
          )}

          {shipments.length > 0 && (
            <>
              <h3 className="tracking-section-title">Package details</h3>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Shipment_ID</th>
                      <th>Status</th>
                      <th>From Address</th>
                      <th>To Address</th>
                      <th>Departed</th>
                      <th>Arrived</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shipments.map((s) => (
                      <tr key={s.Shipment_ID}>
                        <td>
                          <code>{s.Shipment_ID}</code>
                        </td>
                        <td>{statusBadge(s.Status_Name)}</td>
                        <td>{s.From_Full_Address || '—'}</td>
                        <td>{s.To_Full_Address || '—'}</td>
                        <td>
                          {s.Departure_Time_Stamp
                            ? new Date(s.Departure_Time_Stamp).toLocaleString()
                            : '—'}
                        </td>
                        <td>
                          {s.Arrival_Time_Stamp
                            ? new Date(s.Arrival_Time_Stamp).toLocaleString()
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          {delivery && (
            <>
              <h3 style={{ marginTop: '2rem' }}>Delivery</h3>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Delivery ID</th>
                      <th>Status</th>
                      <th>Delivered Date</th>
                      <th>Signature Received</th>
                      <th>Final</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <code>{delivery.Delivery_ID ?? delivery.Tracking_Number ?? '—'}</code>
                      </td>
                      <td>{statusBadge(delivery.Status_Name)}</td>
                      <td>
                        {delivery.Delivered_Date
                          ? new Date(delivery.Delivered_Date).toLocaleString()
                          : '—'}
                      </td>
                      <td>{delivery.Signature_Received || '—'}</td>
                      <td>{delivery.Is_Final_Status ? 'Yes' : 'No'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="tracking-detail-grid">
                <div className="tracking-detail-item">
                  <span className="tracking-detail-label">Sender</span>
                  <p>{packageData.Sender_Name || '—'}</p>
                </div>
                <div className="tracking-detail-item">
                  <span className="tracking-detail-label">Recipient</span>
                  <p>{packageData.Recipient_Name || '—'}</p>
                </div>
                {packageData.Delivered_Date && (
                  <div className="tracking-detail-item">
                    <span className="tracking-detail-label">Delivered</span>
                    <p>{new Date(packageData.Delivered_Date).toLocaleString()}</p>
                  </div>
                )}
              </div>

              <h3 className="tracking-section-title">Shipping activity</h3>
              {routingNote && (
                <p className="tracking-routing-note">{routingNote}</p>
              )}
              {displayRoutingEvents.length === 0 && (
                <p className="tracking-state-msg">
                  No route scans or delivery milestone logged yet for this package.
                </p>
              )}
              {displayRoutingEvents.length > 0 && (
                <ol className="tracking-routing-timeline">
                  {displayRoutingEvents.map((ev) => (
                    <li
                      key={ev.Event_ID < 0 ? `routing-synthetic-${ev.Event_Type}` : ev.Event_ID}
                      className="tracking-routing-item"
                    >
                      <div className="tracking-routing-time">
                        {ev.Event_Time ? new Date(ev.Event_Time).toLocaleString() : '—'}
                      </div>
                      <div className="tracking-routing-body">
                        <span className={`tracking-routing-badge tracking-routing-${ev.Event_Type}`}>
                          {ev.Event_Type === 'departure'
                            ? 'Departed'
                            : ev.Event_Type === 'delivered'
                              ? 'Delivered'
                              : 'Arrived'}
                        </span>
                        <span className="tracking-routing-office">{ev.Office_Label || ev.Street || '—'}</span>
                        <span className="tracking-routing-meta">
                          {ev.Shipment_ID != null && ev.Shipment_ID !== ''
                            ? `Shipment #${ev.Shipment_ID}`
                            : 'Delivery'}
                        </span>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </>
          )}
          {!loading && !results && !error && (
            <div className="tracking-state-msg">Enter a tracking number above to get started.</div>
          )}
        </div>
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <span>© {new Date().getFullYear()} National Postal Service</span>
          <span className="footer-links">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Support</a>
          </span>
        </div>
      </footer>
    </div>
  )
}