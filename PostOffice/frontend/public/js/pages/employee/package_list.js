function PackageList() {
  const [packages, setPackages] = React.useState([])
  const [loading, setLoading] = React.useState(true)


React.useEffect(() => {
  fetch('qry_all_packages')
    .then(res => {
      if (!res.ok) throw new Error('No packages found');
      return res.json();
    })
    .then(data => {
      setPackages(data);
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setLoading(false);
    });
}, []);

//tester
// React.useEffect(() => {
//   const testData = [{ Tracking_Number: "PKG000001", Weight: "2.50" }];
//   setPackages(testData);
//   setLoading(false);
// }, []);

  return (
    <Layout buttonLabel="Back" buttonHref="/employee_home">
      <h2>Package List</h2>

      {loading ? (
        <p>Loading packages...</p>
      ) : packages.length === 0 ? (
        <p>No packages found</p>
      ) : (
        <Table data={packages} />
      )}
    </Layout>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<PackageList />)