import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { mergeRoutingWithDeliveredMilestone } from '../utils/deliveryMilestone'
import './css/home.css'
import './css/packages.css'
import './css/shipment_routing.css'

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

async function parseJsonResponse(res) {
  const text = await res.text()
  let data = {}
  try {
    if (text) data = JSON.parse(text)
  } catch {
    /* */
  }
  return { ok: res.ok, data, text }
}

export default function ShipmentRouting() {
  const navigate = useNavigate()
  const [trackingInput, setTrackingInput] = useState('')
  const [tracking, setTracking] = useState('')
  const [shipments, setShipments] = useState([])
  const [shipmentId, setShipmentId] = useState('')
  const [events, setEvents] = useState([])
  const [offices, setOffices] = useState([])
  const [postOfficeId, setPostOfficeId] = useState('')
  const [eventType, setEventType] = useState('arrival')
  const [eventTime, setEventTime] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/employee/post-offices`, { headers: { ...authHeader() } })
        const { ok, data, text } = await parseJsonResponse(res)
        if (!cancelled && ok && Array.isArray(data)) setOffices(data)
        else if (!cancelled && !ok) setError(data.message || text.slice(0, 120) || 'Could not load offices')
      } catch (e) {
        if (!cancelled) setError(String(e.message || e))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const loadShipments = useCallback(async (tn) => {
    const t = tn.trim()
    if (!t) return
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const res = await fetch(
        `${API_BASE}/api/employee/shipments-for-package/${encodeURIComponent(t)}`,
        { headers: { ...authHeader() } }
      )
      const { ok, data, text } = await parseJsonResponse(res)
      if (!ok) throw new Error(data.message || text.slice(0, 160) || `HTTP ${res.status}`)
      setShipments(Array.isArray(data) ? data : [])
      setTracking(t)
      setShipmentId('')
      setEvents([])
    } catch (e) {
      setError(String(e.message || e))
      setShipments([])
      setTracking('')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadEvents = useCallback(
    async (sid, tn) => {
      if (!sid) {
        setEvents([])
        return
      }
      const trackingForPackage = String(tn || '').trim()
      setLoading(true)
      setError('')
      let rows = []
      try {
        const res = await fetch(`${API_BASE}/api/employee/shipment/${sid}/routing-events`, {
          headers: { ...authHeader() },
        })
        const { ok, data, text } = await parseJsonResponse(res)
        if (!ok) throw new Error(data.message || text.slice(0, 160) || `HTTP ${res.status}`)
        rows = Array.isArray(data) ? data : []
      } catch (e) {
        setError(String(e.message || e))
        rows = []
      }
      let pkg = null
      if (trackingForPackage) {
        try {
          const resTrk = await fetch(
            `${API_BASE}/api/packages/track/${encodeURIComponent(trackingForPackage)}`
          )
          const { ok, data } = await parseJsonResponse(resTrk)
          if (ok && data && !data.error) pkg = data
        } catch {
          /* ignore */
        }
      }
      setEvents(mergeRoutingWithDeliveredMilestone(rows, pkg))
      setLoading(false)
    },
    [API_BASE]
  )

  useEffect(() => {
    if (shipmentId && tracking) loadEvents(shipmentId, tracking)
  }, [shipmentId, tracking, loadEvents])

  async function handleLogEvent(e) {
    e.preventDefault()
    setSuccess('')
    setError('')
    if (!shipmentId || !postOfficeId) {
      setError('Choose a shipment leg and post office.')
      return
    }
    const timeVal = eventTime.trim() || null
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/employee/shipment/routing-event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({
          shipment_id: Number(shipmentId),
          post_office_id: Number(postOfficeId),
          event_type: eventType,
          event_time: timeVal,
        }),
      })
      const { ok, data, text } = await parseJsonResponse(res)
      if (!ok) throw new Error(data.message || text.slice(0, 160) || `HTTP ${res.status}`)
      setSuccess(`${eventType === 'arrival' ? 'Arrival' : 'Departure'} logged.`)
      setEventTime('')
      await loadEvents(shipmentId, tracking)
    } catch (err) {
      setError(String(err.message || err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="shipment-routing-page inventory-page">
      <header className="site-header">
        <div className="header-inner">
          <Link className="logo" to="/">
            National Postal Service
          </Link>
          <nav className="top-nav">
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/employee_home') }}>Dashboard</a>
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/package_list') }}>Packages</a>
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/package_tracking') }}>Track</a>
          </nav>
        </div>
      </header>

      <main className="shipment-routing-main">
        <h1>Shipment routing</h1>
        <p className="shipment-routing-lead">
          Each <strong>Shipment_ID</strong> is one leg of the journey (origin → toward destination). Log every{' '}
          <strong>arrival</strong> and <strong>departure</strong> at a post office. Customers see this timeline on{' '}
          <strong>Package tracking</strong>.
        </p>

        {error && (
          <div className="inventory-error sr-banner">
            <span>{error}</span>
            <button type="button" onClick={() => setError('')} aria-label="Dismiss">×</button>
          </div>
        )}
        {success && <div className="sr-success sr-banner">{success}</div>}

        <section className="sr-section">
          <h2>1. Load package</h2>
          <div className="sr-row">
            <input
              type="text"
              className="search-input"
              placeholder="Tracking number (e.g. TRK0000001)"
              value={trackingInput}
              onChange={(e) => setTrackingInput(e.target.value)}
            />
            <button
              type="button"
              className="btn primary"
              disabled={loading}
              onClick={() => loadShipments(trackingInput)}
            >
              Load shipments
            </button>
          </div>
        </section>

        {tracking && (
          <section className="sr-section">
            <h2>2. Shipment legs for <code>{tracking}</code></h2>
            {shipments.length === 0 ? (
              <p className="inventory-state-msg">No shipment rows linked to this tracking number.</p>
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Shipment ID</th>
                      <th>Status</th>
                      <th>From</th>
                      <th>To</th>
                      <th>Departure</th>
                      <th>Arrival (leg)</th>
                      <th>Select</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shipments.map((s) => (
                      <tr key={s.Shipment_ID}>
                        <td><code>{s.Shipment_ID}</code></td>
                        <td>{s.Status_Name}</td>
                        <td>{s.From_Summary || '—'}</td>
                        <td>{s.To_Summary || '—'}</td>
                        <td>{s.Departure_Time_Stamp ? new Date(s.Departure_Time_Stamp).toLocaleString() : '—'}</td>
                        <td>{s.Arrival_Time_Stamp ? new Date(s.Arrival_Time_Stamp).toLocaleString() : '—'}</td>
                        <td>
                          <button
                            type="button"
                            className="button"
                            style={{ padding: '6px 12px', marginTop: 0 }}
                            onClick={() => setShipmentId(String(s.Shipment_ID))}
                          >
                            {String(shipmentId) === String(s.Shipment_ID) ? 'Selected' : 'Use this leg'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {shipmentId && (
          <>
            <section className="sr-section">
              <h2>3. Log scan (Shipment <code>{shipmentId}</code>)</h2>
              <form className="sr-form" onSubmit={handleLogEvent}>
                <label>
                  Post office (street)
                  <select
                    required
                    value={postOfficeId}
                    onChange={(e) => setPostOfficeId(e.target.value)}
                  >
                    <option value="">Choose office…</option>
                    {offices.map((o) => (
                      <option key={o.Post_Office_ID} value={String(o.Post_Office_ID)}>
                        {o.Street_Label || `${o.Street}, ${o.City}, ${o.State}`}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Event
                  <select value={eventType} onChange={(e) => setEventType(e.target.value)}>
                    <option value="arrival">Arrived at office</option>
                    <option value="departure">Departed office</option>
                  </select>
                </label>
                <label>
                  Date &amp; time (leave blank for now)
                  <input
                    type="datetime-local"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                  />
                </label>
                <button type="submit" className="btn primary" disabled={loading}>
                  {loading ? 'Saving…' : 'Log event'}
                </button>
              </form>
            </section>

            <section className="sr-section">
              <h2>4. Events for this leg</h2>
              {events.length === 0 ? (
                <p className="inventory-state-msg">No routing events yet for this shipment.</p>
              ) : (
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Type</th>
                        <th>Office</th>
                        <th>Logged by (employee ID)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map((ev) => (
                        <tr key={ev.Event_ID < 0 ? `sr-delivered-${ev.Event_Type}` : ev.Event_ID}>
                          <td>{ev.Event_Time ? new Date(ev.Event_Time).toLocaleString() : '—'}</td>
                          <td>
                            {ev.Event_Type === 'delivered'
                              ? 'Delivered'
                              : ev.Event_Type === 'departure'
                                ? 'Departed'
                                : ev.Event_Type === 'arrival'
                                  ? 'Arrived'
                                  : ev.Event_Type}
                          </td>
                          <td>{ev.Office_Label || '—'}</td>
                          <td>{ev.Logged_By_Employee_ID ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  )
}
