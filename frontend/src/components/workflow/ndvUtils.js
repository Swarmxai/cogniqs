/** NDV field visibility — mirrors mindscrybe displayOptions.show rules. */

export function isPropertyVisible(prop, params) {
  const show = prop.displayOptions?.show
  if (!show) return true
  return Object.entries(show).every(([key, allowed]) => {
    const current = params[key]
    return Array.isArray(allowed) ? allowed.includes(current) : allowed === current
  })
}
