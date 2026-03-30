import { useState } from "react";

export default function BarebonesPriceCalculator() {
  const [weight, setWeight] = useState("");
  const [zone, setZone] = useState("");
  const [packageType, setPackageType] = useState("GEN");
  const [price, setPrice] = useState(null);
  const [error, setError] = useState(null);

  const fetchPrice = async () => {
    if (!weight || !zone) {
      setError("Please select weight and zone");
      setPrice(null);
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/price?weight=${weight}&zone=${zone}&packageType=${packageType}`
      );

      if (!response.ok) {
        const errData = await response.json();
        setError(errData.error || "Failed to fetch price");
        setPrice(null);
        return;
      }

      const data = await response.json();
      setPrice(data.price);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Server error");
      setPrice(null);
    }
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
            <option value="GEN">General</option>
            <option value="EXP">Expedited</option>
            <option value="OVR">Oversized</option>
          </select>
        </label>
      </div>

      <button onClick={fetchPrice}>Calculate Price</button>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {typeof price === "number" && <p>Price: ${price.toFixed(2)}</p>}
    </div>
  );
}