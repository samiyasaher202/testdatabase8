import { useState, useEffect } from "react";
import "./css/packages.css";
import skyline from "../assets/houston-skyline.jpeg";
import React from "react";
//import { useParams } from 'react-router-dom' 

export default function PackageTracking() {
  const [ trackingNumber, setTrackingNumber ] = useState("")
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  function handleSearch() {
    console.log("handleSearch fired, trackingNumber:", trackingNumber)
    if (!trackingNumber.trim()) return;
    setLoading(true);
    setError(null);
    setResults(null);

    fetch(`http://localhost:5000/api/packages/${trackingNumber.trim()}/tracking`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch tracking info");
        return res.json();
      })
      .then((data) => {
        setResults(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }

  function statusBadge(status) {
    const s = (status || "").toLowerCase();
    const style = s.includes("deliver") ? { background: "#d1fae5", color: "#065f46" }
      : s.includes("transit")           ? { background: "#dbeafe", color: "#1e40af" }
      : s.includes("delay")             ? { background: "#fee2e2", color: "#991b1b" }
      :                                   { background: "#fef9c3", color: "#854d0e" };
    return (
      <span className="status-badge" style={style}>
        {status || "Unknown"}
      </span>
    );
  }

  const shipments = (results || []).filter(r => r.Instance_Type === "Shipment");
  const delivery  = (results || []).find(r  => r.Instance_Type === "Delivery");

  return (
    <>
      <header className="navbar">
        <h1>Post Office 8</h1>
        <nav>
          <a href="/">Home</a>
          <a href="/login">Login</a>
        </nav>
      </header>

      <main>
        <div className="hero">
          <img src={skyline} alt="Post Office" />
        </div>

        <div className="page-content">
          <h2>Package Tracking</h2>

          Search bar
          <div className="controls-bar">
            <input
              type="text"
              className="search-input"
              placeholder="Enter tracking number..."
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <button className="button" onClick={handleSearch}>
              Track
            </button>
            
          </div>

          {/* Error */}
          {error && (
            <div className="error-banner">
              <span>{error}</span>
              <button onClick={() => setError(null)}>✕</button>
            </div>
          )}

          {/* Loading */}
          {loading && <p className="state-msg">Looking up tracking number...</p>}

          {/* No results */}
          {results && results.length === 0 && (
            <p className="state-msg">No tracking information found for <code>{trackingNumber}</code>.</p>
          )}

          {/* Shipments table */}
          {shipments.length > 0 && (
            <>
              <h3 style={{ marginTop: "2rem" }}>Shipment Legs</h3>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Shipment ID</th>
                      <th>Status</th>
                      <th>From Address</th>
                      <th>To Address</th>
                      <th>Departed</th>
                      <th>Arrived</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shipments.map((s) => (
                      <tr key={s.Shipment_ID}>
                        <td><code>{s.Shipment_ID}</code></td>
                        <td>{statusBadge(s.Status_Name)}</td>
                        <td>{s.From_Full_Address || "—"}</td>
                        <td>{s.To_Full_Address || "—"}</td>
                        <td>{s.Departure_Time_Stamp ? new Date(s.Departure_Time_Stamp).toLocaleString() : "—"}</td>
                        <td>{s.Arrival_Time_Stamp   ? new Date(s.Arrival_Time_Stamp).toLocaleString()   : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Delivery section */}
          {delivery && (
            <>
              <h3 style={{ marginTop: "2rem" }}>Delivery</h3>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Delivery ID</th>
                      <th>Status</th>
                      <th>Delivered Date</th>
                      <th>Signature Received</th>
                      <th>Final</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><code>{delivery.Shipment_ID}</code></td>
                      <td>{statusBadge(delivery.Status_Name)}</td>
                      <td>{delivery.Delivered_Date ? new Date(delivery.Delivered_Date).toLocaleString() : "—"}</td>
                      <td>{delivery.Signature_Received || "—"}</td>
                      <td>{delivery.Is_Final_Status ? "✅ Final" : "🔄 In Progress"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </main>

      <footer>
        <p>Database Team 8</p>
      </footer>
    </>
  );
}