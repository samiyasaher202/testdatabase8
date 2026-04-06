import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './css/home.css'
import './css/customer_home.css'
import './css/inventory.css'
import skyline from '../assets/houston-skyline.jpeg'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const LOW_STOCK = 15

export default function Inventory() {
  const navigate = useNavigate()
  const userType = localStorage.getItem('userType')

  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [locFilter, setLocFilter] = useState('')
  const [stockFilter, setStockFilter] = useState('')

  useEffect(() => {
    fetch(`${API_BASE}/api/inventory`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load inventory')
        return res.json()
      })
      .then((data) => {
        setInventory(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  function getLevel(qty) {
    if (qty === 0) return 'Out of Stock'
    if (qty <= LOW_STOCK) return 'Low Stock'
    return 'In Stock'
  }

  function stockBadgeClass(qty) {
    if (qty === 0) return 'out'
    if (qty <= LOW_STOCK) return 'low'
    return 'ok'
  }

  function stockBarClass(qty) {
    if (qty === 0) return 'out'
    if (qty <= LOW_STOCK) return 'low'
    return 'ok'
  }

  function handleLogout(e) {
    e.preventDefault()
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('userType')
    navigate('/')
  }

  const locations = [...new Set(inventory.map((i) => `${i.city}, ${i.state}`).filter(Boolean))]

  const filtered = inventory.filter((item) => {
    const q = search.toLowerCase()
    const matchSearch =
      (item.product_name || '').toLowerCase().includes(q) ||
      (item.upc || '').toLowerCase().includes(q) ||
      (item.city || '').toLowerCase().includes(q)
    const locStr = `${item.city}, ${item.state}`
    return (
      matchSearch &&
      (!locFilter || locStr === locFilter) &&
      (!stockFilter || getLevel(item.quantity) === stockFilter)
    )
  })

  const totalUnits = filtered.reduce((s, i) => s + (i.quantity || 0), 0)
  const outCount = filtered.filter((i) => i.quantity === 0).length
  const lowCount = filtered.filter((i) => i.quantity > 0 && i.quantity <= LOW_STOCK).length

  return (
    <div className={`inventory-page ${userType === 'customer' ? 'customer-home' : ''}`}>
      <header className="site-header">
        <div className="header-inner">
          <Link className="logo" to="/">
            National Postal Service
          </Link>
          <nav className="top-nav">
            {userType !== 'employee' && (
              <a href="#" onClick={(e) => { e.preventDefault(); navigate('/') }}>Home</a>
            )}

            {userType === 'employee' ? (
              <>
                <a href="#" onClick={(e) => { e.preventDefault(); navigate('/employee_home') }}>Dashboard</a>
                <a href="#" onClick={(e) => { e.preventDefault(); navigate('/package_list') }}>Packages</a>
                <span className="nav-current" aria-current="page">Inventory</span>
              </>
            ) : (
              <>
                <a href="#" onClick={(e) => { e.preventDefault(); navigate('/customer_home') }}>Dashboard</a>
                <a href="#" onClick={(e) => { e.preventDefault(); navigate('/customer_packages') }}>My packages</a>
                <span className="nav-current" aria-current="page">Store</span>
              </>
            )}

            {userType === 'customer' ? (
              <button type="button" className="customer-nav-logout" onClick={handleLogout}>
                Logout
              </button>
            ) : (
              <a href="#" onClick={handleLogout}>Logout</a>
            )}
          </nav>
        </div>
      </header>

      <main>
        <div className="inventory-hero">
          <img src={skyline} alt="" />
        </div>

        <div className="inventory-inner">
          <h2>Inventory</h2>
          <p className="inventory-subtitle">
            Browse products and stock levels across post office locations.
          </p>

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
                <span className="stat-num">{filtered.length}</span>
                <span className="stat-label">Products</span>
              </div>
              <div className="inventory-stat">
                <span className="stat-num delivered">{totalUnits.toLocaleString()}</span>
                <span className="stat-label">Total units</span>
              </div>
              <div className="inventory-stat">
                <span className="stat-num pending">{lowCount}</span>
                <span className="stat-label">Low stock</span>
              </div>
              <div className="inventory-stat">
                <span className="stat-num delayed">{outCount}</span>
                <span className="stat-label">Out of stock</span>
              </div>
            </div>
          )}

          <div className="inventory-controls">
            <input
              type="text"
              className="search-input"
              placeholder="Search product, UPC, city…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select className="filter-select" value={locFilter} onChange={(e) => setLocFilter(e.target.value)}>
              <option value="">All locations</option>
              {locations.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
            <select className="filter-select" value={stockFilter} onChange={(e) => setStockFilter(e.target.value)}>
              <option value="">All stock levels</option>
              <option value="In Stock">In stock</option>
              <option value="Low Stock">Low stock</option>
              <option value="Out of Stock">Out of stock</option>
            </select>
            <span className="inventory-result-count">
              {filtered.length} of {inventory.length} products
            </span>
          </div>

          {loading ? (
            <p className="inventory-state-msg">Loading inventory…</p>
          ) : filtered.length === 0 ? (
            <p className="inventory-state-msg">No products match your search.</p>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>UPC</th>
                    <th>Post office</th>
                    <th>Price</th>
                    <th>Stock level</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr key={`${item.post_office_id}-${item.upc}`}>
                      <td>
                        <div className="td-name">{item.product_name || '—'}</div>
                        <div className="td-sub">Store #{item.store_id}</div>
                      </td>
                      <td><code>{item.upc || '—'}</code></td>
                      <td>
                        <div className="td-name">{item.city}, {item.state}</div>
                        <div className="td-sub">{item.office_address}</div>
                      </td>
                      <td>
                        {item.price === 0 ? (
                          <span className="free-label">Free</span>
                        ) : (
                          `$${parseFloat(item.price).toFixed(2)}`
                        )}
                      </td>
                      <td>
                        <div className="stock-bar-wrap">
                          <div className="stock-bar-bg">
                            <div
                              className={`stock-bar-fill ${stockBarClass(item.quantity)}`}
                              style={{
                                width: `${Math.min((item.quantity / 500) * 100, 100)}%`,
                              }}
                            />
                          </div>
                          <span className="stock-bar-num">{item.quantity}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`inv-status-badge ${stockBadgeClass(item.quantity)}`}>
                          {getLevel(item.quantity)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="table-footer">
                Showing {filtered.length} of {inventory.length} records
              </div>
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
