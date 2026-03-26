import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

// pages
import Home from './pages/home'
import CustomerHome from './pages/customer_home'
import EmployeeHome from './pages/employee_home'
import AllPackages from './pages/package_list'
import Inventory from './pages/inventory'
import Login from './pages/Login'
import Profile from './pages/Profile'
import SupportTicket from './pages/SupportTicket'
import AdminRegister from './pages/AdminRegister'
import Register from './pages/Register'
// // global styles
 import './pages/css/index.css'

// function App() {
//   return (
//     <BrowserRouter>
//       <Routes>
//         <Route path="/" element={<Home />} />
//       </Routes>
//     </BrowserRouter>
//   )
// }

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/customer_home" element={<CustomerHome />} />
        <Route path="/employee_home" element={<EmployeeHome />} />
        <Route path="/Register" element={<Register />} />
        {/* <Route path="/package_list" element={<PackageList />} /> */}

        {/* ── PLACEHOLDER ROUTES ── build these pages and add imports above */}
        <Route path="/login" element={<Login/>} />
        <Route path="/package_list" element={<AllPackages/>} />
        <Route path="/package_tracking" element={<p>Package Tracking — coming soon</p>} />
        <Route path="/package_history" element={<p>Package History — coming soon</p>} />
        <Route path="/inventory" element={<Inventory/>} />
        <Route path="/submit_ticket" element={<p>Submit Ticket — coming soon</p>} />
        <Route path="/support_tickets" element={<p>Support Tickets — coming soon</p>} />
        <Route path="/customer_profile" element={<p>Customer Profile — coming soon</p>} />
        <Route path="/profile" element={<Profile/>} />
        <Route path="/ship_package" element={<p>Ship Package — coming soon</p>} />
        <Route path="/customers" element={<p>Customers — coming soon</p>} />
        <Route path="/admin-register" element={<AdminRegister />} />

        {/* ── 404 ── */}
        <Route path="*" element={<p>Page not found</p>} />
        <Route path="/support" element={<SupportTicket />} />
      </Routes>
    </BrowserRouter>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
