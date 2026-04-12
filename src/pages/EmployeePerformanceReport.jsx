import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const ZONE_LABELS = {
  1: 'Zone 1 — 1-50 mi',
  2: 'Zone 2 — 51-150 mi',
  3: 'Zone 3 — 151-300 mi',
  4: 'Zone 4 — 301-600 mi',
  5: 'Zone 5 — 601-1,000 mi',
  6: 'Zone 6 — 1,001-1,400 mi',
  7: 'Zone 7 — 1,401-1,800 mi',
  8: 'Zone 8 — 1,801+ mi',
  9: 'Zone 9 — Territories',
}

//  Helpers 
function fmt(n)   { return parseFloat(n || 0).toFixed(2) }
function fmtPct(n){ return n != null ? `${parseFloat(n).toFixed(1)}%` : '—' }
function fmtDate(d){ return d ? new Date(d).toLocaleDateString() : '—' }

function downloadCSV(data, filename, headers, rowFn) {
  if (!data.length) return
  const csv = [headers, ...data.map(rowFn)]
    .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `${filename}_${new Date().toISOString().slice(0,10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

//  Sub-components 
function SectionHeader({ title, onDownload, loading }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
      <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a', fontWeight: 700 }}>{title}</h2>
      <div style={{ display: 'flex', gap: 8 }}>
        {onDownload && (
          <button onClick={onDownload}
            style={{ padding: '6px 14px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 8, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, color: '#065f46' }}>
            ⬇ CSV
          </button>
        )}
      </div>
    </div>
  )
}

function Card({ label, value, sub, color = '#1d4ed8' }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #dbe4ef', borderRadius: 14, padding: '18px 22px', boxShadow: '0 2px 8px rgba(15,23,42,0.05)' }}>
      <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: '1.6rem', fontWeight: 800, color }}>{value}</div>
      {sub && <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

function HBar({ label, value, max, color = '#1d4ed8', suffix = '' }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
      <div style={{ width: 180, fontSize: '0.83rem', color: '#374151', fontWeight: 600, textAlign: 'right', flexShrink: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
      <div style={{ flex: 1, background: '#f1f5f9', borderRadius: 6, overflow: 'hidden', height: 28 }}>
        <div style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}99)`, height: '100%', borderRadius: 6, minWidth: value > 0 ? 6 : 0, transition: 'width 0.5s ease' }} />
      </div>
      <div style={{ width: 70, fontSize: '0.83rem', fontWeight: 700, color, textAlign: 'right', flexShrink: 0 }}>{value}{suffix}</div>
    </div>
  )
}

function TableWrap({ children }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #dbe4ef', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 16px rgba(15,23,42,0.05)' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
          {children}
        </table>
      </div>
    </div>
  )
}

function Th({ children, onClick, sorted }) {
  return (
    <th onClick={onClick} style={{ padding: '11px 14px', textAlign: 'left', fontWeight: 700, color: '#374151', background: '#f8fafc', borderBottom: '2px solid #dbe4ef', cursor: onClick ? 'pointer' : 'default', whiteSpace: 'nowrap', userSelect: 'none' }}>
      {children}{sorted}
    </th>
  )
}

function Td({ children, center, bold, blue }) {
  return (
    <td style={{ padding: '11px 14px', borderBottom: '1px solid #f1f5f9', textAlign: center ? 'center' : 'left', fontWeight: bold ? 700 : 400, color: blue ? '#1e40af' : '#374151' }}>
      {children}
    </td>
  )
}

function Badge({ value, color = '#1d4ed8', bg = '#eff6ff' }) {
  return (
    <span style={{ background: bg, color, borderRadius: 20, padding: '2px 10px', fontWeight: 700, fontSize: '0.82rem' }}>
      {value}
    </span>
  )
}

function Section({ children }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #dbe4ef', borderRadius: 20, padding: '28px 32px', boxShadow: '0 4px 16px rgba(15,23,42,0.05)', marginBottom: 32 }}>
      {children}
    </div>
  )
}

//  Main Component 
export default function EmployeePerformanceReport() {
  const navigate = useNavigate()
  const token    = localStorage.getItem('token')

  // Data
  const [employees,   setEmployees]   = useState([])
  const [locations,   setLocations]   = useState([])
  const [departments, setDepartments] = useState([])
  const [zones,       setZones]       = useState([])
  const [deptOpts,    setDeptOpts]    = useState([])
  const [officeOpts,  setOfficeOpts]  = useState([])
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState(null)

  // Filters (one set affects everything)
  const [deptFilter,   setDeptFilter]   = useState('')
  const [officeFilter, setOfficeFilter] = useState('')
  const [dateFrom,     setDateFrom]     = useState('')
  const [dateTo,       setDateTo]       = useState('')
  const [showFilters,  setShowFilters]  = useState(false)

  // Sort for employee table
  const [sortKey, setSortKey] = useState('Total_Packages')
  const [sortDir, setSortDir] = useState('desc')

  //  Fetch all data 
  const fetchAll = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const empParams  = new URLSearchParams()
      const otherParams = new URLSearchParams()
      if (deptFilter)   { empParams.append('department_id',  deptFilter);  otherParams.append('department_id',  deptFilter) }
      if (officeFilter) { empParams.append('post_office_id', officeFilter); otherParams.append('post_office_id', officeFilter) }
      if (dateFrom)     { empParams.append('date_from', dateFrom);          otherParams.append('date_from', dateFrom) }
      if (dateTo)       { empParams.append('date_to',   dateTo);            otherParams.append('date_to',   dateTo) }

      const h = { Authorization: `Bearer ${token}` }

      const [empRes, locRes, deptRes, zoneRes] = await Promise.all([
        fetch(`${API_BASE}/api/reports/employee-performance?${empParams}`, { headers: h }),
        fetch(`${API_BASE}/api/reports/location-stats?${otherParams}`,     { headers: h }),
        fetch(`${API_BASE}/api/reports/department-stats?${otherParams}`,   { headers: h }),
        fetch(`${API_BASE}/api/reports/zone-stats?${otherParams}`,         { headers: h }),
      ])

      const [empData, locData, deptData, zoneData] = await Promise.all([
        empRes.json(), locRes.json(), deptRes.json(), zoneRes.json()
      ])

      setEmployees(empData.report     || [])
      setLocations(locData.locations  || [])
      setDepartments(deptData.departments || [])
      setZones(zoneData.zones         || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [token, deptFilter, officeFilter, dateFrom, dateTo])

  //  Load filter options on mount 
  useEffect(() => {
    if (!token) { navigate('/login'); return }
    const h = { Authorization: `Bearer ${token}` }
    Promise.all([
      fetch(`${API_BASE}/api/reports/departments`,  { headers: h }).then(r => r.json()),
      fetch(`${API_BASE}/api/reports/post-offices`, { headers: h }).then(r => r.json()),
    ]).then(([d, o]) => { setDeptOpts(Array.isArray(d) ? d : []); setOfficeOpts(Array.isArray(o) ? o : []) })
    fetchAll()
  }, [])

  //  Sort 
  const sorted = [...employees].sort((a, b) => {
    const av = a[sortKey], bv = b[sortKey]
    if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    return sortDir === 'asc' ? av - bv : bv - av
  })

  function handleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }
  function si(key) { if (sortKey !== key) return ' ↕'; return sortDir === 'asc' ? ' ↑' : ' ↓' }

  //  Summary stats 
  const totalEmp      = employees.length
  const totalPkgs     = employees.reduce((s, r) => s + Number(r.Total_Packages), 0)
  const totalRev      = employees.reduce((s, r) => s + Number(r.Total_Revenue), 0)
  const totalShips    = employees.reduce((s, r) => s + Number(r.Total_Shipments), 0)
  const topEmp        = [...employees].sort((a,b) => b.Total_Packages - a.Total_Packages)[0]
  const topRevEmp     = [...employees].sort((a,b) => b.Total_Revenue  - a.Total_Revenue)[0]
  const bestRate      = [...employees].filter(e => e.Delivery_Success_Rate != null).sort((a,b) => b.Delivery_Success_Rate - a.Delivery_Success_Rate)[0]
  const maxPkgs       = Math.max(...employees.map(e => e.Total_Packages), 1)
  const maxLocPkgs    = Math.max(...locations.map(l => l.Total_Packages), 1)
  const maxZonePkgs   = Math.max(...zones.map(z => z.Total_Packages), 1)

  return (
    <div style={{ minHeight: '100vh', background: '#eae6de', fontFamily: 'inherit' }}>

      {/* ── HEADER ── */}
      <header style={{ background: '#1a1f4e', color: '#fff', padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 12px rgba(29,78,216,0.3)' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>📊 Operations Report</h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', opacity: 0.8 }}>Employee performance, location stats, department breakdown & zone traffic</p>
        </div>
        <button onClick={() => navigate('/employee_home')}
          style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', borderRadius: 10, padding: '9px 18px', cursor: 'pointer', fontWeight: 600 }}>
          ← Dashboard
        </button>
      </header>

      <div style={{ width: 'min(1200px, calc(100% - 48px))', margin: '0 auto', padding: '32px 0 64px' }}>

        {/* ── TOOLBAR ── */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 24, alignItems: 'center' }}>
          <button onClick={() => setShowFilters(f => !f)}
            style={{ padding: '9px 18px', background: showFilters ? '#eff6ff' : '#fff', border: '1px solid #dbe4ef', borderRadius: 10, cursor: 'pointer', fontWeight: 600, color: '#374151' }}>
            🔽 {showFilters ? 'Hide Filters' : 'Filters'}
          </button>
          <button onClick={fetchAll} disabled={loading}
            style={{ padding: '9px 18px', background: '#fff', border: '1px solid #dbe4ef', borderRadius: 10, cursor: 'pointer', fontWeight: 600, color: '#374151' }}>
            {loading ? '⏳ Loading...' : '🔄 Refresh'}
          </button>
          <button onClick={() => downloadCSV(sorted, 'employee_performance',
            ['ID','Name','Email','Role','Department','Office','Shipments','Packages','Avg Pkgs/Shipment','Revenue','Avg Rev/Shipment','Success Rate','Oversize','Last Shipment'],
            r => [r.Employee_ID, r.Employee_Name, r.Email_Address, r.Role_Name, r.Department_Name, `${r.Office_City}, ${r.Office_State}`, r.Total_Shipments, r.Total_Packages, r.Avg_Packages_Per_Shipment || '—', fmt(r.Total_Revenue), fmt(r.Avg_Revenue_Per_Shipment), fmtPct(r.Delivery_Success_Rate), r.Oversize_Packages, fmtDate(r.Last_Shipment_Date)]
          )}
            style={{ padding: '9px 18px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 10, cursor: 'pointer', fontWeight: 600, color: '#065f46' }}>
            ⬇ Download All
          </button>
        </div>

        {/* ── FILTERS ── */}
        {showFilters && (
          <div style={{ background: '#fff', border: '1px solid #dbe4ef', borderRadius: 16, padding: '20px 24px', marginBottom: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 6, color: '#374151' }}>Department</label>
              <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #dbe4ef', borderRadius: 8, fontSize: '0.88rem' }}>
                <option value="">All departments</option>
                {deptOpts.map(d => <option key={d.Department_ID} value={d.Department_ID}>{d.Department_Name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 6, color: '#374151' }}>Post Office</label>
              <select value={officeFilter} onChange={e => setOfficeFilter(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #dbe4ef', borderRadius: 8, fontSize: '0.88rem' }}>
                <option value="">All offices</option>
                {officeOpts.map(o => <option key={o.Post_Office_ID} value={o.Post_Office_ID}>{o.City}, {o.State}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 6, color: '#374151' }}>Date From</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #dbe4ef', borderRadius: 8, fontSize: '0.88rem', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 6, color: '#374151' }}>Date To</label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #dbe4ef', borderRadius: 8, fontSize: '0.88rem', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
              <button onClick={fetchAll}
                style={{ padding: '8px 20px', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>
                Apply
              </button>
              <button onClick={() => { setDeptFilter(''); setOfficeFilter(''); setDateFrom(''); setDateTo('') }}
                style={{ padding: '8px 14px', background: '#f8fafc', border: '1px solid #dbe4ef', borderRadius: 8, cursor: 'pointer', color: '#64748b' }}>
                Clear
              </button>
            </div>
          </div>
        )}

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: 16, color: '#991b1b', marginBottom: 24 }}>{error}</div>
        )}

        {/* ── SUMMARY CARDS ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
          <Card label="Active Employees"    value={totalEmp}                                          color="#1d4ed8" />
          <Card label="Total Shipments"     value={totalShips}                                        color="#0891b2" />
          <Card label="Total Packages"      value={totalPkgs}                                         color="#059669" />
          <Card label="Total Revenue"       value={`$${totalRev.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} color="#7c3aed" />
          <Card label="Top by Packages"     value={topEmp?.Employee_Name?.split(' ')[0] || '—'}       sub={`${topEmp?.Total_Packages || 0} packages`} color="#dc2626" />
          <Card label="Top by Revenue"      value={topRevEmp?.Employee_Name?.split(' ')[0] || '—'}    sub={`$${fmt(topRevEmp?.Total_Revenue || 0)}`} color="#d97706" />
          <Card label="Best Success Rate"   value={bestRate ? fmtPct(bestRate.Delivery_Success_Rate) : '—'} sub={bestRate?.Employee_Name?.split(' ')[0]} color="#065f46" />
          <Card label="Post Offices"        value={locations.length}                                  color="#4338ca" />
        </div>

        {/* ── EMPLOYEE PERFORMANCE TABLE ── */}
        <Section>
          <SectionHeader title="👤 Employee Performance" onDownload={() => downloadCSV(sorted, 'employee_performance',
            ['ID','Name','Role','Department','Office','Shipments','Packages','Avg Pkgs/Ship','Revenue','Avg Rev/Ship','Success Rate','Oversize','Last Shipment'],
            r => [r.Employee_ID, r.Employee_Name, r.Role_Name, r.Department_Name, `${r.Office_City}, ${r.Office_State}`, r.Total_Shipments, r.Total_Packages, r.Avg_Packages_Per_Shipment || 0, fmt(r.Total_Revenue), fmt(r.Avg_Revenue_Per_Shipment), fmtPct(r.Delivery_Success_Rate), r.Oversize_Packages, fmtDate(r.Last_Shipment_Date)]
          )} />
          <TableWrap>
            <thead>
              <tr>
                <Th onClick={() => handleSort('Employee_Name')}     sorted={si('Employee_Name')}>Employee</Th>
                <Th onClick={() => handleSort('Department_Name')}   sorted={si('Department_Name')}>Department</Th>
                <Th onClick={() => handleSort('Role_Name')}         sorted={si('Role_Name')}>Role</Th>
                <Th onClick={() => handleSort('Office_City')}       sorted={si('Office_City')}>Office</Th>
                <Th onClick={() => handleSort('Total_Shipments')}   sorted={si('Total_Shipments')}>Shipments</Th>
                <Th onClick={() => handleSort('Total_Packages')}    sorted={si('Total_Packages')}>Packages</Th>
                <Th onClick={() => handleSort('Avg_Packages_Per_Shipment')} sorted={si('Avg_Packages_Per_Shipment')}>Avg/Ship</Th>
                <Th onClick={() => handleSort('Total_Revenue')}     sorted={si('Total_Revenue')}>Revenue</Th>
                <Th onClick={() => handleSort('Delivery_Success_Rate')} sorted={si('Delivery_Success_Rate')}>Success %</Th>
                <Th onClick={() => handleSort('Oversize_Packages')} sorted={si('Oversize_Packages')}>Oversize</Th>
                <Th onClick={() => handleSort('Last_Shipment_Date')} sorted={si('Last_Shipment_Date')}>Last Shipment</Th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr><td colSpan={11} style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>No data found.</td></tr>
              ) : sorted.map((r, i) => (
                <tr key={r.Employee_ID} style={{ background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                  <Td><div style={{ fontWeight: 700 }}>{r.Employee_Name}</div><div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{r.Email_Address}</div></Td>
                  <Td>{r.Department_Name}</Td>
                  <Td>{r.Role_Name}</Td>
                  <Td>{r.Office_City}, {r.Office_State}</Td>
                  <Td center><Badge value={r.Total_Shipments} color="#0891b2" bg="#ecfeff" /></Td>
                  <Td center><Badge value={r.Total_Packages}  color="#059669" bg="#f0fdf4" /></Td>
                  <Td center>{r.Avg_Packages_Per_Shipment || '—'}</Td>
                  <Td bold blue>${fmt(r.Total_Revenue)}</Td>
                  <Td center>
                    <span style={{ color: r.Delivery_Success_Rate >= 80 ? '#059669' : r.Delivery_Success_Rate >= 50 ? '#d97706' : '#dc2626', fontWeight: 700 }}>
                      {fmtPct(r.Delivery_Success_Rate)}
                    </span>
                  </Td>
                  <Td center>{r.Oversize_Packages}</Td>
                  <Td>{fmtDate(r.Last_Shipment_Date)}</Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </Section>

        {/* ── EMPLOYEE BAR CHART ── */}
        <Section>
          <SectionHeader title="📊 Packages Processed per Employee" />
          {sorted.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>No data.</div>
          ) : sorted.map(r => (
            <HBar key={r.Employee_ID} label={r.Employee_Name} value={r.Total_Packages} max={maxPkgs} color="#1d4ed8" />
          ))}
        </Section>

        {/* ── LOCATION STATS ── */}
        <Section>
          <SectionHeader title="📍 Location Stats" onDownload={() => downloadCSV(locations, 'location_stats',
            ['Post Office ID','City','State','Address','Employees','Shipments','Packages','Revenue','Avg Price'],
            l => [l.Post_Office_ID, l.City, l.State, l.Full_Address, l.Total_Employees, l.Total_Shipments, l.Total_Packages, fmt(l.Total_Revenue), fmt(l.Avg_Package_Price)]
          )} />
          <TableWrap>
            <thead>
              <tr>
                <Th>Location</Th>
                <Th>Employees</Th>
                <Th>Shipments</Th>
                <Th>Packages</Th>
                <Th>Revenue</Th>
                <Th>Avg Package Price</Th>
              </tr>
            </thead>
            <tbody>
              {locations.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>No data.</td></tr>
              ) : locations.map((l, i) => (
                <tr key={l.Post_Office_ID} style={{ background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                  <Td><div style={{ fontWeight: 700 }}>{l.City}, {l.State}</div><div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{l.Full_Address}</div></Td>
                  <Td center><Badge value={l.Total_Employees} color="#4338ca" bg="#f5f3ff" /></Td>
                  <Td center><Badge value={l.Total_Shipments} color="#0891b2" bg="#ecfeff" /></Td>
                  <Td center><Badge value={l.Total_Packages}  color="#059669" bg="#f0fdf4" /></Td>
                  <Td bold blue>${fmt(l.Total_Revenue)}</Td>
                  <Td>${fmt(l.Avg_Package_Price)}</Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b', marginBottom: 12 }}>PACKAGES BY LOCATION</div>
            {locations.map(l => (
              <HBar key={l.Post_Office_ID} label={`${l.City}, ${l.State}`} value={Number(l.Total_Packages)} max={maxLocPkgs} color="#4338ca" />
            ))}
          </div>
        </Section>

        {/* ── DEPARTMENT BREAKDOWN ── */}
        <Section>
          <SectionHeader title="🏢 Department Breakdown" onDownload={() => downloadCSV(departments, 'department_stats',
            ['Department','Employees','Shipments','Packages','Revenue','Success Rate'],
            d => [d.Department_Name, d.Total_Employees, d.Total_Shipments, d.Total_Packages, fmt(d.Total_Revenue), fmtPct(d.Delivery_Success_Rate)]
          )} />
          <TableWrap>
            <thead>
              <tr>
                <Th>Department</Th>
                <Th>Employees</Th>
                <Th>Shipments</Th>
                <Th>Packages</Th>
                <Th>Revenue</Th>
                <Th>Success Rate</Th>
              </tr>
            </thead>
            <tbody>
              {departments.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>No data.</td></tr>
              ) : departments.map((d, i) => (
                <tr key={d.Department_ID} style={{ background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                  <Td><span style={{ fontWeight: 700 }}>{d.Department_Name}</span></Td>
                  <Td center><Badge value={d.Total_Employees} color="#4338ca" bg="#f5f3ff" /></Td>
                  <Td center><Badge value={d.Total_Shipments} color="#0891b2" bg="#ecfeff" /></Td>
                  <Td center><Badge value={d.Total_Packages}  color="#059669" bg="#f0fdf4" /></Td>
                  <Td bold blue>${fmt(d.Total_Revenue)}</Td>
                  <Td center>
                    <span style={{ color: d.Delivery_Success_Rate >= 80 ? '#059669' : d.Delivery_Success_Rate >= 50 ? '#d97706' : '#dc2626', fontWeight: 700 }}>
                      {fmtPct(d.Delivery_Success_Rate)}
                    </span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </Section>

        {/* ── ZONE TRAFFIC ── */}
        <Section>
          <SectionHeader title="🗺️ Zone Traffic" onDownload={() => downloadCSV(zones, 'zone_stats',
            ['Zone','Label','Packages','Revenue','Avg Price','Avg Weight','Oversize Count'],
            z => [z.Zone, ZONE_LABELS[z.Zone] || `Zone ${z.Zone}`, z.Total_Packages, fmt(z.Total_Revenue), fmt(z.Avg_Price), fmt(z.Avg_Weight), z.Oversize_Count]
          )} />
          <TableWrap>
            <thead>
              <tr>
                <Th>Zone</Th>
                <Th>Packages</Th>
                <Th>Revenue</Th>
                <Th>Avg Price</Th>
                <Th>Avg Weight</Th>
                <Th>Oversize</Th>
              </tr>
            </thead>
            <tbody>
              {zones.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>No data.</td></tr>
              ) : zones.map((z, i) => (
                <tr key={z.Zone} style={{ background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                  <Td><div style={{ fontWeight: 700 }}>{ZONE_LABELS[z.Zone] || `Zone ${z.Zone}`}</div></Td>
                  <Td center><Badge value={z.Total_Packages} color="#059669" bg="#f0fdf4" /></Td>
                  <Td bold blue>${fmt(z.Total_Revenue)}</Td>
                  <Td>${fmt(z.Avg_Price)}</Td>
                  <Td>{fmt(z.Avg_Weight)} lbs</Td>
                  <Td center>{z.Oversize_Count}</Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b', marginBottom: 12 }}>PACKAGES BY ZONE</div>
            {zones.map(z => (
              <HBar key={z.Zone} label={ZONE_LABELS[z.Zone] || `Zone ${z.Zone}`} value={Number(z.Total_Packages)} max={maxZonePkgs} color="#059669" />
            ))}
          </div>
        </Section>

      </div>
    </div>
  )
}