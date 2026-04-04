const { default: NewPackage } = require("../../src/pages/new_package")

function getPrice(pool, excess_fee, package_type, weight, zone, callback) {
  const fee =
    excess_fee && String(excess_fee).trim() ? String(excess_fee).trim() : null
  const w = Number(weight)
  const z = Number(zone)

  pool
    .query(
      `
    SELECT pc.Price + IFNULL(e.Additional_Price, 0) AS Tot_Price
    FROM package_type p
    INNER JOIN package_pricing pc ON p.Package_Type_Code = pc.Package_Type_Code
    LEFT JOIN excess_fee e ON (? IS NOT NULL AND e.Type_Name = ?)
    WHERE p.Type_Name = ?
      AND ? BETWEEN pc.Min_Weight AND pc.Max_Weight
      AND pc.Zone = ?
    LIMIT 1
    `,
      [fee, fee, package_type, w, z]
    )
    .then(([results]) => callback(null, results))
    .catch((err) => callback(err, null))
}
module.exports = { getPrice }
