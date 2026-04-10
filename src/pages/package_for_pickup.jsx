import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './css/home.css'
import './css/packages.css'
import './css/package_for_pickup.css'

const API_BASE =
  import.meta.env.VITE_API_URL != null && String(import.meta.env.VITE_API_URL).trim() !== ''
    ? String(import.meta.env.VITE_API_URL).replace(/\/$/, '')
    : import.meta.env.DEV
      ? ''
      : 'http://localhost:5000'

function authHeader() {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export default function PackageForPickup() {
  const navigate = useNavigate()
  const [atOffice, setAtOffice] = useState([])
  const [offices, setOffices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [tracking, setTracking] = useState('')
  const [recipientId, setRecipientId] = useState('')
  const [postOfficeId, setPostOfficeId] = useState('')
  const [arrivalTime, setArrivalTime] = useState('')
  const [pickupTime, setPickupTime] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        const [r1, r2] = await Promise.all([
          fetch(`${API_BASE}/api/employee/packages-at-office`, { headers: { ...authHeader() } }),
          fetch(`${API_BASE}/api/employee/post-offices`, { headers: { ...authHeader() } }),
        ])
        const t1 = await r1.text()
        const t2 = await r2.text()
        let d1 = {}
        let d2 = {}
        try {
          if (t1) d1 = JSON.parse(t1)
        } catch {
          /* */
        }
        try {
          if (t2) d2 = JSON.parse(t2)
        } catch {
          /* */
        }
        if (!r1.ok) throw new Error(d1.message || t1.slice(0, 120) || 'Could not load at-office packages')
        if (!r2.ok) throw new Error(d2.message || t2.slice(0, 120) || 'Could not load post offices')
        if (!cancelled) {
          setAtOffice(Array.isArray(d1) ? d1 : [])
          setOffices(Array.isArray(d2) ? d2 : [])
        }
      } catch (e) {
        if (!cancelled) setError(String(e.message || e))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const selectedPkg = useMemo(
    () => atOffice.find((p) => p.Tracking_Number === tracking),
    [atOffice, tracking]
  )

  useEffect(() => {
    if (selectedPkg?.Recipient_ID != null) setRecipientId(String(selectedPkg.Recipient_ID))
    else setRecipientId('')
  }, [selectedPkg])

  async function handleSubmit(e) {
    e.preventDefault()
    setSuccess('')
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch(`${API_BASE}/api/employee/package-pickup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({
          tracking_number: tracking.trim(),
          recipient_id: Number(recipientId),
          post_office_id: Number(postOfficeId),
          arrival_time: arrivalTime,
          pickup_time: pickupTime,
        }),
      })
      const text = await res.text()
      let data = {}
      try {
        if (text) data = JSON.parse(text)
      } catch {
        /* */
      }
      if (!res.ok) throw new Error(data.message || text.slice(0, 160) || `HTTP ${res.status}`)
      setSuccess(`Pickup recorded for ${tracking.trim()}. Is_picked_Up set to 1.`)
      setTracking('')
      setPostOfficeId('')
      setArrivalTime('')
      setPickupTime('')
      const r = await fetch(`${API_BASE}/api/employee/packages-at-office`, { headers: { ...authHeader() } })
      const t = await r.text()
      let d = []
      try {
        if (t) d = JSON.parse(t)
      } catch {
        /* */
      }
      if (r.ok && Array.isArray(d)) setAtOffice(d)
    } catch (err) {
      setError(String(err.message || err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="pickup-page inventory-page">
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
                navigate('/employee_home')
              }}
            >
              Dashboard
            </a>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                navigate('/package_list')
              }}
            >
              Packages
            </a>
          </nav>
        </div>
      </header>

      <main className="pickup-main">
        <h1>Package for pickup</h1>
        <p className="pickup-lead">
          Packages whose delivery status is <strong>At Office</strong>. Record arrival and customer pickup below; this
          sets <code>package_pickup.Is_picked_Up</code> to <code>1</code> and moves status to <strong>Picked Up</strong>{' '}
          when that status exists.
        </p>

        {error && (
          <div className="inventory-error pickup-banner">
            <span>{error}</span>
            <button type="button" onClick={() => setError('')} aria-label="Dismiss">
              ×
            </button>
          </div>
        )}
        {success && <div className="pickup-success pickup-banner">{success}</div>}

        {loading ? (
          <p className="inventory-state-msg">Loading…</p>
        ) : (
          <>
            <section className="pickup-section">
              <h2>At office now</h2>
              {atOffice.length === 0 ? (
                <p className="inventory-state-msg">No packages are currently in &quot;At Office&quot; status.</p>
              ) : (
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Tracking #</th>
                        <th>Recipient ID</th>
                        <th>Recipient</th>
                        <th>Type</th>
                        <th>Weight</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {atOffice.map((p) => (
                        <tr key={p.Tracking_Number}>
                          <td>
                            <code>{p.Tracking_Number}</code>
                          </td>
                          <td>{p.Recipient_ID ?? '—'}</td>
                          <td>{p.Recipient_Name || '—'}</td>
                          <td>{p.Package_Type_Code}</td>
                          <td>{p.Weight} lbs</td>
                          <td>{p.Status_Name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="pickup-section pickup-form-section">
              <h2>Record pickup</h2>
              <form className="pickup-form" onSubmit={handleSubmit}>
                <label className="pickup-field">
                  <span>Tracking number</span>
                  <select
                    required
                    value={tracking}
                    onChange={(e) => setTracking(e.target.value)}
                    disabled={atOffice.length === 0}
                  >
                    <option value="">Select a package (At Office)</option>
                    {atOffice.map((p) => (
                      <option key={p.Tracking_Number} value={p.Tracking_Number}>
                        {p.Tracking_Number}
                        {p.Recipient_Name ? ` — ${p.Recipient_Name}` : ''}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="pickup-field">
                  <span>Recipient ID</span>
                  <input type="text" readOnly value={recipientId} placeholder="Select tracking first" />
                </label>

                <label className="pickup-field">
                  <span>Post office (street)</span>
                  <select required value={postOfficeId} onChange={(e) => setPostOfficeId(e.target.value)}>
                    <option value="">Choose office…</option>
                    {offices.map((o) => (
                      <option key={o.Post_Office_ID} value={String(o.Post_Office_ID)}>
                        {o.Street_Label || `${o.Street}, ${o.City}, ${o.State}`}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="pickup-field">
                  <span>Arrival at office</span>
                  <input
                    type="datetime-local"
                    required
                    value={arrivalTime}
                    onChange={(e) => setArrivalTime(e.target.value)}
                  />
                </label>

                <label className="pickup-field">
                  <span>Customer pickup</span>
                  <input
                    type="datetime-local"
                    required
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                  />
                </label>

                <button type="submit" className="btn primary pickup-submit" disabled={submitting || atOffice.length === 0}>
                  {submitting ? 'Saving…' : 'Complete pickup'}
                </button>
              </form>
            </section>
          </>
        )}
      </main>
    </div>
  )
}
