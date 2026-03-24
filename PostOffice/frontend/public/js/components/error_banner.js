function ErrorBanner({ message, onClose }) {
  if (!message) return null

  return (
    <div className="error-banner">
      <span className="error-banner-message">{message}</span>
      <button className="error-banner-close" onClick={onClose}>✕</button>
    </div>
  )
}

//###############################
//USAGE EXAMPLE
//############################

// const [error, setError] = React.useState(null)

// // trigger it in your catch block
// .catch(err => {
//   console.error(err);
//   setError('Failed to load packages. Please try again.');
//   setLoading(false);
// });

// // place it in your return
// return (
//   <Layout buttonLabel="Back" buttonHref="/employee_home">
//     <ErrorPopup message={error} onClose={() => setError(null)} />
//     <h2>Package List</h2>
//     ...
//   </Layout>
// )