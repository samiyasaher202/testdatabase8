function DropdownLogic(data) {
    //====================================================================================
    // any other functions we want to add for the dropdown menu, add here
    //=======================================================================================
  const [filterValue, setFilterValue] = React.useState('')
  const [sortValue, setSortValue] = React.useState('')

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