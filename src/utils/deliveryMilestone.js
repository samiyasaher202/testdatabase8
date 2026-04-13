/** Matches backend `isDeliveredStatusName` — delivery row status, not shipment leg name. */
export function isDeliveredStatusNameClient(name) {
  const s = String(name || '')
    .trim()
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
  return s === 'delivered'
}

function firstNonEmpty(...vals) {
  for (const v of vals) {
    const s = String(v ?? '').trim()
    if (s) return s
  }
  return ''
}

/** Build one line from explicit recipient columns (fallback if SQL alias missing / null). */
function recipientLineFromParts(pkg) {
  if (!pkg) return ''
  const hn = pkg.Recipient_House_Number ?? pkg.recipient_house_number
  const st = pkg.Recipient_Street ?? pkg.recipient_street
  const line1 = firstNonEmpty([hn, st].filter(Boolean).join(' ').trim())
  const apt = firstNonEmpty(pkg.Recipient_Apt_Number ?? pkg.recipient_apt_number)
  const a1 = apt && line1 ? `${line1} Apt ${apt}` : line1 || (apt ? `Apt ${apt}` : '')
  const city = pkg.Recipient_City ?? pkg.recipient_city
  const state = pkg.Recipient_State ?? pkg.recipient_state
  const citySt = firstNonEmpty([city, state].filter(Boolean).join(', '))
  const z3 = pkg.Recipient_Zip_First3 ?? pkg.recipient_zip_first3
  const z2 = pkg.Recipient_Zip_Last2 ?? pkg.recipient_zip_last2
  const zip = firstNonEmpty(`${z3 ?? ''}${z2 ?? ''}`.trim())
  let s = firstNonEmpty(
    [a1, citySt].filter(Boolean).join(', '),
    citySt,
    a1
  )
  if (zip) s = s ? `${s} ${zip}` : zip
  return s.trim()
}

export function recipientLineFromPackagePayload(pkg) {
  if (!pkg) return 'Recipient address on file'
  const fromSql = firstNonEmpty(
    pkg.Recipient_Address_Line,
    pkg.recipient_address_line,
    pkg.Leg_Destination_Address,
    pkg.leg_destination_address
  )
  if (fromSql) return fromSql
  const built = recipientLineFromParts(pkg)
  if (built) return built
  return 'Recipient address on file'
}

function isDeliveredRow(r) {
  return String(r.Event_Type || '').toLowerCase() === 'delivered'
}

function timeMs(ev) {
  if (!ev?.Event_Time) return null
  const t = new Date(ev.Event_Time).getTime()
  return Number.isFinite(t) ? t : null
}

/** Oldest → newest within each group; all `delivered` rows always after transit/office rows. */
export function sortRoutingDeliveredLast(events) {
  const list = Array.isArray(events) ? [...events] : []
  const nonDel = list.filter((r) => !isDeliveredRow(r))
  const del = list.filter((r) => isDeliveredRow(r))
  const byTimeThenId = (a, b) => {
    const ta = timeMs(a)
    const tb = timeMs(b)
    if (ta != null && tb != null && ta !== tb) return ta - tb
    if (ta != null && tb == null) return -1
    if (ta == null && tb != null) return 1
    return (Number(a.Event_ID) || 0) - (Number(b.Event_ID) || 0)
  }
  nonDel.sort(byTimeThenId)
  del.sort(byTimeThenId)
  return [...nonDel, ...del]
}

function fillDeliveredEventTimes(sorted, packagePayload) {
  const maxNonDel = Math.max(0, ...sorted.filter((r) => !isDeliveredRow(r)).map((r) => timeMs(r) || 0))
  let fb = timeMs({ Event_Time: packagePayload?.Delivered_Date })
  if (fb == null) fb = maxNonDel ? maxNonDel + 1000 : Date.now()
  return sorted.map((r) => {
    if (!isDeliveredRow(r)) return r
    if (timeMs(r) != null) return r
    return { ...r, Event_Time: new Date(fb).toISOString() }
  })
}

/**
 * Ensures a "delivered" timeline row appears when the package's delivery status is Delivered,
 * even if no DB routing row exists (no migration, no shipment leg, or API error).
 */
export function mergeRoutingWithDeliveredMilestone(apiEvents, packagePayload) {
  let list = Array.isArray(apiEvents) ? [...apiEvents] : []
  if (!packagePayload || !isDeliveredStatusNameClient(packagePayload.Status_Name)) {
    return sortRoutingDeliveredLast(list)
  }
  const addr = recipientLineFromPackagePayload(packagePayload)
  if (!list.some(isDeliveredRow)) {
    list.push({
      Event_ID: -1,
      Shipment_ID: packagePayload.Shipment_ID_For_Display ?? null,
      Event_Type: 'delivered',
      Event_Time: packagePayload.Delivered_Date || null,
      Office_Label: addr,
      Street: null,
    })
  }
  list = list.map((r) => {
    if (!isDeliveredRow(r)) return r
    const cur = String(r.Office_Label || r.Location_Description || '').trim()
    if (cur && cur !== 'Recipient address on file') return r
    return { ...r, Office_Label: addr, Location_Description: r.Location_Description ?? addr }
  })
  return fillDeliveredEventTimes(sortRoutingDeliveredLast(list), packagePayload)
}
