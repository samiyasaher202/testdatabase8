function getAllPackages(db, callback) {
  db.query('SELECT * FROM package', callback)
}


// not where this belongs but placed here for now untill we figure out how we want to seperate the queries
function getAllCustomers(db, callback){
  db.query('SELECT * FROM customer', callback)
}

module.exports = {
  getAllPackages,
  getAllCustomers

}