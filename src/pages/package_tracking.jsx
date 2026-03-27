import React from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

export default function PackageTracking() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [tracking, setTracking] = React.useState(searchParams.get('tracking') || '')
  const [result, setResult] = React.useState(null)
  const [error, setError] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  const fetchTracking = async (trackingNumber) => {
    if (!trackingNumber) {
      setError('Please enter a tracking number.')
      setResult(null)
      return
    }
    setLoading(true)
    setError('')
    setResult(null)

    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000'
    const url = `${apiBase}/api/packages/track/${encodeURIComponent(trackingNumber)}`

    try {
      const response = await fetch(url)
      const contentType = response.headers.get('content-type') || ''

      let data
      if (contentType.includes('application/json')) {
        data = await response.json()
      } else {
        const text = await response.text()
        throw new Error(`Expected JSON response, got: ${text.slice(0, 240)}`)
      }

      if (!response.ok) {
        setError(data.error || 'Failed to fetch package')
      } else {
        setResult(data)
      }
    } catch (err) {
      setError(err.message || 'Network error')
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    if (tracking) {
      fetchTracking(tracking)
    }
  }, [])

  return (
    <div style={{ padding: '1.2rem' }}>
      <button onClick={() => navigate(-1)} style={{ marginBottom: '1rem' }}>&larr; Back</button>
      <h2>Package Tracking</h2>
      <div style={{ maxWidth: '420px', marginBottom: '1rem' }}>
        <input
          value={tracking}
          onChange={(e) => setTracking(e.target.value)}
          placeholder="Enter tracking number (e.g., TRK0000001)"
          style={{ width: '100%', padding: '0.6rem', marginBottom: '0.5rem' }}
        />
        <button onClick={() => fetchTracking(tracking)} style={{ padding: '0.6rem 0.8rem' }}>
          {loading ? 'Loading...' : 'Lookup'}
        </button>
      </div>

      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      {result && (
        <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '1rem', maxWidth: '700px' }}>
          <h3>Tracking Results</h3>
          <p><strong>Tracking Number: </strong>{result.Tracking_Number}</p>
          <p><strong>Package Type: </strong>{result.Type_Name} ({result.Package_Type_Code})</p>
          <p><strong>Status: </strong>{result.Status_Name || 'No status yet'}</p>
          <p><strong>Weight: </strong>{result.Weight} lbs</p>
          <p><strong>Dimensions: </strong>{result.Dim_X} x {result.Dim_Y} x {result.Dim_Z}</p>
          <p><strong>Zone: </strong>{result.Zone}</p>
          <p><strong>Price: </strong>${result.Price}</p>
          <p><strong>Sender: </strong>{result.Sender_Name}</p>
          <p><strong>Recipient: </strong>{result.Recipient_Name}</p>
          <p><strong>Delivered On: </strong>{result.Delivered_Date || 'Not delivered yet'}</p>
          <p><strong>Signature Required: </strong>{result.Signature_Required ? 'Yes' : 'No'}</p>
        </div>
      )}
    </div>
  )
}
