import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PriceCalculatorForm from '../components/PriceCalculatorForm'
import './css/home.css'
import './css/price_calculator.css'
import skyline from '../assets/houston-skyline.jpeg'

export default function PriceCalculator() {
  const navigate = useNavigate()
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem('token'))

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

        <PriceCalculatorForm idPrefix="pc" />
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
