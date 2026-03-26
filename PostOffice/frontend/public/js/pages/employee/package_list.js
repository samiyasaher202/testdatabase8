// error catch: puts error on website when things go wrong
window.onerror = function(msg, src, line) {
  document.getElementById('root').innerHTML = 
    '<p style="color:red;padding:2rem;">ERROR: ' + msg + ' (line ' + line + ')</p>'
}

function PackageList() {
    const [packages, setPackages] = React.useState([])
    const [loading, setLoading] = React.useState(true)
    const { filtered, filterValue, setFilterValue, sortValue, setSortValue } = DropdownLogic(packages)

// error banner test, set to null if you dont want it there immediatly
const [error, setError] = React.useState('This is a test popup and needs to be deleted later')

// grabbing the query used to find all the packages
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

 

return (
    // layout lets the button in the top right corner be customized
  <Layout buttonLabel="Back" buttonHref="/employee_home" width="full">
        <h2>Package List</h2>

        <ErrorBanner message={error} onClose={() => setError(null)} />

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
