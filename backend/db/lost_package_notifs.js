// lost_package_notifs.js

async function getLostPackagesByCustomer(pool, customerId) {
  const [rows] = await pool.query(
    `SELECT 
        p.Tracking_Number,
        p.Lost_Status,
        p.Date_Updated,
        d.Delivery_ID,
        s.Shipment_ID
     FROM package p
     LEFT JOIN delivery d ON d.Tracking_Number = p.Tracking_Number
     LEFT JOIN shipment_package sp ON sp.Tracking_Number = p.Tracking_Number
     LEFT JOIN shipment s ON s.Shipment_ID = sp.Shipment_ID
     WHERE p.Recipient_ID = ?
       AND p.Lost_Status = 'lost'`,
    [customerId]
  );

  return rows;
}

async function dismissLostPackage(pool, trackingNumber) {
  const [result] = await pool.query(
    `UPDATE package
     SET Lost_Status = 'notified'
     WHERE Tracking_Number = ?
       AND Lost_Status = 'lost'`,
    [trackingNumber]
  );

  return result;
}

module.exports = {
  getLostPackagesByCustomer,
  dismissLostPackage,
};