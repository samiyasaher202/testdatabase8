import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './css/home.css'
import './css/customer_home.css'
import './css/inventory.css'
import skyline from '../assets/houston-skyline.jpeg'
import { authFetch } from '../authFetch'

const LOW_STOCK = 15

export default function Inventory() {
  const navigate = useNavigate()
  const userType = localStorage.getItem('userType')
  const isEmployee = userType === 'employee'

  const [editingKey, setEditingKey] = useState(null) // e.g. "STOREID:UPC"
  const [editingQty, setEditingQty] = useState('')
  const [saving, setSaving] = useState(false)
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [locFilter, setLocFilter] = useState('')
  const [stockFilter, setStockFilter] = useState('')

  useEffect(() => {
    authFetch('/api/inventory')
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

  async function saveQuantity(item) {
    const storeId = item.store_id
    const upc = item.upc
    const qty = Number(editingQty)

    if (!Number.isInteger(qty) || qty < 0) {
      setError('Quantity must be a whole number 0 or greater.')
      return
    }

    setSaving(true)
    setError(null)
    try {
      const res = await authFetch(
        `/api/inventory/${storeId}/${encodeURIComponent(upc)}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ quantity: qty }),
        }
      )

      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.message || 'Failed to update stock')

      // update local UI
      setInventory((prev) =>
        prev.map((p) =>
          p.store_id === storeId && p.upc === upc ? { ...p, quantity: qty } : p
        )
      )

      setEditingKey(null)
      setEditingQty('')
    } catch (e) {
      setError(String(e?.message || e))
    } finally {
      setSaving(false)
    }
  }

  const locations = [
    ...new Set(inventory.map((i) => `${i.city}, ${i.state}`).filter(Boolean)),
  ]

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
  const lowCount = filtered.filter(
    (i) => i.quantity > 0 && i.quantity <= LOW_STOCK
  ).length

  return (
    <div
      className={`inventory-page ${
        userType === 'customer' ? 'customer-home' : ''
      }`}
    >
      <header className="site-header">
        <div className="header-inner">
          <Link className="logo" to="/"> National Postal Service</Link>
          <nav className="top-nav">
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/employee_home') }}>Employee Home</a>
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/price_calculator') }}>Calculator</a>
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/package_tracking') }}>Track a Package</a>
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/profile') }}>Profile</a>
            <a href="#" onClick={handleLogout}>Logout</a>
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
              <button
                type="button"
                onClick={() => setError(null)}
                aria-label="Dismiss"
              >
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
                <span className="stat-num delivered">
                  {totalUnits.toLocaleString()}
                </span>
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
            <select
              className="filter-select"
              value={locFilter}
              onChange={(e) => setLocFilter(e.target.value)}
            >
              <option value="">All locations</option>
              {locations.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
            <select
              className="filter-select"
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
            >
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
                    {isEmployee && <th style={{ width: 220 }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => {
                    const key = `${item.store_id}:${item.upc}`
                    const isEditing = editingKey === key

                    return (
                      <tr key={`${item.post_office_id}-${item.upc}`}>
                        <td>
                          <div className="td-name">
                            {item.product_name || '—'}
                          </div>
                          <div className="td-sub">Store #{item.store_id}</div>
                        </td>

                        <td>
                          <code>{item.upc || '—'}</code>
                        </td>

                        <td>
                          <div className="td-name">
                            {item.city}, {item.state}
                          </div>
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
                                className={`stock-bar-fill ${stockBarClass(
                                  item.quantity
                                )}`}
                                style={{
                                  width: `${Math.min(
                                    (item.quantity / 500) * 100,
                                    100
                                  )}%`,
                                }}
                              />
                            </div>

                            {isEmployee && isEditing ? (
                              <input
                                type="number"
                                min="0"
                                step="1"
                                value={editingQty}
                                onChange={(e) => setEditingQty(e.target.value)}
                                style={{ width: 90 }}
                                disabled={saving}
                              />
                            ) : (
                              <span className="stock-bar-num">
                                {item.quantity}
                              </span>
                            )}
                          </div>
                        </td>

                        <td>
                          <span
                            className={`inv-status-badge ${stockBadgeClass(
                              item.quantity
                            )}`}
                          >
                            {getLevel(item.quantity)}
                          </span>
                        </td>

                        {isEmployee && (
                          <td>
                            {!isEditing ? (
                              <button
                                type="button"
                                className="button"
                                onClick={() => {
                                  setError(null)
                                  setEditingKey(key)
                                  setEditingQty(String(item.quantity ?? 0))
                                }}
                              >
                                Edit stock
                              </button>
                            ) : (
                              <div style={{ display: 'flex', gap: 8 }}>
                                <button
                                  type="button"
                                  className="button"
                                  onClick={() => saveQuantity(item)}
                                  disabled={saving}
                                >
                                  {saving ? 'Saving…' : 'Save'}
                                </button>
                                <button
                                  type="button"
                                  className="button"
                                  onClick={() => {
                                    setEditingKey(null)
                                    setEditingQty('')
                                    setError(null)
                                  }}
                                  disabled={saving}
                                >
                                  Cancel
                                </button>
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    )
                  })}
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