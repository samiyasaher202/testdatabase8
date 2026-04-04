import { useState, useEffect } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const ZONES = [
  { value: '1', label: 'Zone 1 — 1 to 50 miles' },
  { value: '2', label: 'Zone 2 — 51 to 150 miles' },
  { value: '3', label: 'Zone 3 — 151 to 300 miles' },
  { value: '4', label: 'Zone 4 — 301 to 600 miles' },
  { value: '5', label: 'Zone 5 — 601 to 1,000 miles' },
  { value: '6', label: 'Zone 6 — 1,001 to 1,400 miles' },
  { value: '7', label: 'Zone 7 — 1,401 to 1,800 miles' },
  { value: '8', label: 'Zone 8 — 1,801 miles or greater' },
  { value: '9', label: 'Zone 9 — Territories & military addresses' },
]

const BOX_TIERS = [
  { maxL: 12, maxW: 12, maxH: 12, surcharge: 0,  label: 'Small (up to 12×12×12 in)' },
  { maxL: 18, maxW: 18, maxH: 18, surcharge: 5,  label: 'Medium (up to 18×18×18 in)' },
  { maxL: 24, maxW: 24, maxH: 24, surcharge: 10, label: 'Large (up to 24×24×24 in)' },
  { maxL: 30, maxW: 30, maxH: 30, surcharge: 20, label: 'Extra Large (up to 30×30×30 in)' },
]

const MAX_WEIGHT    = 70
const OVR_THRESHOLD = 15

function getBoxTier(dx, dy, dz) {
  if (!dx && !dy && !dz) return null
  for (const tier of BOX_TIERS) {
    if (dx <= tier.maxL && dy <= tier.maxW && dz <= tier.maxH) return tier
  }
  return 'rejected'
}

export default function PriceCalculatorForm({
  idPrefix     = 'pc',
  headingLevel = 'h2',
  showSubtitle = true,
}) {
  const Heading = headingLevel

  const [shipmentType, setShipmentType] = useState('')
  const [excessFee, setExcessFee]       = useState('')
  const [weight, setWeight]             = useState('')
  const [zone, setZone]                 = useState('')
  const [dimX, setDimX]                 = useState('')
  const [dimY, setDimY]                 = useState('')
  const [dimZ, setDimZ]                 = useState('')
  const [price, setPrice]               = useState(null)
  const [error, setError]               = useState(null)

  const w = parseFloat(weight) || 0
  const dx = parseFloat(dimX) || 0
  const dy = parseFloat(dimY) || 0
  const dz = parseFloat(dimZ) || 0

  const weightTooHeavy = w > MAX_WEIGHT
  const isOverweight   = w > OVR_THRESHOLD
  const boxTier        = getBoxTier(dx, dy, dz)
  const boxRejected    = boxTier === 'rejected'

  const effectiveType = isOverweight
    ? 'oversize'
    : shipmentType === 'express'
    ? 'express'
    : shipmentType === 'general shipping'
    ? 'general shipping'
    : ''

  useEffect(() => { setPrice(null); setError(null) },
    [weight, zone, shipmentType, excessFee, dimX, dimY, dimZ])

  const fetchPrice = async () => {
    setError(null); setPrice(null)

    if (!shipmentType)     { setError('Please select a shipment type.'); return }
    if (!weight || w <= 0) { setError('Please enter a valid weight.'); return }
    if (weightTooHeavy)    { setError(`Maximum weight is ${MAX_WEIGHT} lbs.`); return }
    if (!zone)             { setError('Please select a zone.'); return }
    if (boxRejected)       { setError('Package dimensions exceed the maximum size of 30×30×30 inches.'); return }

    try {
      const params = new URLSearchParams({ package_type: effectiveType, weight, zone })
      if (excessFee)      params.append('excess_fee', excessFee)
      if (dx > 0)         params.append('dim_x', dx)
      if (dy > 0)         params.append('dim_y', dy)
      if (dz > 0)         params.append('dim_z', dz)

      const res  = await fetch(`${API_BASE}/api/price?${params.toString()}`)
      const raw  = await res.text()
      let data   = {}
      try { data = raw ? JSON.parse(raw) : {} }
      catch { data = { error: raw?.slice(0, 240) || `HTTP ${res.status}` } }

      if (!res.ok) {
        throw new Error(data.error || data.message ||
          (res.status === 502 ? 'Backend server is not running.' : '') ||
          raw || 'Failed to load price')
      }
      setPrice(data.Tot_Price)
    } catch (err) {
      setError(err.message || 'Could not calculate price.')
    }
  }

  const id = s => `${idPrefix}-${s}`

  return (
    <div className="price-calculator-inner">
      <Heading>Package price calculator</Heading>
      {showSubtitle && (
        <p className="price-calculator-subtitle"style={{ textAlign: 'center' }}>
          Enter your package details to estimate shipping cost.
        </p>
      )}

      <div className="price-calculator-card">

        {/* Shipment Type */}
        <div className="form-field">
          <label htmlFor={id('type')}>Shipment type</label>
          <select
            id={id('type')} value={shipmentType}
            onChange={e => setShipmentType(e.target.value)}
            disabled={isOverweight}
          >
            <option value="">Select type</option>
            <option value="general shipping">General shipping</option>
            <option value="express">Express</option>
          </select>
          {isOverweight && (
            <span className="calc-notice calc-notice--warn">
              Weight over {OVR_THRESHOLD} lbs — automatically classified as oversize
            </span>
          )}
        </div>

        {/* Weight */}
        <div className="form-field">
          <label htmlFor={id('weight')}>Weight (lbs)</label>
          <input
            id={id('weight')} type="number" min="0" max={MAX_WEIGHT} step="0.01"
            value={weight} onChange={e => setWeight(e.target.value)} placeholder="0.00"
          />
          {weightTooHeavy && (
            <span className="calc-notice calc-notice--error">
              Exceeds maximum weight of {MAX_WEIGHT} lbs
            </span>
          )}
        </div>

        {/* Dimensions */}
        <div className="form-field">
          <label>Dimensions (inches) — Length × Width × Height</label>
          <div className="dim-row">
            <input id={id('dimX')} type="number" min="0" step="0.1"
              value={dimX} onChange={e => setDimX(e.target.value)} placeholder="L" />
            <span className="dim-sep">×</span>
            <input id={id('dimY')} type="number" min="0" step="0.1"
              value={dimY} onChange={e => setDimY(e.target.value)} placeholder="W" />
            <span className="dim-sep">×</span>
            <input id={id('dimZ')} type="number" min="0" step="0.1"
              value={dimZ} onChange={e => setDimZ(e.target.value)} placeholder="H" />
          </div>

          {/* Box tier feedback */}
          {boxRejected && (
            <span className="calc-notice calc-notice--error">
              Package too large — maximum size is 30×30×30 inches
            </span>
          )}
          {boxTier && boxTier !== 'rejected' && (
            <span className="calc-notice calc-notice--info">
              Box tier: {boxTier.label}
              {boxTier.surcharge > 0 ? ` — +$${boxTier.surcharge.toFixed(2)} surcharge` : ' — no surcharge'}
            </span>
          )}
        </div>

        {/* Zone */}
        <div className="form-field">
          <label htmlFor={id('zone')}>Destination zone</label>
          <select id={id('zone')} value={zone} onChange={e => setZone(e.target.value)}>
            <option value="">Select zone</option>
            {ZONES.map(z => (
              <option key={z.value} value={z.value}>{z.label}</option>
            ))}
          </select>
        </div>

        {/* Excess Fee */}
        <div className="form-field">
          <label htmlFor={id('excess')}>Add-on fee (optional)</label>
          <select id={id('excess')} value={excessFee} onChange={e => setExcessFee(e.target.value)}>
            <option value="">None</option>
            <option value="Fragile Handling">Fragile handling</option>
            <option value="Fuel Surcharge">Fuel surcharge</option>
            <option value="Hazardous Material">Hazardous material</option>
            <option value="Signature Required">Signature required</option>
          </select>
        </div>

        {/* Summary */}
        {effectiveType && weight && zone && !boxRejected && (
          <div className="calc-summary">
            <span>Type: {effectiveType.charAt(0).toUpperCase() + effectiveType.slice(1)}</span>
            <span>Weight: {weight} lbs </span>
            <span>{ZONES.find(z => z.value === zone)?.label} </span>
            {boxTier && boxTier !== 'rejected' && boxTier.surcharge > 0 && (
              <span>Box surcharge: ${boxTier.surcharge.toFixed(2)}</span>
            )}
            {excessFee && <span>Add-on: {excessFee}</span>}
          </div>
        )}

        <button
          type="button" className="btn-calc"
          onClick={fetchPrice}
          disabled={weightTooHeavy || boxRejected}
        >
          Calculate price
        </button>

        {error && <div className="price-calculator-error">{error}</div>}

        {price != null && !Number.isNaN(Number(price)) && (
          <div className="price-calculator-result">
            Estimated total: <strong>${parseFloat(price).toFixed(2)}</strong>
          </div>
        )}

      </div>
    </div>
  )
}