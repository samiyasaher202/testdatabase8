import { useNavigate } from 'react-router-dom'
import Layout from '../layout'
import '../components/button.css'

export default function CustomerHome() {
  const navigate = useNavigate();

  return (
    <Layout buttonLabel="Logout" buttonHref="/">

      {/* ── PAGE TITLE ── */}
      <h2>Welcome to Post Office 8</h2>
      <p>What would you like to do today?</p>

      {/* ── NAVIGATION BUTTONS ── */}
      <div className="button-group">

        <button className="btn" onClick={() => navigate('/Login')}>
          My Packages
        </button>

        <button className="btn" onClick={() => navigate('/package_tracking')}>
          Track Package
        </button>

        <button className="btn" onClick={() => navigate('/store')}>
          Store
        </button>

        <button className="btn" onClick={() => navigate('/submit_ticket')}>
          Submit Support Ticket
        </button>

        <button className="btn" onClick={() => navigate('/customer_profile')}>
          Profile
        </button>

      </div>

    </Layout>
  )
}