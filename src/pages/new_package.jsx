import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import './css/home.css'
import '../components/Auth.css'

const API_BASE = import.meta.env.VITE_API_URL || ''

const NewPackage = () => {
  const [formData, setFormData] = useState({
    Sender_Email: '',
    Recipient_Email: '',
    Dim_X: '',
    Dim_Y: '',
    Dim_Z: '',
    Package_Type: '',
    Weight: '',
    Zone: '',
    Oversize: '',
    Requires_Signiture: '',
    Price: '',
  })

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const url = `${API_BASE}/api/package/create`
      console.log('Fetching:', url)
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Sender_Email: formData.Sender_ID,
          Recipient_Email: formData.Recipient_ID,
          Dim_X: formData.Dim_X,
          Dim_Y: formData.Dim_Y,
          Dim_Z: formData.Dim_Z,
          Package_Type_Code: formData.Package_Type_Code,
          Weight: formData.Weight,
          Zone: formData.Zone,
          Oversize: formData.Oversize,
          Requires_Signiture: formData.Requires_Signiture,
          Price: formData.Price,
        }),
      })

      let data = {}
      const text = await response.text()
      if (text) {
        try {
          data = JSON.parse(text)
        } catch {
          data = { message: text }
        }
      }

      if (!response.ok) {
        const msg =
          (data && typeof data.message === 'string' && data.message.trim())
            ? data.message
            : `Package creation failed (status ${response.status})`
        setError(msg)
        console.error('Package creation failed', { status: response.status, body: data })
        return
      }

      setSuccess('Package created successfully!')
      navigate('/customer_home')
    } catch (err) {
      setError('An error occurred. Please try again.')
      console.error('Package creation error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <header className="site-header">
        <div className="header-inner">
          <Link className="logo" to="/">
            National Postal Service
          </Link>
          <nav className="top-nav">
            <button
              type="button"
              className="nav-back-btn"
              onClick={() => navigate('/')}
            >
              ← Back
            </button>
          </nav>
        </div>
      </header>

      <div className="login-page-body">
        <div className="login-card login-card--branded register-card-wide">
          <h2>Create a Package</h2>

          <form onSubmit={handleSubmit}>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <div className="form-row">
              <div className="form-group">
                <label>Sender ID *</label>
                <input
                  type="text"
                  name="Sender_ID"
                  value={formData.Sender_ID}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Recipient ID *</label>
                <input
                  type="text"
                  name="Recipient_ID"
                  value={formData.Recipient_ID}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Dim X *</label>
                <input
                  type="text"
                  name="Dim_X"
                  value={formData.Dim_X}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Dim Y *</label>
                <input
                  type="text"
                  name="Dim_Y"
                  value={formData.Dim_Y}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Dim Z *</label>
                <input
                  type="text"
                  name="Dim_Z"
                  value={formData.Dim_Z}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div>
                <label>
                  Package Type:
                  <select
                  value={packageType} onChange={(e) => setPackageType(e.target.value)}
                  >
                    <option value="">Select Package Type</option>
                    <option value="express">express</option>
                    <option value="general shipping">general shipping</option>
                    <option value="oversized">oversized</option>
                  </select>
                </label>
              </div>
              <div className="form-group">
                <label>Weight *</label>
                <input
                  type="text"
                  name="Weight"
                  value={formData.Weight}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label>
                    Zone:
{/*need to fix later so that the zone calc comes from two zipcodes, from zipcode and to zipcode */}
                    <select value={zone} onChange={(e) => setZone(e.target.value)}>
                      <option value="">Select Zone</option>
                      {[...Array(9)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                      Zone {i + 1}
                      </option>
                      ))}
                  </select>
                </label>
              </div>
            </div>

            <div className="form-row">
              
              <div>
                <label>
                    Oversize:
                    <select value={zone} onChange={(e) => setZone(e.target.value)}>
                      <option value="0">No</option>
                      <option value = "1">Yes</option>
                  </select>
                </label>
              </div>

              
              <div>
                <label>
                    Requires Signiture?:
                    <select value={zone} onChange={(e) => setZone(e.target.value)}>
                      <option value="0">No</option>
                      <option value = "1">Yes</option>
                  </select>
                </label>
              </div>
              <div className="form-group">
                <label>Price *</label>
                <input
                  type="text"
                  name="Price"
                  value={formData.Price}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <button type="submit" disabled={loading}>
              {loading ? 'Creating package…' : 'Create Package'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default NewPackage