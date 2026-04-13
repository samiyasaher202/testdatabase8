/**
 * End-to-end stale shipment → LOST → customer notification
 *
 * 1) `CALL sp_mark_stale_packages_lost()` (migration 008): packages on a leg that has at least one
 *    `shipment_routing_event` (arrival/departure) whose latest Event_Time is older than 14 days;
 *    delivery not already final → set delivery + shipment to LOST. (No routing scans = not eligible.)
 * 2) Trigger `tr_delivery_au_notify_package_lost` inserts one `customer_package_alert` row for the
 *    sender only (email + in-app via GET /api/customer/my-package-alerts).
 * 3) `processPackageLostAlerts` sends optional SMTP email (see lost_alert_mailer.js + .env) and
 *    sets Processed_At; always logs. Customers also see alerts via GET /api/customer/my-package-alerts.
 */

const lostAlertMailer = require('./lost_alert_mailer')

const DEFAULT_INTERVAL_MS = 24 * 60 * 60 * 1000

async function runStaleShipmentLostProcedure(pool) {
  try {
    await pool.query('CALL sp_mark_stale_packages_lost()')
  } catch (e) {
    if (e.errno === 1305 || String(e.message || '').includes('does not exist')) {
      return { ran: false, reason: 'procedure_missing' }
    }
    if (e.code === 'ER_NO_SUCH_TABLE') {
      return { ran: false, reason: 'table_missing' }
    }
    throw e
  }
  return { ran: true }
}

/**
 * Deliver queued rows: optional SMTP to customer, log line, then mark Processed_At.
 * If SMTP is configured and send fails, leaves Processed_At NULL so the next sweep retries.
 * @returns {Promise<{ processed: number, emailed: number, failed: number }>}
 */
async function processPackageLostAlerts(pool, options = {}) {
  const limit = Math.min(Math.max(Number(options.limit) || 100, 1), 500)
  try {
    const [rows] = await pool.query(
      `SELECT Alert_ID, Customer_ID, Tracking_Number, Email_Address, Message_Text, Created_At
       FROM customer_package_alert
       WHERE Processed_At IS NULL
       ORDER BY Created_At ASC
       LIMIT ?`,
      [limit]
    )
    let processed = 0
    let emailed = 0
    let failed = 0
    const logFn = options.log || console.log
    const smtpOn = lostAlertMailer.smtpConfigured() && String(process.env.MAIL_FROM || '').trim()

    for (const r of rows) {
      logFn(
        '[package_lost_alert]',
        `to=${r.Email_Address}`,
        `tracking=${r.Tracking_Number}`,
        `alert_id=${r.Alert_ID}`,
        r.Message_Text
      )

      let markDone = true
      if (smtpOn) {
        try {
          await lostAlertMailer.sendLostPackageEmail({
            to: r.Email_Address,
            subject: `Package ${r.Tracking_Number} — status update`,
            text: r.Message_Text,
          })
          emailed += 1
        } catch (err) {
          console.error('[package_lost_alert] email failed', r.Alert_ID, err.message || err)
          markDone = false
          failed += 1
        }
      }

      if (markDone) {
        await pool.query(`UPDATE customer_package_alert SET Processed_At = NOW() WHERE Alert_ID = ?`, [
          r.Alert_ID,
        ])
        processed += 1
      }
    }
    return { processed, emailed, failed }
  } catch (e) {
    if (e.code === 'ER_NO_SUCH_TABLE') {
      return { processed: 0, emailed: 0, failed: 0, skipped: true }
    }
    throw e
  }
}

async function runStaleShipmentLostSweep(pool, options = {}) {
  const proc = await runStaleShipmentLostProcedure(pool)
  const alerts = await processPackageLostAlerts(pool, options)
  return { procedure: proc, alerts }
}

function startStaleShipmentLostJob(pool, options = {}) {
  const intervalMs = Number(options.intervalMs) > 0 ? Number(options.intervalMs) : DEFAULT_INTERVAL_MS
  const runOnStart = options.runOnStart !== false

  let timer = null

  async function tick() {
    try {
      const out = await runStaleShipmentLostSweep(pool)
      if (out.procedure.ran && (out.alerts.processed > 0 || out.alerts.failed > 0)) {
        console.log(
          `[stale_shipment_lost_job] alerts processed=${out.alerts.processed} emailed=${out.alerts.emailed} email_failed=${out.alerts.failed}`
        )
      }
    } catch (err) {
      console.error('[stale_shipment_lost_job]', err.message || err)
    }
  }

  if (runOnStart) {
    setImmediate(() => {
      tick()
    })
  }

  timer = setInterval(tick, intervalMs)

  return () => {
    if (timer) clearInterval(timer)
    timer = null
  }
}

module.exports = {
  runStaleShipmentLostProcedure,
  processPackageLostAlerts,
  runStaleShipmentLostSweep,
  startStaleShipmentLostJob,
}
