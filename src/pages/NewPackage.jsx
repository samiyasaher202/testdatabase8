import { useState, useEffect } from "react";


export default function PriceCalculator() {
  const [packageTypes, setPackageTypes] = useState([]);
  const [excessFees, setExcessFees] = useState([]);
  const [packageType, setPackageType] = useState("");
  const [excessFee, setExcessFee] = useState("");
  const [weight, setWeight] = useState("");
  const [zone, setZone] = useState("");
  const [price, setPrice] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
      fetch(`${import.meta.env.VITE_API_URL}/api/package_types`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load packages");
          return res.json();
        })
        //.then((data) => setPackageTypes(data))
        
        .then((data) => {
         console.log("package types:", data); // add this
        setPackageTypes(data);
        //.catch((err) => setError(err.message));
})

      fetch(`${import.meta.env.VITE_API_URL}/api/excess_fees`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to load excess fees");
        return res.json();
      })
      .then(data => setExcessFees(data))
      .catch(err => setError(err.message));
  }, []);

  const fetchPrice =() =>{
    fetch(`${import.meta.env.VITE_API_URL}/api/price?excess_fee=${excessFee}&package_type=${packageType}&weight=${weight}&zone=${zone}`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to load package Price");
        return res.json();
      })
      .then(data => setPrice(data.Tot_Price))
      .catch(err => setError(err.message));
  };

  return (
    <div>
      <h2>Package Price Calculator</h2>

      <div>
        <label>
          Weight:
          <input
            type="number"
            min="0"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </label>
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

      <div>
        <label>
          Package Type:
          <select
            value={packageType}
            onChange={(e) => setPackageType(e.target.value)}
          >
            <option value="">Select Package Type</option>
            {packageTypes.map(row =>(
              <option key={row.Type_Name} value={row.Type_Name}>{row.Type_Name}</option>
            ))}
          </select>
        </label>
      </div>
      <div>
        <label>
          Excess Fee:
          <select
            value={excessFee}
            onChange={(e) => setExcessFee(e.target.value)}
          >
            <option value="">Select Excess Fee</option>
            {excessFees.map(row =>(
              <option key = {row.Type_Name} value={row.Type_Name}>{row.Type_Name}</option>
            ))}
          </select>
        </label>
      </div>

      <button onClick={fetchPrice}>Calculate Price</button>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {typeof price === "number" && <p>Price: ${price.toFixed(2)}</p>}
    </div>
  );
}