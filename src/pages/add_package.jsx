import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './css/home.css'
import './css/employee_home.css'
import './css/add_package.css'
import skyline from '../assets/houston-skyline.jpeg'

const API_BASE = import.meta.env.VITE_API_URL || ''

const emptyAddr = () => ({
  house_number: '',
  street: '',
  city: '',
  state: '',
  zip_first3: '',
  zip_last2: '',
  apt_number: '',
})

export default function AddPackage() {
  const navigate = useNavigate()
  const token = localStorage.getItem('token')

  const [senderEmail, setSenderEmail] = useState('')
  const [senderFirst, setSenderFirst] = useState('')
  const [senderLast, setSenderLast] = useState('')
  const [senderPhone, setSenderPhone] = useState('')
  const [senderAddr, setSenderAddr] = useState(emptyAddr)

  const [recipientEmail, setRecipientEmail] = useState('')
  const [recipientFirst, setRecipientFirst] = useState('')
  const [recipientLast, setRecipientLast] = useState('')
  const [recipientPhone, setRecipientPhone] = useState('')
  const [recipientAddr, setRecipientAddr] = useState(emptyAddr)

  const [packageType, setPackageType] = useState('')
  const [excessFee, setExcessFee] = useState('')
  const [weight, setWeight] = useState('')
  const [zone, setZone] = useState('')
  const [dimX, setDimX] = useState('12')
  const [dimY, setDimY] = useState('10')
  const [dimZ, setDimZ] = useState('8')

  const [quotedPrice, setQuotedPrice] = useState(null)
  const [submitResult, setSubmitResult] = useState(null)
  const [error, setError] = useState(null)
  const [loadingQuote, setLoadingQuote] = useState(false)
  const [loadingPay, setLoadingPay] = useState(false)

  function handleLogout(e) {
    e.preventDefault()
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('userType')
    navigate('/')
  }

  async function calculatePrice() {
    if (!packageType || !weight || !zone) {
      setError('Select package type, weight, and zone.')
      return
    }
    setError(null)
    setLoadingQuote(true)
    try {
      const q = new URLSearchParams({
        package_type: packageType,
        weight: String(weight),
        zone: String(zone),
      })
      if (excessFee) q.append('excess_fee', excessFee)
      const res = await fetch(`${API_BASE}/api/price?${q}`)
      const raw = await res.text()
      let data = {}
      try {
        data = raw ? JSON.parse(raw) : {}
      } catch {
        data = { error: raw ? raw.slice(0, 240) : `HTTP ${res.status}` }
      }
      if (!res.ok) {
        throw new Error(
          data.error ||
            data.message ||
            (res.status === 502 ? 'Backend server is not running (start the API on port 5000).' : '') ||
            `Could not calculate price (${res.status})`
        )
      }
      setQuotedPrice(data.Tot_Price)
    } catch (err) {
      setError(err.message || 'Quote failed')
      setQuotedPrice(null)
    } finally {
      setLoadingQuote(false)
    }
  }

  async function payAndCreate() {
    setError(null)
    setSubmitResult(null)

    if (!senderEmail.trim() || !senderFirst.trim() || !senderLast.trim()) {
      setError('Sender email and name are required.')
      return
    }
    if (!recipientFirst.trim() || !recipientLast.trim()) {
      setError('Recipient name is required.')
      return
    }
    const sa = senderAddr
    const ra = recipientAddr
    if (!sa.house_number || !sa.street || !sa.city || !sa.state || !sa.zip_first3 || !sa.zip_last2) {
      setError('Complete the sender address (including ZIP).')
      return
    }
    if (!ra.house_number || !ra.street || !ra.city || !ra.state || !ra.zip_first3 || !ra.zip_last2) {
      setError('Complete the recipient address (including ZIP).')
      return
    }
    if (!packageType || !weight || !zone) {
      setError('Package type, weight, and zone are required.')
      return
    }

    setLoadingPay(true)
    try {
      const body = {
        sender_email: senderEmail.trim(),
        sender_first_name: senderFirst.trim(),
        sender_last_name: senderLast.trim(),
        sender_phone: senderPhone || null,
        sender_house_number: sa.house_number,
        sender_street: sa.street,
        sender_city: sa.city,
        sender_state: sa.state,
        sender_zip_first3: sa.zip_first3,
        sender_zip_last2: sa.zip_last2,
        sender_apt_number: sa.apt_number || null,
        sender_country: 'USA',
        recipient_email: recipientEmail.trim() || null,
        recipient_first_name: recipientFirst.trim(),
        recipient_last_name: recipientLast.trim(),
        recipient_phone: recipientPhone || null,
        recipient_house_number: ra.house_number,
        recipient_street: ra.street,
        recipient_city: ra.city,
        recipient_state: ra.state,
        recipient_zip_first3: ra.zip_first3,
        recipient_zip_last2: ra.zip_last2,
        recipient_apt_number: ra.apt_number || null,
        recipient_country: 'USA',
        package_type: packageType,
        weight: Number(weight),
        zone: Number(zone),
        excess_fee: excessFee || null,
        dim_x: dimX ? Number(dimX) : undefined,
        dim_y: dimY ? Number(dimY) : undefined,
        dim_z: dimZ ? Number(dimZ) : undefined,
      }

      const res = await fetch(`${API_BASE}/api/employee/packages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || 'Could not create package')

      setSubmitResult(data)
      setQuotedPrice(data.price)
    } catch (err) {
      setError(err.message || 'Payment failed')
    } finally {
      setLoadingPay(false)
    }
  }

  return (
    <div className="employee-home add-package-page">
      <header className="site-header">
        <div className="header-inner">
          <Link className="logo" to="/">
            National Postal Service
          </Link>
          <nav className="top-nav">
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/employee_home') }}>Dashboard</a>
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/package_list') }}>Packages</a>
            <a href="#" onClick={handleLogout}>Logout</a>
          </nav>
        </div>
      </header>

      <main>
        <div className="employee-hero">
          <img src={skyline} alt="" />
        </div>

        <div className="add-package-inner">
          <h2>Add package</h2>
         
          <div className="add-package-section">
            <h3>Sender (customer)</h3>
            <div className="add-package-grid">
              <div className="form-field">
                <label htmlFor="ap-s-email">Email</label>
                <input
                  id="ap-s-email"
                  type="email"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  placeholder="customer@example.com"
                  autoComplete="off"
                />
              </div>
              <div className="form-field">
                <label htmlFor="ap-s-fn">First name</label>
                <input id="ap-s-fn" value={senderFirst} onChange={(e) => setSenderFirst(e.target.value)} />
              </div>
              <div className="form-field">
                <label htmlFor="ap-s-ln">Last name</label>
                <input id="ap-s-ln" value={senderLast} onChange={(e) => setSenderLast(e.target.value)} />
              </div>
              <div className="form-field">
                <label htmlFor="ap-s-ph">Phone (optional)</label>
                <input id="ap-s-ph" value={senderPhone} onChange={(e) => setSenderPhone(e.target.value)} />
              </div>
              <div className="form-field">
                <label htmlFor="ap-s-hn">House #</label>
                <input
                  id="ap-s-hn"
                  value={senderAddr.house_number}
                  onChange={(e) => setSenderAddr({ ...senderAddr, house_number: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label htmlFor="ap-s-st">Street</label>
                <input
                  id="ap-s-st"
                  value={senderAddr.street}
                  onChange={(e) => setSenderAddr({ ...senderAddr, street: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label htmlFor="ap-s-city">City</label>
                <input
                  id="ap-s-city"
                  value={senderAddr.city}
                  onChange={(e) => setSenderAddr({ ...senderAddr, city: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label htmlFor="ap-s-state">State</label>
                <input
                  id="ap-s-state"
                  value={senderAddr.state}
                  onChange={(e) => setSenderAddr({ ...senderAddr, state: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label htmlFor="ap-s-z3">ZIP first 3</label>
                <input
                  id="ap-s-z3"
                  maxLength={3}
                  value={senderAddr.zip_first3}
                  onChange={(e) => setSenderAddr({ ...senderAddr, zip_first3: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label htmlFor="ap-s-z2">ZIP last 2</label>
                <input
                  id="ap-s-z2"
                  maxLength={2}
                  value={senderAddr.zip_last2}
                  onChange={(e) => setSenderAddr({ ...senderAddr, zip_last2: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label htmlFor="ap-s-apt">Apt (optional)</label>
                <input
                  id="ap-s-apt"
                  value={senderAddr.apt_number}
                  onChange={(e) => setSenderAddr({ ...senderAddr, apt_number: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="add-package-section">
            <h3>Recipient</h3>
            <p className="add-package-hint">Leave email blank only if the recipient does not have one; a placeholder account is created for routing.</p>
            <div className="add-package-grid">
              <div className="form-field">
                <label htmlFor="ap-r-email">Email</label>
                <input
                  id="ap-r-email"
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div className="form-field">
                <label htmlFor="ap-r-fn">First name</label>
                <input id="ap-r-fn" value={recipientFirst} onChange={(e) => setRecipientFirst(e.target.value)} />
              </div>
              <div className="form-field">
                <label htmlFor="ap-r-ln">Last name</label>
                <input id="ap-r-ln" value={recipientLast} onChange={(e) => setRecipientLast(e.target.value)} />
              </div>
              <div className="form-field">
                <label htmlFor="ap-r-ph">Phone (optional)</label>
                <input id="ap-r-ph" value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)} />
              </div>
              <div className="form-field">
                <label htmlFor="ap-r-hn">House #</label>
                <input
                  id="ap-r-hn"
                  value={recipientAddr.house_number}
                  onChange={(e) => setRecipientAddr({ ...recipientAddr, house_number: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label htmlFor="ap-r-st">Street</label>
                <input
                  id="ap-r-st"
                  value={recipientAddr.street}
                  onChange={(e) => setRecipientAddr({ ...recipientAddr, street: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label htmlFor="ap-r-city">City</label>
                <input
                  id="ap-r-city"
                  value={recipientAddr.city}
                  onChange={(e) => setRecipientAddr({ ...recipientAddr, city: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label htmlFor="ap-r-state">State</label>
                <input
                  id="ap-r-state"
                  value={recipientAddr.state}
                  onChange={(e) => setRecipientAddr({ ...recipientAddr, state: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label htmlFor="ap-r-z3">ZIP first 3</label>
                <input
                  id="ap-r-z3"
                  maxLength={3}
                  value={recipientAddr.zip_first3}
                  onChange={(e) => setRecipientAddr({ ...recipientAddr, zip_first3: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label htmlFor="ap-r-z2">ZIP last 2</label>
                <input
                  id="ap-r-z2"
                  maxLength={2}
                  value={recipientAddr.zip_last2}
                  onChange={(e) => setRecipientAddr({ ...recipientAddr, zip_last2: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label htmlFor="ap-r-apt">Apt (optional)</label>
                <input
                  id="ap-r-apt"
                  value={recipientAddr.apt_number}
                  onChange={(e) => setRecipientAddr({ ...recipientAddr, apt_number: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="add-package-section">
            <h3>Pricing (same as calculator)</h3>
            <div className="add-package-grid">
              <div className="form-field">
                <label htmlFor="ap-w">Weight (lbs)</label>
                <input
                  id="ap-w"
                  type="number"
                  min="0"
                  step="0.01"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>
              <div className="form-field">
                <label htmlFor="ap-z">Zone</label>
                <select id="ap-z" value={zone} onChange={(e) => setZone(e.target.value)}>
                  <option value="">Select zone</option>
                  {[...Array(9)].map((_, i) => (
                    <option key={i + 1} value={String(i + 1)}>{`Zone ${i + 1}`}</option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label htmlFor="ap-pt">Package type</label>
                <select id="ap-pt" value={packageType} onChange={(e) => setPackageType(e.target.value)}>
                  <option value="">Select type</option>
                  <option value="express">Express</option>
                  <option value="general shipping">General shipping</option>
                  <option value="oversize">Oversize</option>
                </select>
              </div>
              <div className="form-field">
                <label htmlFor="ap-ex">Excess fee (optional)</label>
                <select id="ap-ex" value={excessFee} onChange={(e) => setExcessFee(e.target.value)}>
                  <option value="">None</option>
                  <option value="Fragile Handling">Fragile handling</option>
                  <option value="Fuel Surcharge">Fuel surcharge</option>
                  <option value="Hazardous Material">Hazardous material</option>
                  <option value="Signature Required">Signature required</option>
                </select>
              </div>
              <div className="form-field">
                <label htmlFor="ap-dx">Dim X (in)</label>
                <input id="ap-dx" type="number" min="0.01" step="0.01" value={dimX} onChange={(e) => setDimX(e.target.value)} />
              </div>
              <div className="form-field">
                <label htmlFor="ap-dy">Dim Y (in)</label>
                <input id="ap-dy" type="number" min="0.01" step="0.01" value={dimY} onChange={(e) => setDimY(e.target.value)} />
              </div>
              <div className="form-field">
                <label htmlFor="ap-dz">Dim Z (in)</label>
                <input id="ap-dz" type="number" min="0.01" step="0.01" value={dimZ} onChange={(e) => setDimZ(e.target.value)} />
              </div>
            </div>
            <div className="add-package-actions">
              <button type="button" className="btn primary" disabled={loadingQuote} onClick={calculatePrice}>
                {loadingQuote ? 'Calculating…' : 'Calculate price'}
              </button>
              {quotedPrice != null && !Number.isNaN(Number(quotedPrice)) && (
                <span>
                  Quote: <strong>${parseFloat(quotedPrice).toFixed(2)}</strong>
                </span>
              )}
            </div>
          </div>

          {error && <div className="add-package-error">{error}</div>}

          <div className="add-package-section">
            <h3>Record payment &amp; create shipment</h3>
            <div className="add-package-actions">
              <button type="button" className="btn primary" disabled={loadingPay} onClick={payAndCreate}>
                {loadingPay ? 'Processing…' : 'Pay & create package'}
              </button>
            </div>
            {submitResult && (
              <div className="add-package-result">
                Created <code>{submitResult.tracking_number}</code>
                {' — '}
                charged ${parseFloat(submitResult.price).toFixed(2)} to sender account.
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <div>© {new Date().getFullYear()} National Postal Service</div>
        </div>
      </footer>
    </div>
  )
}
