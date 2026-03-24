/* #######################################
IMCOMPLETE
have not added technicalities yet
########################################### */


function TextInput({ label, placeholder, value, onChange, onSubmit, buttonLabel = "Submit" }) {
  return (
    <div className="text-input-wrapper">
      {label && <label className="text-input-label">{label}</label>}
      <div className="text-input-row">
        <input
          className="text-input-field"
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onSubmit()}
        />
        <button className="text-input-btn" onClick={onSubmit}>
          {buttonLabel}
        </button>
      </div>
    </div>
  )
}