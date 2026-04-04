// db/package_type.js
// Pricing = base price (weight + zone) + box size surcharge + excess fee

// Box size tiers — surcharge added on top of base price
// A package gets the surcharge of the smallest tier ALL dimensions fit within
const BOX_TIERS = [
  { maxL: 12, maxW: 12, maxH: 12, surcharge: 0   },
  { maxL: 18, maxW: 18, maxH: 18, surcharge: 5   },
  { maxL: 24, maxW: 24, maxH: 24, surcharge: 10  },
  { maxL: 30, maxW: 30, maxH: 30, surcharge: 20  },
  // anything over 30x30x30 → rejected (handled in route)
]

// Returns surcharge amount, or null if package is too large
function getBoxSurcharge(dim_x, dim_y, dim_z) {
  const dx = Number(dim_x) || 0
  const dy = Number(dim_y) || 0
  const dz = Number(dim_z) || 0

  // No dimensions provided → no surcharge (treat as smallest box)
  if (dx === 0 && dy === 0 && dz === 0) return 0

  for (const tier of BOX_TIERS) {
    if (dx <= tier.maxL && dy <= tier.maxW && dz <= tier.maxH) {
      return tier.surcharge
    }
  }

  // Doesn't fit in any tier → rejected
  return null
}

function getPrice(pool, excess_fee, package_type, weight, zone, callback, dim_x, dim_y, dim_z) {
  const fee = excess_fee && String(excess_fee).trim() ? String(excess_fee).trim() : null
  const w   = Number(weight)
  const z   = Number(zone)
  const cub_in = dim_x *dim_y *dim_z

  // Check box size surcharge first
  const surcharge = getBoxSurcharge(dim_x, dim_y, dim_z)
  if (surcharge === null) {
    const err = new Error('Package dimensions exceed maximum allowed size of 30 x 30 x 30 inches')
    err.status = 400
    return callback(err, null)
  }

  pool.query(`
    SELECT pc.Price + IFNULL(e.Additional_Price, 0) AS Base_Price
    FROM package_type p
    INNER JOIN package_pricing pc ON p.Package_Type_Code = pc.Package_Type_Code
    LEFT JOIN excess_fee e ON (? IS NOT NULL AND e.Type_Name = ?)
    WHERE p.Type_Name = ?
      AND ? BETWEEN pc.Min_Weight AND pc.Max_Weight
      AND pc.Zone = ?
      AND ? <= pc.Max_Cubic_Inches
    LIMIT 1
  `, [fee, fee, package_type, w, z, cub_in])
  .then(([results]) => {
    if (!results?.length) return callback(null, [])
    // Add box surcharge to base price
    const total = Number(results[0].Base_Price) + surcharge
    callback(null, [{ Tot_Price: total }])
  })
  .catch(err => callback(err, null))
}

module.exports = { getPrice, getBoxSurcharge, BOX_TIERS }