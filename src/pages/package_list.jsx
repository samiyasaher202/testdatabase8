import { useState, useEffect, Fragment } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './css/home.css'
import './css/customer_home.css'
import './css/inventory.css'
import './css/package_list.css'
import skyline from '../assets/houston-skyline.jpeg'
import { authFetch } from '../authFetch'

function getStatusBadgeClass(status) {
  const s = (status || '').toLowerCase()
  if (s.includes('deliver')) return 'status-delivered'
  if (s.includes('picked up')) return 'status-delivered'
  if (s.includes('disposed')) return 'status-delivered'
  if (s.includes('at office')) return 'status-pending'
  if (s.includes('transit') || s.includes('shipping')) return 'status-transit'
  if (s.includes('pending') || s.includes('processing')) return 'status-pending'
  if (s.includes('delay') || s.includes('exception')) return 'status-delayed'
  return 'status-default'
}

export default function AllPackages() {
  const navigate = useNavigate()
  const userType = localStorage.getItem('userType')

  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [filterValue, setFilterValue] = useState('')
  const [sortValue, setSortValue] = useState('')
  const [expanded, setExpanded] = useState(null)
  const [statusCodes, setStatusCodes] = useState([])
  const [statusUpdating, setStatusUpdating] = useState(null)

  useEffect(() => {
    authFetch('/api/packages')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load packages')
        return res.json()
      })
      .then((data) => {
        setPackages(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (userType !== 'employee') return
    authFetch('/api/status-codes')
      .then((r) => {
        if (!r.ok) throw new Error('status codes')
        return r.json()
      })
      .then(setStatusCodes)
      .catch(() => setStatusCodes([]))
  }, [userType])

  async function handleStatusChange(trackingNumber, statusCodeStr) {
    setStatusUpdating(trackingNumber)
    setError(null)
    try {
      const res = await authFetch(
        `/api/employee/packages/${encodeURIComponent(trackingNumber)}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status_code: Number(statusCodeStr) }),
        }
      )
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || 'Could not update status')
      const code = Number(statusCodeStr)
      setPackages((prev) => {
        const name = statusCodes.find((s) => s.Status_Code === code)?.Status_Name
        return prev.map((row) =>
          row.Tracking_Number === trackingNumber
            ? { ...row, Delivery_Status_Code: code, Status_Name: name ?? row.Status_Name }
            : row
        )
      })
    } catch (err) {
      setError(err.message || 'Status update failed')
    } finally {
      setStatusUpdating(null)
    }
  }

  let filtered = packages.filter((p) => {
    const q = search.toLowerCase()
    const matchSearch =
      (p.Tracking_Number || '').toLowerCase().includes(q) ||
      (p.Package_Type_Code || '').toLowerCase().includes(q) ||
      String(p.Zone || '').includes(q)
    const matchFilter =
      !filterValue ||
      (filterValue === 'oversize' && p.Oversize === 1) ||
      (filterValue === 'signature' && p.Requires_Signature === 1)
    return matchSearch && matchFilter
  })

  if (sortValue === 'weight_asc') filtered = [...filtered].sort((a, b) => a.Weight - b.Weight)
  if (sortValue === 'weight_desc') filtered = [...filtered].sort((a, b) => b.Weight - a.Weight)
  if (sortValue === 'price_asc') filtered = [...filtered].sort((a, b) => a.Price - b.Price)
  if (sortValue === 'price_desc') filtered = [...filtered].sort((a, b) => b.Price - a.Price)

  function toggleExpand(trackingNumber) {
    setExpanded(expanded === trackingNumber ? null : trackingNumber)
  }

  function handleLogout(e) {
    e.preventDefault()
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('userType')
    navigate('/')
  }

  return (
    <div className={`inventory-page package-list-page ${userType === 'customer' ? 'customer-home' : ''}`}>
      <header className="site-header">
        <div className="header-inner">
          <Link className="logo" to="/">
            National Postal Service
          </Link>
          <nav className="top-nav">
            {userType !== 'employee' && (
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  navigate('/')
                }}
              >
                Home
              </a>
            )}

            {userType === 'employee' ? (
              <>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    navigate('/employee_home')
                  }}
                >
                  Dashboard
                </a>
                <span className="nav-current" aria-current="page">
                  Packages
                </span>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    navigate('/inventory')
                  }}
                >
                  Inventory
                </a>
              </>
            ) : (
              <>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    navigate('/customer_home')
                  }}
                >
                  Dashboard
                </a>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    navigate('/customer_packages')
                  }}
                >
                  My packages
                </a>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    navigate('/inventory')
                  }}
                >
                  Store
                </a>
                <span className="nav-current" aria-current="page">
                  Packages
                </span>
              </>
            )}

            {userType === 'customer' ? (
              <button type="button" className="customer-nav-logout" onClick={handleLogout}>
                Logout
              </button>
            ) : (
              <a href="#" onClick={handleLogout}>
                Logout
              </a>
            )}
          </nav>
        </div>
      </header>

      <main>
        <div className="inventory-hero">
          <img src={skyline} alt="" />
        </div>

        <div className="inventory-inner">
          <h2>All packages</h2>
          <p className="inventory-subtitle">Search, filter, and inspect package records across the network.</p>

          {error && (
            <div className="inventory-error">
              <span>{error}</span>
              <button type="button" onClick={() => setError(null)} aria-label="Dismiss">
                ×
              </button>
            </div>
          )}

          {!loading && (
            <div className="inventory-stats">
              <div className="inventory-stat">
                <span className="stat-num">{packages.length}</span>
                <span className="stat-label">Total</span>
              </div>
              <div className="inventory-stat">
                <span className="stat-num delivered">
                  {packages.filter((p) => (p.Status_Name || '').toLowerCase().includes('deliver')).length}
                </span>
                <span className="stat-label">Delivered</span>
              </div>
              <div className="inventory-stat">
                <span className="stat-num transit">
                  {packages.filter((p) => (p.Status_Name || '').toLowerCase().includes('transit')).length}
                </span>
                <span className="stat-label">In transit</span>
              </div>
              <div className="inventory-stat">
                <span className="stat-num pending">
                  {packages.filter((p) => (p.Status_Name || '').toLowerCase().includes('pending')).length}
                </span>
                <span className="stat-label">Pending</span>
              </div>
            </div>
          )}

          <div className="inventory-controls">
            <input
              type="text"
              className="search-input"
              placeholder="Search tracking #, type, zone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select className="filter-select" value={filterValue} onChange={(e) => setFilterValue(e.target.value)}>
              <option value="">All packages</option>
              <option value="oversize">Oversize only</option>
              <option value="signature">Requires signature</option>
            </select>
            <select className="filter-select" value={sortValue} onChange={(e) => setSortValue(e.target.value)}>
              <option value="">Sort: default</option>
              <option value="weight_asc">Weight (low → high)</option>
              <option value="weight_desc">Weight (high → low)</option>
              <option value="price_asc">Price (low → high)</option>
              <option value="price_desc">Price (high → low)</option>
            </select>
            <span className="inventory-result-count">
              {filtered.length} of {packages.length} packages
            </span>
          </div>

          {loading ? (
            <p className="inventory-state-msg">Loading packages…</p>
          ) : filtered.length === 0 ? (
            <p className="inventory-state-msg">No packages match your search.</p>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Tracking #</th>
                    <th>Type</th>
                    <th>Weight</th>
                    <th>Zone</th>
                    <th>Price</th>
                    <th>Oversize</th>
                    <th>Sig. required</th>
                    <th>Created</th>
                    <th>Status</th>
                    <th aria-label="Expand" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <Fragment key={p.Tracking_Number}>
                      <tr>
                        <td>
                          <code>{p.Tracking_Number}</code>
                        </td>
                        <td>{p.Package_Type_Code}</td>
                        <td>{p.Weight} lbs</td>
                        <td>{p.Zone}</td>
                        <td>${parseFloat(p.Price || 0).toFixed(2)}</td>
                        <td>{p.Oversize ? 'Yes' : 'No'}</td>
                        <td>{p.Requires_Signature ? 'Yes' : 'No'}</td>
                        <td>{p.Date_Created ? new Date(p.Date_Created).toLocaleDateString() : '—'}</td>
                        <td>
                          {userType === 'employee' && statusCodes.length > 0 && p.Delivery_Status_Code != null ? (
                            <select
                              className="pkg-status-select"
                              aria-label={`Status for ${p.Tracking_Number}`}
                              value={String(p.Delivery_Status_Code)}
                              onChange={(e) => handleStatusChange(p.Tracking_Number, e.target.value)}
                              disabled={statusUpdating === p.Tracking_Number || !!p.Is_Final_Status}
                            >
                              {statusCodes.map((s) => (
                                <option key={s.Status_Code} value={String(s.Status_Code)}>
                                  {s.Status_Name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className={`status-badge ${getStatusBadgeClass(p.Status_Name)}`}>
                              {p.Status_Name || '—'}
                            </span>
                          )}
                        </td>
                        <td>
                          <button type="button" className="pkg-expand-btn" onClick={() => toggleExpand(p.Tracking_Number)}>
                            {expanded === p.Tracking_Number ? '▲ Hide' : '▼ More'}
                          </button>
                        </td>
                      </tr>

                      {expanded === p.Tracking_Number && (
                        <tr className="detail-row">
                          <td colSpan={10}>
                            <div className="detail-grid">
                              <div className="detail-item">
                                <label>Dimensions</label>
                                <p>
                                  {p.Dim_X}&quot; × {p.Dim_Y}&quot; × {p.Dim_Z}&quot;
                                </p>
                              </div>
                              <div className="detail-item">
                                <label>Sender ID</label>
                                <p>{p.Sender_ID ?? '—'}</p>
                              </div>
                              <div className="detail-item">
                                <label>Recipient ID</label>
                                <p>{p.Recipient_ID ?? '—'}</p>
                              </div>
                              <div className="detail-item">
                                <label>Date updated</label>
                                <p>{p.Date_Updated ? new Date(p.Date_Updated).toLocaleDateString() : '—'}</p>
                              </div>
                              <div className="detail-item">
                                <label>Final status</label>
                                <p>{p.Is_Final_Status ? 'Final' : 'In progress'}</p>
                              </div>
                              <div className="detail-item">
                                <label>Delivered date</label>
                                <p>{p.Delivered_Date ? new Date(p.Delivered_Date).toLocaleDateString() : '—'}</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
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