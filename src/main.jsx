import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { RequireEmployee, RequireCustomer, RequireAuth } from './AuthGuard'

// pages
import Home from './pages/home'
import Login from './pages/Login'

import CustomerHome from './pages/customer_home'
import EmployeeHome from './pages/employee_home'

import Profile from './pages/Profile'
import CustomerProfile from './pages/CustomerProfile'

import Register from './pages/Register'
import AdminRegister from './pages/AdminRegister'

import AllPackages from './pages/package_list'
import Inventory from './pages/inventory'
import AllCustomers from './pages/all_customers'
import PackageTracking from './pages/package_tracking'

import SupportTicket from './pages/SupportTicket'

// // global styles
 import './pages/css/index.css'



// global styles


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/customer_home" element={<CustomerHome />} />
        <Route path="/employee_home" element={<RequireEmployee><EmployeeHome /></RequireEmployee>} />
        <Route path="/register" element={<Register />} />
        <Route path="/customer_profile" element={<CustomerProfile />} />
        <Route path="/profile" element={<RequireEmployee><Profile/></RequireEmployee>} />
        {/* <Route path="/package_list" element={<PackageList />} /> */}

        {/* ── PLACEHOLDER ROUTES ── build these pages and add imports above */}
        <Route path="/login" element={<Login/>} />
        <Route path="/package_tracking" element={<PackageTracking />} />
        <Route path="/package_list" element={<AllPackages/>} />
        <Route path="/package_history" element={<p>Package History — coming soon</p>} />
        <Route path="/inventory" element={<Inventory/>} />
        <Route path="/submit_ticket" element={<p>Submit Ticket — coming soon</p>} />
        <Route path="/support_tickets" element={<p>Support Tickets — coming soon</p>} />
        <Route path="/ship_package" element={<p>Ship Package — coming soon</p>} />
        <Route path="/customers" element={<AllCustomers/>} />
        <Route path="/admin-register" element={<AdminRegister />} />

        {/* ── 404 ── */}
        <Route path="/support" element={<RequireAuth><SupportTicket /></RequireAuth>} />
        <Route path="*" element={<p>Page not found</p>} />
      </Routes>
    </BrowserRouter>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
