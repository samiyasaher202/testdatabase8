import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// ── Requires employee login ───────────────────────────────────────────────
// Use this on any employee-only page
export function RequireEmployee({ children }) {
  const navigate = useNavigate();

  useEffect(() => {
    const token    = localStorage.getItem('token');
    const userType = localStorage.getItem('userType');

    if (!token) {
      navigate('/login');         // not logged in at all
      return;
    }
    if (userType !== 'employee') {
      navigate('/customer_home'); // logged in but wrong type
    }
  }, []);

  const token    = localStorage.getItem('token');
  const userType = localStorage.getItem('userType');
  if (!token || userType !== 'employee') return null;

  return children;
}

// ── Requires customer login ───────────────────────────────────────────────
// Use this on any customer-only page
export function RequireCustomer({ children }) {
  const navigate = useNavigate();

  useEffect(() => {
    const token    = localStorage.getItem('token');
    const userType = localStorage.getItem('userType');

    if (!token) {
      navigate('/login');          // not logged in at all
      return;
    }
    if (userType !== 'customer') {
      navigate('/employee_home');  // logged in but wrong type
    }
  }, []);

  const token    = localStorage.getItem('token');
  const userType = localStorage.getItem('userType');
  if (!token || userType !== 'customer') return null;

  return children;
}

// ── Requires any login ────────────────────────────────────────────────────
// Use this on pages both employees and customers can access
export function RequireAuth({ children }) {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) navigate('/login');
  }, []);

  const token = localStorage.getItem('token');
  if (!token) return null;

  return children;
}

//Requires for Admin login

export function RequireAdmin({ children }) {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userType = localStorage.getItem('userType');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token) {
      navigate('/login');
      return;
    }

    // Admin must be an employee account
    if (userType !== 'employee') {
      navigate('/customer_home');
      return;
    }

    // TODO: adjust this line to match what your backend returns
    const isAdmin = user.Role_Name === 'Admin';

    if (!isAdmin) {
      navigate('/employee_home'); // logged in employee, but not admin
    }
  }, [navigate]);

  const token = localStorage.getItem('token');
  const userType = localStorage.getItem('userType');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.Role_Name === 'Admin'; // same TODO as above

  if (!token || userType !== 'employee' || !isAdmin) return null;

  return children;
}