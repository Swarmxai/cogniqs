/** NDV field visibility — mirrors mindscrybe displayOptions + typeOptions rules. */

import { resolveCredType } from '../../lib/credentialTypes'

const SECRET_FIELD_NAMES = new Set([
  'apiKey', 'api_key', 'password', 'secret', 'token',
])

export function isPropertyVisible(prop, params) {
  if (prop.typeOptions?.hidden) return false
  if (prop.displayOptions?.hide) return false

  const show = prop.displayOptions?.show
  if (show) {
    const visible = Object.entries(show).every(([key, allowed]) => {
      const current = params[key]
      return Array.isArray(allowed) ? allowed.includes(current) : allowed === current
    })
    if (!visible) return false
  }

  if (params._credentialId && SECRET_FIELD_NAMES.has(prop.name)) {
    return false
  }

  return true
}

export function credentialTypes(nodeMeta) {
  const slots = nodeMeta?.credentials || []
  const types = new Set()
  for (const slot of slots) {
    for (const t of slot.types || []) types.add(t)
    if (slot.type) types.add(slot.type)
  }
  return [...types]
}

/** Match vault credential type against node slot types (handles Mindscrybe aliases). */
export function credentialMatchesNode(credType, allowedTypes) {
  const resolved = resolveCredType(credType)
  return allowedTypes.some((t) => resolveCredType(t) === resolved || t === credType)
}
