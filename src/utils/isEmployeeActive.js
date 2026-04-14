/**
 * Active row: API should send Is_Active as 1 (see normalizeEmployeeIsActiveForApi).
 * Only explicit “on” values count as current; everything else → past table.
 */
export function isEmployeeActive(r) {
  const v = r?.Is_Active ?? r?.is_Active ?? r?.is_active
  return v === 1 || v === true || v === '1'
}
