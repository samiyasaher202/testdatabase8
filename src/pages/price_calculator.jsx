import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './css/home.css'
import './css/price_calculator.css'
import skyline from '../assets/houston-skyline.jpeg'

const API_BASE = import.meta.env.VITE_API_URL || ''

export default function PriceCalculator() {
  const navigate = useNavigate()
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem('token'))

  const [packageType, setPackageType] = useState('')
  const [excessFee, setExcessFee] = useState('')
  const [weight, setWeight] = useState('')
  const [zone, setZone] = useState('')
  const [price, setPrice] = useState(null)
  const [error, setError] = useState(null)

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

  const fetchPrice = async () => {
    if (!packageType || !weight || !zone) {
      setError('Please select package type, weight, and zone.')
      return
    }
    setError(null)
    try {
      const qparams = new URLSearchParams({
        package_type: packageType,
        weight,
        zone,
      })
      if (excessFee) qparams.append('excess_fee', excessFee)

      const res = await fetch(`${API_BASE}/api/price?${qparams.toString()}`)
      const raw = await res.text()
      const ct = res.headers.get('content-type') || ''
      let data = {}
      if (raw && ct.includes('application/json')) {
        try {
          data = JSON.parse(raw)
        } catch {
          data = {}
        }
      }
      if (!res.ok) {
        throw new Error(data.error || data.message || raw || 'Failed to load price')
      }

      setPrice(data.Tot_Price)
    } catch (err) {
      setError(err.message || 'Could not calculate price.')
      setPrice(null)
    }
  }

  return (
    <div className="price-calculator-page">
      <header className="site-header">
        <div className="header-inner">
          <Link className="logo" to="/">
            National Postal Service
          </Link>
          <nav className="top-nav">
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/') }}>Home</a>
            {loggedIn ? (
              <>
                {localStorage.getItem('userType') === 'customer' && (
                  <a href="#" onClick={(e) => { e.preventDefault(); navigate('/customer_home') }}>
                    Customer Portal
                  </a>
                )}
                <a href="#" onClick={handleLogout}>Logout</a>
              </>
            ) : (
              <a href="#" onClick={(e) => { e.preventDefault(); navigate('/login') }}>Login</a>
            )}
          </nav>
        </div>
      </header>

      <main>
        <div className="price-calculator-hero">
          <img src={skyline} alt="" />
        </div>

        <div className="price-calculator-inner">
          <h2>Package price calculator</h2>
          <p className="price-calculator-subtitle">
            Enter weight, zone, and package type to estimate shipping cost.
          </p>

          <div className="price-calculator-card">
            <div className="form-field">
              <label htmlFor="pc-weight">Weight (lbs)</label>
              <input
                id="pc-weight"
                type="number"
                min="0"
                step="0.01"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="0"
              />
            </div>

            <div className="form-field">
              <label htmlFor="pc-zone">Zone</label>
              <select
                id="pc-zone"
                value={zone}
                onChange={(e) => setZone(e.target.value)}
              >
                <option value="">Select zone</option>
                {[...Array(9)].map((_, i) => (
                  <option key={i + 1} value={String(i + 1)}>
                    Zone {i + 1}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="pc-type">Package type</label>
              <select
                id="pc-type"
                value={packageType}
                onChange={(e) => setPackageType(e.target.value)}
              >
                <option value="">Select type</option>
                <option value="express">Express</option>
                <option value="general shipping">General shipping</option>
                <option value="oversized">Oversized</option>
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="pc-excess">Excess fee (optional)</label>
              <select
                id="pc-excess"
                value={excessFee}
                onChange={(e) => setExcessFee(e.target.value)}
              >
                <option value="">None</option>
                <option value="Fragile Handling">Fragile handling</option>
                <option value="Fuel Surcharge">Fuel surcharge</option>
                <option value="Hazardous Material">Hazardous material</option>
                <option value="Signature Required">Signature required</option>
              </select>
            </div>

            <button type="button" className="btn-calc" onClick={fetchPrice}>
              Calculate price
            </button>

            {error && <div className="price-calculator-error">{error}</div>}

            {price != null && !Number.isNaN(Number(price)) && (
              <div className="price-calculator-result">
                Estimated total: ${parseFloat(price).toFixed(2)}
              </div>
            )}
          </div>
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
