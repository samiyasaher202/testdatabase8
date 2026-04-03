import { useState } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || ''

/**
 * Shared calculator UI (used on Home and /price_calculator).
 */
export default function PriceCalculatorForm({
  idPrefix = 'pc',
  headingLevel = 'h2',
  showSubtitle = true,
}) {
  const Heading = headingLevel
  const [packageType, setPackageType] = useState('')
  const [excessFee, setExcessFee] = useState('')
  const [weight, setWeight] = useState('')
  const [zone, setZone] = useState('')
  const [price, setPrice] = useState(null)
  const [error, setError] = useState(null)

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
            (res.status === 502
              ? 'Backend server is not running (start the API on port 5000).'
              : '') ||
            raw ||
            'Failed to load price'
        )
      }

      setPrice(data.Tot_Price)
    } catch (err) {
      setError(err.message || 'Could not calculate price.')
      setPrice(null)
    }
  }

  const id = (s) => `${idPrefix}-${s}`

  return (
    <div className="price-calculator-inner">
      <Heading>Package price calculator</Heading>
      {showSubtitle && (
        <p className="price-calculator-subtitle">
          Enter weight, zone, and package type to estimate shipping cost.
        </p>
      )}

      <div className="price-calculator-card">
        <div className="form-field">
          <label htmlFor={id('weight')}>Weight (lbs)</label>
          <input
            id={id('weight')}
            type="number"
            min="0"
            step="0.01"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="0"
          />
        </div>

        <div className="form-field">
          <label htmlFor={id('zone')}>Zone</label>
          <select id={id('zone')} value={zone} onChange={(e) => setZone(e.target.value)}>
            <option value="">Select zone</option>
            {[...Array(9)].map((_, i) => (
              <option key={i + 1} value={String(i + 1)}>
                Zone {i + 1}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label htmlFor={id('type')}>Package type</label>
          <select
            id={id('type')}
            value={packageType}
            onChange={(e) => setPackageType(e.target.value)}
          >
            <option value="">Select type</option>
            <option value="express">Express</option>
            <option value="general shipping">General shipping</option>
            <option value="oversize">Oversize</option>
          </select>
        </div>

        <div className="form-field">
          <label htmlFor={id('excess')}>Excess fee (optional)</label>
          <select
            id={id('excess')}
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
  )
}
