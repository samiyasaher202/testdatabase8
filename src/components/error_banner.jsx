import './error_banner.css'

export default function ErrorBanner({ message, onClose }) {
  if (!message) return null

  return (
    <div className="error-banner">
      <span className="error-banner-message">{message}</span>
      <button className="error-banner-close" onClick={onClose}>✕</button>
    </div>
  )
}

// no need for {error && <ErrorBanner ... />}
// just always render it — it hides itself when message is empty
{/* <ErrorBanner message={error} onClose={() => setError('')} /> */}