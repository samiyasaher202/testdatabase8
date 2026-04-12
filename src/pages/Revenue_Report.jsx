import { useState, useEffect, useCallback } from "react";
import './css/Revenue_Report.css';
import ColumnChart from "../components/column_chart";
import PieChart from "../components/pie_chart";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function DataReport() {
  // --- Filters ---
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [feeTypeFilter, setFeeTypeFilter] = useState("");

  // --- Data states ---
  const [revenueByMonth, setRevenueByMonth] = useState([]);
  const [feeBreakdown, setFeeBreakdown] = useState([]);
  const [allPackages, setAllPackages] = useState([]);
  const [allPayments, setAllPayments] = useState([]);
  const [allExcessFees, setAllExcessFees] = useState([]);

  // --- Summary stats ---
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [mostCommonFee, setMostCommonFee] = useState("");
  const [highestRevenueFee, setHighestRevenueFee] = useState("");

  // --- UI states ---
  const [loading, setLoading] = useState(false);
  const [activeTable, setActiveTable] = useState("feeBreakdown");
  const [sortConfig, setSortConfig] = useState({ key: "total_revenue", dir: "desc" });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);
      if (feeTypeFilter) params.append("feeType", feeTypeFilter);

      const [feeRes, packagesRes, paymentsRes, excessRes, monthRes] = await Promise.all([
        fetch(`${API_BASE}/api/report/fee-breakdown?${params}`),
        fetch(`${API_BASE}/api/report/packages?${params}`),
        fetch(`${API_BASE}/api/report/payments?${params}`),
        fetch(`${API_BASE}/api/report/excess-fees?${params}`),
        fetch(`${API_BASE}/api/report/revenue-by-month`),
      ]);
      if (!feeRes.ok) console.error(await feeRes.text());
      if (!paymentsRes.ok) console.error(await paymentsRes.text());
      if (!excessRes.ok) console.error(await excessRes.text());

      const feeData      = feeRes.ok      ? await feeRes.json()      : [];
      const packagesData = packagesRes.ok  ? await packagesRes.json() : [];
      const paymentsData = paymentsRes.ok  ? await paymentsRes.json() : [];
      const excessData   = excessRes.ok    ? await excessRes.json()   : [];
      const monthData    = monthRes.ok     ? await monthRes.json()    : [];

      setFeeBreakdown(feeData);
      setAllPackages(packagesData);
      setAllPayments(paymentsData);
      setAllExcessFees(excessData);
      setRevenueByMonth(monthData);

      if (feeData.length > 0) {
        const total = feeData.reduce((sum, row) => sum + parseFloat(row.total_revenue || 0), 0);
        setTotalRevenue(total);
        const mostCommon = feeData.reduce((a, b) =>
          (b.times_applied || 0) > (a.times_applied || 0) ? b : a
        );
        setMostCommonFee(mostCommon.fee_type || "N/A");
        const highest = feeData.reduce((a, b) =>
          parseFloat(b.total_revenue || 0) > parseFloat(a.total_revenue || 0) ? b : a
        );
        setHighestRevenueFee(highest.fee_type || "N/A");
      }
    } catch (err) {
      console.error("Error fetching report data:", err);
    }
    setLoading(false);
  }, [search, dateFrom, dateTo, feeTypeFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const sortedFeeBreakdown = [...feeBreakdown].sort((a, b) => {
    const aVal = parseFloat(a[sortConfig.key]) || a[sortConfig.key] || 0;
    const bVal = parseFloat(b[sortConfig.key]) || b[sortConfig.key] || 0;
    if (aVal < bVal) return sortConfig.dir === "asc" ? -1 : 1;
    if (aVal > bVal) return sortConfig.dir === "asc" ? 1 : -1;
    return 0;
  });

  const handleSort = (key) => {
    setSortConfig((prev) =>
      prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" }
    );
  };

  const fmt = (val) =>
    `$${parseFloat(val || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const SortArrow = ({ colKey }) => {
    if (sortConfig.key !== colKey) return <span> ↕</span>;
    return <span>{sortConfig.dir === "asc" ? " ↑" : " ↓"}</span>;
  };

  

  return (
    <div className="dr-root">

      {/* Header */}
      <div className="dr-header">
        <h1>Revenue Report</h1>
        <p>Excess fee revenue, packages, and payment records</p>
      </div>

      <div className="dr-body">

        {/* Summary Cards */}
        <div className="dr-cards">
          <div className="dr-card">
            <div className="dr-card-label">Total Excess Fee Revenue</div>
            <div className="dr-card-value">{fmt(totalRevenue)}</div>
          </div>
          <div className="dr-card">
            <div className="dr-card-label">Most Common Fee Type</div>
            <div className="dr-card-value small">{mostCommonFee || "—"}</div>
          </div>
          <div className="dr-card">
            <div className="dr-card-label">Highest Revenue Fee Type</div>
            <div className="dr-card-value small">{highestRevenueFee || "—"}</div>
          </div>
        </div>

        {/* Charts — pie + column side by side */}
        <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", alignItems: "stretch" }}>
          <div style={{ flex: 2 }} className="dr-table-wrap">
            <div className="dr-chart-wrap">
              <PieChart
                title="Fee Revenue Breakdown"
                slices={feeBreakdown.map((row) => ({
                  key: row.fee_type,
                  label: row.fee_type,
                }))}
                data={[
                  Object.fromEntries(
                    feeBreakdown.map((row) => [row.fee_type, parseFloat(row.total_revenue || 0)])
                  )
                ]}
              />
            </div>
          </div>
          <div style={{ flex: 3 }} className="dr-table-wrap">
            <div className="dr-chart-wrap">
              <ColumnChart
                title="Revenue Over Time"
                xKey="month"
                columns={[{ key: "revenue", label: "Excess Fee Revenue" }]}
                data={revenueByMonth}
              />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="dr-filters">
          <div className="dr-filter-group">
            <label className="dr-filter-label">Search (Fee Type / Package ID)</label>
            <input
              className="dr-input"
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="dr-filter-group">
            <label className="dr-filter-label">Date From</label>
            <input
              className="dr-input"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="dr-filter-group">
            <label className="dr-filter-label">Date To</label>
            <input
              className="dr-input"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <div className="dr-filter-group">
            <label className="dr-filter-label">Fee Type</label>
            <select
              className="dr-select"
              value={feeTypeFilter}
              onChange={(e) => setFeeTypeFilter(e.target.value)}
            >
              <option value="">All</option>
              <option value="Fragile Handling">Fragile Handling</option>
              <option value="Fuel Surcharge">Fuel Surcharge</option>
              <option value="Hazardous Material">Hazardous Material</option>
              <option value="Signature Required">Signature Required</option>
            </select>
          </div>
          <button className="dr-run-btn" onClick={fetchData} disabled={loading}>
            {loading ? "Loading..." : "Run Query"}
          </button>
        </div>

        {/* Tabs */}
        <div className="dr-tabs">
          {[
            { key: "feeBreakdown", label: "Fee Breakdown" },
            { key: "packages", label: "All Packages" },
            { key: "payments", label: "All Payments" },
            { key: "excessFees", label: "All Excess Fees" },
          ].map((tab) => (
            <button
              key={tab.key}
              className={`dr-tab ${activeTable === tab.key ? "active" : ""}`}
              onClick={() => setActiveTable(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Fee Breakdown Table */}
        {activeTable === "feeBreakdown" && (
          <div>
            <h2 className="dr-section-title">Excess Fee Revenue Breakdown</h2>
            <div className="dr-table-wrap">
              <table className="dr-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort("fee_type")}>Fee Type <SortArrow colKey="fee_type" /></th>
                    <th onClick={() => handleSort("total_revenue")}>Total Revenue <SortArrow colKey="total_revenue" /></th>
                    <th onClick={() => handleSort("times_applied")}>Times Applied <SortArrow colKey="times_applied" /></th>
                    <th onClick={() => handleSort("avg_fee")}>Average Fee <SortArrow colKey="avg_fee" /></th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={4}><div className="dr-spinner" /></td></tr>
                  ) : sortedFeeBreakdown.length === 0 ? (
                    <tr><td colSpan={4} className="dr-empty">No data</td></tr>
                  ) : (
                    sortedFeeBreakdown.map((row, i) => (
                      <tr key={i}>
                        <td><span className="dr-fee-badge">{row.fee_type}</span></td>
                        <td><span className="dr-amount">{fmt(row.total_revenue)}</span></td>
                        <td>{row.times_applied}</td>
                        <td><span className="dr-amount">{fmt(row.avg_fee)}</span></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* All Packages Table */}
        {activeTable === "packages" && (
          <div>
            <h2 className="dr-section-title">All Packages</h2>
            <div className="dr-table-wrap">
              <table className="dr-table">
                <thead>
                  <tr>
                    <th>Package ID</th>
                    <th>Type</th>
                    <th>Sender</th>
                    <th>Recipient</th>
                    <th>Weight</th>
                    <th>Price</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7}><div className="dr-spinner" /></td></tr>
                  ) : allPackages.length === 0 ? (
                    <tr><td colSpan={7} className="dr-empty">No data</td></tr>
                  ) : (
                    allPackages.map((row, i) => (
                      <tr key={i}>
                        <td><span className="dr-mono">{row.package_id}</span></td>
                        <td>{row.package_type}</td>
                        <td>{row.sender_name || row.sender_id}</td>
                        <td>{row.recipient_name || row.recipient_id}</td>
                        <td>{row.weight} lbs</td>
                        <td><span className="dr-amount">{fmt(row.price)}</span></td>
                        <td>{row.created_at ? new Date(row.created_at).toLocaleDateString() : "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* All Payments Table */}
        {activeTable === "payments" && (
          <div>
            <h2 className="dr-section-title">All Payments</h2>
            <div className="dr-table-wrap">
              <table className="dr-table">
                <thead>
                  <tr>
                    <th>Payment ID</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5}><div className="dr-spinner" /></td></tr>
                  ) : allPayments.length === 0 ? (
                    <tr><td colSpan={5} className="dr-empty">No data</td></tr>
                  ) : (
                    allPayments.map((row, i) => (
                      <tr key={i}>
                        <td><span className="dr-mono">#{row.payment_id}</span></td>
                        <td><span className="dr-amount">{fmt(row.amount)}</span></td>
                        <td>{row.payment_method}</td>
                        <td>{row.payment_status}</td>
                        <td>{row.payment_date ? new Date(row.payment_date).toLocaleDateString() : "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* All Excess Fees Table */}
        {activeTable === "excessFees" && (
          <div>
            <h2 className="dr-section-title">All Excess Fees</h2>
            <div className="dr-table-wrap">
              <table className="dr-table">
                <thead>
                  <tr>
                    <th>Package ID</th>
                    <th>Fee Type</th>
                    <th>Amount</th>
                    <th>Applied Date</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={4}><div className="dr-spinner" /></td></tr>
                  ) : allExcessFees.length === 0 ? (
                    <tr><td colSpan={4} className="dr-empty">No data</td></tr>
                  ) : (
                    allExcessFees.map((row, i) => (
                      <tr key={i}>
                        <td><span className="dr-mono">{row.package_id}</span></td>
                        <td><span className="dr-fee-badge">{row.fee_type}</span></td>
                        <td><span className="dr-amount">{fmt(row.amount)}</span></td>
                        <td>{row.applied_date ? new Date(row.applied_date).toLocaleDateString() : "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}