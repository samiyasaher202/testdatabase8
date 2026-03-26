function Dropdown({ type, options, value, onChange }) {

  const config = {
    filter: {
      label: 'Filter',
      placeholder: 'All',
    },
    sort: {
      label: 'Sort By',
      placeholder: 'Default',
    },
    // add new types here later
  }

  const { label, placeholder } = config[type]

  return (
    <div className="dropdown-wrapper">
      <label className="dropdown-label">{label}</label>
      <select
        className="dropdown-select"
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        <option value="">{placeholder}</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}