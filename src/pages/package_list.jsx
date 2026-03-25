import { useState, useEffect } from 'react'
import Layout from '../layout'
import ErrorBanner from '../components/error_banner'
import Dropdown from '../components/dropdown'
import Table from '../components/table'
import useDropdown from '../components/dropdown_logic'

export default function PackageList() {
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(true)
  const { filtered, filterValue, setFilterValue, sortValue, setSortValue } = useDropdown(packages)

  // error banner test, set to null if you don't want it there immediately
  const [error, setError] = useState('This is a test popup and needs to be deleted later')

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/qry_all_packages`)
      .then(res => {
        if (!res.ok) throw new Error('No packages found')
        return res.json()
      })
      .then(data => {
        setPackages(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  return (
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
// probably important
// VITE_API_URL=http://localhost:3001