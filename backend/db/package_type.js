const { default: NewPackage } = require("../../src/pages/new_package")

function getPrice(pool, excess_fee, package_type, weight, zone, callback) {
    
    pool.query(`
        SELECT pc.Price + IFNULL(e.Additional_Price, 0) AS Tot_Price
        FROM package_type p
        JOIN package_pricing pc ON p.Package_Type_Code = pc.Package_Type_Code
        LEFT JOIN excess_fee e ON  e.Type_Name = ?
        WHERE p.Type_Name = ?
        AND ? BETWEEN pc.Min_Weight AND pc.Max_Weight
        AND pc.Zone = ?;
        `,
        [excess_fee || null, package_type, weight, zone]
    )
    .then(([results]) => callback(null, results))
    .catch(err => callback(err, null))
}
function NewPackage(pool, Sender_ID, Recipient_ID, Dim_X, Dim_Y, Dim_Z, Package_Type_Code, Weight, Zone, Oversize, Requires_Signiture, Price){
     const missing = []
  if (!Sender_ID) missing.push('Sender_ID')
  if (!Recipient_ID) missing.push('Recipient_ID')
  if (!Dim_X) missing.push('Dim_X')
  if (!Dim_Y) missing.push('Dim_Y')
  if (!Dim_Z) missing.push('Dim_Z')
  if (!Package_Type_Code) missing.push('Package_Type_Code')
  if (!Weight) missing.push('Weight')
  if (!Zone) missing.push('Zone')
  if (!Oversize) missing.push('Oversize')
  if (!Requires_Signiture) missing.push('Requires_Signiture')
  if (!Price) missing.push('Price')
  
  if (missing.length) {
    const err = new Error(`Missing required fields: ${missing.join(', ')}`)
    err.status = 400
    err.code = 'VALIDATION'
    throw err
  }
    pool.query(`
        INSERT INTO Package(
        Sender_ID, Recipient_ID,
        Dim_x, Dim_Y, Dim_z, Package_Type_Code, Weight, Zone, 
        Oversize, Requires_Signiture, Price
        )
        VALUES(?,?,?,?,?,?,?,?,?,?,?)
    `)
}
module.exports = {getPrice, NewPackage}