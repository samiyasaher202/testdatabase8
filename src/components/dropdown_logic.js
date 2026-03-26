import { useState } from 'react'

export default function useDropdown(data) {
  //====================================================================================
  // any other functions we want to add for the dropdown menu, add here
  // add new types here and in Dropdown.jsx const configs section
  //====================================================================================
  const [filterValue, setFilterValue] = useState('')
  const [sortValue, setSortValue] = useState('')

  const filtered = data.filter(item => {
    if (filterValue === 'oversize') return item.Oversize === 1
    if (filterValue === 'signature') return item.Requires_Signature === 1
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    if (sortValue === 'weight_asc') return a.Weight - b.Weight
    if (sortValue === 'weight_desc') return b.Weight - a.Weight
    if (sortValue === 'price_asc') return a.Price - b.Price
    if (sortValue === 'price_desc') return b.Price - a.Price
    return 0
  })

  return { filtered: sorted, filterValue, setFilterValue, sortValue, setSortValue }
}