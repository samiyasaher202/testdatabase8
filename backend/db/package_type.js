function getPackageTypes(pool, callback){
    pool.query(`
        SELECT p.Type_Name
        FROM package_type p
        ORDER BY p.Type_Name;
    `)
    .then(([results]) => callback(null, results))
    .catch(err => callback(err, null))
}
function getExcessFees(pool, callback){
    pool.query(`
        SELECT e.Type_Name
        FROM excess_fee e
        ORDER BY e.Type_Name;
        `)
    .then(([results]) => callback(null, results))
    .catch(err => callback(err, null))  
}
function getPrice(pool, excess_fee, package_type, weight, zone, callback) {
  pool.query(`
    SELECT pc.Price + IFNULL(e.Additional_Price, 0) AS Tot_Price
    FROM package_type p
    JOIN package_pricing pc ON p.Package_Type_Code = pc.Package_Type_Code
    LEFT JOIN excess_fee e ON e.Type_Name = ?
    WHERE p.Type_Name = ?
      AND ? BETWEEN pc.Min_Weight AND pc.Max_Weight
      AND pc.Zone = ?;
    `,
    [excess_fee, package_type, weight, zone]
  )
  .then(([results]) => callback(null, results))
  .catch(err => callback(err, null))
}
module.exports = { getPackageTypes, getExcessFees, getPrice}