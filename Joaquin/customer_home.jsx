import "./customer_home.css";

export default function CustomerHome() {
  return (
    <>
      <header className="navbar">
        <h1>Post Office 8</h1>

        <nav>
          <a href="/home.html">Home</a>
          <a href="#">Track Package</a>
          <a href="#">Send Package</a>
          <a href="#">History</a>
          <a href="#">Store</a>
          <a href="#">Logout</a>
        </nav>
      </header>

      <main>
        {/* Top Image */}
        <div className="hero">
          <img src="houston-skyline.jpeg" alt="Post Office" />
        </div>

        <div className="welcome">
          <h2>Welcome, Customer!</h2>
        </div>

        {/* Dashboard Cards */}
        <div className="dashboard">
          <div className="card">
            <h2>Track a Package</h2>
            <p>See where your package is in real time.</p>
            <a href="#" className="button">Track Now</a>
          </div>

          <div className="card">
            <h2>Send a Package</h2>
            <p>Ship your packages quickly and safely</p>
            <a href="#" className="button">Send Now</a>
          </div>

          <div className="card">
            <h2>Account Info</h2>
            <p>View your address, saved packages, and profile settings.</p>
            <a href="#" className="button">View Account</a>
          </div>
        </div>
      </main>

      <footer>
        <p>Database Team 8</p>
      </footer>
    </>
  );
}