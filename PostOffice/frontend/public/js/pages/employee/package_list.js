function PackageList() {
  const [packages, setPackages] = React.useState([])
  const [loading, setLoading] = React.useState(true)
    const { filtered, filterValue, setFilterValue, sortValue, setSortValue } = DropdownLogic(packages)

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

    <div className="dropdowns-bar">
      <Dropdown
        type="filter"
        options={[
          { value: 'oversize', label: 'Oversize Only' },
          { value: 'signature', label: 'Requires Signature' },
        ]}
        value={filterValue}
        onChange={val => setFilterValue(val)}
      />
      <Dropdown
        type="sort"
        options={[
          { value: 'weight_asc', label: 'Weight (Low to High)' },
          { value: 'weight_desc', label: 'Weight (High to Low)' },
          { value: 'price_asc', label: 'Price (Low to High)' },
          { value: 'price_desc', label: 'Price (High to Low)' },
        ]}
        value={sortValue}
        onChange={val => setSortValue(val)}
      />
    </div>

    {loading ? (
  <p>Loading packages...</p>
) : filtered.length === 0 ? (
  <p>No packages found</p>
) : (
  <Table data={filtered} />
)}

    
  </Layout>
)
}
ReactDOM.createRoot(document.getElementById('root')).render(<PackageList />)